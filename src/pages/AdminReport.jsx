import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Menu, X, Bell } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { Table, Button } from "flowbite-react";
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";

const AdminReport = () => {
  const [tickets, setTickets] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [openTickets, setOpenTickets] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevTicketCountRef = useRef(0);
  const audioRef = useRef(null); // useRef for audio

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeFirestore;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);

      const q = query(collection(db, "tickets"));

      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          console.log("No tickets found.");
        }

        const fetchedTickets = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "No Title",
            category: data.category || "Uncategorized",
            description: data.description || "No Description",
            status: data.status || "Open",
            issueColor: data.issueColor || "gray",
            createdAt: data.createdAt
              ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
              : "Unknown Date",
          };
        });

        setTickets(fetchedTickets);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tickets"), where("status", "==", "Open"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const openTicketsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOpenTickets(openTicketsData);
    });

    return () => unsubscribe();
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
  const [filterStatus, setFilterStatus] = useState("All");

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
    const currentDate = new Date().toLocaleDateString();

    const options = {
      margin: [44, 20, 35, 20],
      filename: `ticket-report-${dayjs().format("YYYY-MM-DD")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 4 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .from(element)
      .set(options)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const pageCount = pdf.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);

          // Header Background
          pdf.setFillColor(0, 51, 153);
          pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 30, "F");

          // Header Text
          pdf.setFont("Helvetica", "bold");
          pdf.setFontSize(22);
          pdf.setTextColor(255, 255, 255);
          pdf.text("Admin Ticket Report", 105, 20, { align: "center" });

          // Subheader
          pdf.setFontSize(10);
          pdf.setTextColor(220, 220, 220);
          pdf.text(`Generated on: ${currentDate}`, 20, 40);
          pdf.text(
            `Filter: ${filter} | Status: ${filterStatus}`,
            pdf.internal.pageSize.getWidth() - 20,
            40,
            { align: "right" }
          );

          // Separator Line
          pdf.setLineWidth(0.5);
          pdf.setDrawColor(0, 51, 153);
          pdf.line(20, 45, 190, 45);

          // Footer Background
          pdf.setFillColor(245, 245, 245);
          pdf.rect(
            0,
            pdf.internal.pageSize.getHeight() - 25,
            pdf.internal.pageSize.getWidth(),
            25,
            "F"
          );

          // Footer Content
          pdf.setFont("Helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `Page ${i} of ${pageCount}`,
            105,
            pdf.internal.pageSize.getHeight() - 15,
            { align: "center" }
          );

          // Company Info
          pdf.setFont("Helvetica", "italic");
          pdf.setFontSize(8);
          pdf.text(
            "Ticket Management System - Confidential",
            20,
            pdf.internal.pageSize.getHeight() - 15
          );

          // Date/Time
          const timestamp = new Date().toLocaleTimeString();
          pdf.text(
            `Generated at ${timestamp}`,
            pdf.internal.pageSize.getWidth() - 20,
            pdf.internal.pageSize.getHeight() - 15,
            { align: "right" }
          );
        }
      })
      .save();
  };

  useEffect(() => {
    if (openTickets.length > prevTicketCountRef.current) {
      setAnimate(true);
      playNotificationSound();
      setTimeout(() => setAnimate(false), 800);
    }
    prevTicketCountRef.current = openTickets.length;
  }, [openTickets.length]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const chartdata = filterTickets(tickets).map((ticket) => ({
    date: dayjs(ticket.createdAt).format("YYYY-MM-DD"),
    closed: ticket.status === "Closed" ? 1 : 0,
    inProgress: ticket.status === "In Progress" ? 1 : 0,
    open: ticket.status === "Open" ? 1 : 0,
  }));

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
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-blue-600">TZ</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Admin Portal
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
              { icon: "🏠", label: "Dashboard", path: "/admin-dashboard" },
              { icon: "👤", label: "Users", path: "/manage-users" },
              {
                icon: "📊",
                label: "Reports",
                path: "/admin-reports",
                active: true,
              },
              { icon: "💭", label: "Feedbacks", path: "/admin-feedback" },
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
              Reports Overview
            </h1>
          </div>

          {/* Notification Bell - Enhanced */}
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
                {openTickets.length} Open tickets
              </div>
            )}
          </div>
        </nav>

        {/* Statistics and Chart Section */}
        <div className="grid gap-8">
          <section className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Ticket Statistics
              </h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartdata}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar dataKey="closed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="inProgress"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="open" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="open"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: "#F59E0B" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </section>

          {/* Report Table Section */}
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  Detailed Report
                </h2>
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit mx-4 mt-4">
              {["All", "Open", "In Progress", "Closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Table content with fixed height and scroll */}
            <div className="p-6">
              <div className="min-h-[260px] max-h-[260px] overflow-y-auto">
                <Table id="content-to-print" className="w-full">
                  <Table.Head className="bg-gray-100 text-center sticky top-0 z-10">
                    {[
                      "Category",
                      "Description",
                      "Date",
                      "Status",
                      "Priority",
                    ].map((label, idx) => (
                      <Table.HeadCell
                        key={idx}
                        className="px-4 py-3 font-medium text-gray-600"
                      >
                        {label}
                      </Table.HeadCell>
                    ))}
                  </Table.Head>
                  <Table.Body className="divide-y">
                    {tickets.length > 0 ? (
                      tickets
                        .filter((ticket) =>
                          filterStatus === "All"
                            ? true
                            : ticket.status === filterStatus
                        )
                        .map((ticket) => (
                          <Table.Row
                            key={ticket.id}
                            className="bg-white hover:bg-gray-50 transition"
                          >
                            <Table.Cell className="px-4 py-3 font-medium text-gray-900 text-center">
                              {ticket.category}
                            </Table.Cell>
                            <Table.Cell
                              className="px-4 py-3 truncate max-w-xs text-center"
                              title={ticket.description}
                            >
                              {ticket.description}
                            </Table.Cell>
                            <Table.Cell className="px-4 py-3 text-center">
                              {dayjs(ticket.createdAt).format("YYYY-MM-DD")}
                            </Table.Cell>
                            <Table.Cell className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                                  {
                                    Open: "bg-blue-100 text-blue-600",
                                    "In Progress":
                                      "bg-yellow-100 text-yellow-600",
                                    Closed: "bg-green-100 text-green-600",
                                  }[ticket.status] ||
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {ticket.status}
                              </span>
                            </Table.Cell>
                            <Table.Cell className="px-4 py-3 text-center">
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                                  ticket.issueColor || "bg-gray-500 text-white"
                                }`}
                              ></span>
                            </Table.Cell>
                          </Table.Row>
                        ))
                    ) : (
                      <Table.Row>
                        <Table.Cell
                          colSpan="5"
                          className="text-center p-4 text-gray-500"
                        >
                          No tickets found.
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminReport;
