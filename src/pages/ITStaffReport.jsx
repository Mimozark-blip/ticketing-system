import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Menu, X, Bell } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
// import { CSVLink } from "react-csv";
import { Table, Button } from "flowbite-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";

const ItStaffReport = () => {
  const [tickets, setTickets] = useState([]);
  //   const [filteredTickets, setFilteredTickets] = useState([]);
  //   const [filterStatus, setFilterStatus] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  //   const [isModalOpen, setIsModalOpen] = useState(false);
  const [openTickets, setOpenTickets] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevTicketCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const q = query(
        collection(db, "assigned-tickets"),
        where("status", "==", "In Progress"),
        where("assignee", "==", currentUser.email)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const openTicketsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOpenTickets(openTicketsData);
      });

      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (openTickets.length > prevTicketCountRef.current) {
      setAnimate(true);
      playNotificationSound();
      setTimeout(() => setAnimate(false), 1000);
    }
    prevTicketCountRef.current = openTickets.length;
  }, [openTickets.length]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeFirestore;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);

      if (!user) return;
      // Query to fetch only resolved tickets
      const q = query(
        collection(db, "assigned-tickets"),
        where("status", "==", "Resolved"),
        where("assignee", "==", user.email)
      );

      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setTickets([]);
          return;
        }

        const fetchedTickets = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            adminId: data.AdminId || "Unknown",
            userId: data.UserId || "Unknown",
            assignee: data.assignee || "Unassigned",
            category: data.category || "Uncategorized",
            description: data.description || "No Description",
            issueColor: data.issueColor || "bg-gray-500",
            priority: data.priority || "Low",
            status: "Resolved", // Explicitly set status to Resolved
            createdAt: data.createdAt
              ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
              : "Unknown Date",
          };
        });

        setTickets(fetchedTickets);
      });
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [db]);

  useEffect(() => {
    const auth = getAuth();
    setUser(auth.currentUser);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const [filter, setFilter] = useState("weekly");

  // for table
  const filterTickets = (tickets) => {
    const now = dayjs();
    return tickets.filter((ticket) => {
      const ticketDate = dayjs(ticket.createdAt);
      if (filter === "weekly") {
        return ticketDate.isAfter(now.subtract(1, "week"));
      } else if (filter === "monthly") {
        return ticketDate.isAfter(now.subtract(1, "month"));
      } else if (filter === "yearly") {
        return ticketDate.isAfter(now.subtract(1, "year"));
      }
      return true;
    });
  };
  const handlePrint = () => {
    const element = document.getElementById("content-to-print");

    const options = {
      margin: [20, 20, 30, 20], // Mas malinis na margin
      filename: "ticket-report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 4 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Convert HTML to PDF
    html2pdf()
      .from(element)
      .set(options)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const pageCount = pdf.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);

          // Header
          pdf.setFont("Helvetica", "bold");
          pdf.setFontSize(18);
          pdf.setTextColor(0, 0, 0);
          pdf.text("Resolved Ticket Report", 105, 15, { align: "center" });

          // Divider Line
          pdf.setLineWidth(0.5);
          pdf.line(20, 20, 190, 20);

          // Footer
          pdf.setFontSize(10);
          pdf.text(`Page ${i} of ${pageCount}`, 105, 285, { align: "center" });
        }
      })
      .save();
  };

  // Function to count tickets for each time frame in Charts
  const getTicketCounts = () => {
    const now = dayjs();
    const weeklyCount = tickets.filter((ticket) =>
      dayjs(ticket.createdAt).isAfter(now.subtract(1, "week"))
    ).length;
    const monthlyCount = tickets.filter((ticket) =>
      dayjs(ticket.createdAt).isAfter(now.subtract(1, "month"))
    ).length;
    const yearlyCount = tickets.filter((ticket) =>
      dayjs(ticket.createdAt).isAfter(now.subtract(1, "year"))
    ).length;

    return {
      weekly: weeklyCount,
      monthly: monthlyCount,
      yearly: yearlyCount,
    };
  };

  const ticketCounts = getTicketCounts();

  // Map the ticket counts to the chart data
  const data = [
    {
      subject: "Weekly",
      count: ticketCounts.weekly,
    },
    {
      subject: "Monthly",
      count: ticketCounts.monthly,
    },
    {
      subject: "Yearly",
      count: ticketCounts.yearly,
    },
  ];

  const filteredTickets = filterTickets(tickets);
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Updated with gradient */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white w-72 flex flex-col justify-between transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out backdrop-blur-lg shadow-2xl`}
      >
        <div className="p-8">
          {/* Logo Section */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-lg">
                <span className="text-2xl">📊</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                IT Staff Portal
              </h1>
            </div>
            <button
              className="md:hidden hover:bg-white/10 p-2 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Enhanced Menu Items */}
          <ul className="space-y-3">
            {[
              { icon: "🏠", label: "Dashboard", path: "/it-staff-dashboard" },
              {
                icon: "📊",
                label: "Reports",
                path: "/it-staff-report",
                active: true,
              },
            ].map(({ icon, label, path, active }) => (
              <li key={path}>
                <button
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-white/20 shadow-lg border border-white/10"
                      : "hover:bg-white/10"
                  }`}
                >
                  <span className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg group-hover:bg-white/20 transition-colors">
                    {icon}
                  </span>
                  <span className="font-medium">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Enhanced User Profile */}
        {user && (
          <div className="p-6 mx-6 mb-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-white/20">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-white/80">Welcome back</p>
                <p className="font-semibold truncate max-w-[110px]">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 px-4 py-2.5 rounded-xl text-red-100 transition-colors duration-200 flex items-center justify-center gap-2 hover:shadow-lg"
            >
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Navbar - Modernized */}
        <nav className="bg-white rounded-xl shadow-sm p-4 m-2 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="hidden md:block md:text-lg lg:text-xl font-bold text-gray-800">
              Analytics Report
            </h1>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <audio ref={audioRef} src="/bellsound.mp3" preload="auto" />
            <button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Bell className={`w-6 h-6 ${animate ? "animate-shake" : ""}`} />
              {openTickets.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {openTickets.length}
                </span>
              )}
            </button>
            {isHovered && (
              <div className="absolute -top-2 right-10 mt-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                {openTickets.length} assigned tickets
              </div>
            )}
          </div>
        </nav>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Chart Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Ticket Analytics
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart outerRadius="65%" data={data}>
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#4B5563", fontSize: 12 }}
                />
                <PolarRadiusAxis stroke="#E5E7EB" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    border: "none",
                  }}
                />
                <Radar
                  name="Resolved Tickets"
                  dataKey="count"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Table Card */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Ticket Report
              </h2>
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export PDF
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
              {["Weekly", "Monthly", "Yearly"].map((label) => (
                <button
                  key={label}
                  onClick={() => setFilter(label.toLowerCase())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === label.toLowerCase()
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Table Component */}
            <div className="overflow-x-auto">
              <div className="min-h-[260px] max-h-[260px] overflow-y-auto">
                <Table id="content-to-print" className="w-full">
                  <Table.Head className="sticky top-0 bg-white z-10">
                    <Table.HeadCell>Category</Table.HeadCell>
                    <Table.HeadCell>Description</Table.HeadCell>
                    <Table.HeadCell>Date</Table.HeadCell>
                    <Table.HeadCell>Status</Table.HeadCell>
                    <Table.HeadCell>Priority</Table.HeadCell>
                  </Table.Head>
                  <Table.Body className="divide-y">
                    {filteredTickets.map((ticket) => (
                      <Table.Row key={ticket.id} className="hover:bg-gray-50">
                        <Table.Cell>{ticket.category}</Table.Cell>
                        <Table.Cell>{ticket.description}</Table.Cell>
                        <Table.Cell>{ticket.createdAt}</Table.Cell>
                        <Table.Cell>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {ticket.status}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              ticket.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : ticket.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItStaffReport;
