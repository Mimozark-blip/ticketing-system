import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  // updateDoc,
  // doc,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Menu, X, Bell } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
// import { CSVLink } from "react-csv";
import { Table } from "flowbite-react";
import AssignTicketFormModal from "../components/AssignTicketForm";

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  // const [filteredTickets, setFilteredTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Open");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [openTickets, setOpenTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevTicketCountRef = useRef(0); // useRef to store the previous count

  const audioRef = useRef(null); // ✅ useRef for audio

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeFirestore; // Declare outside to handle cleanup

    console.log("Auth initialized...");

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user);

      setUser(user);
      console.log("Fetching all tickets...");

      // Query all tickets without filtering by userId
      const q = query(collection(db, "tickets"));

      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        console.log("Snapshot received. Size:", snapshot.size);

        if (snapshot.empty) {
          console.log("No tickets found.");
        }

        const fetchedTickets = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Fetched ticket data:", data);
          return {
            id: doc.id,
            title: data.title || "No Title",
            category: data.category || "Uncategorized",
            description: data.description || "No Description",
            status: data.status || "Open",
            // priority: data.priority || "Low",
            issueColor: data.issueColor || "gray",
            createdAt: data.createdAt
              ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
              : "Unknown Date",
          };
        });

        console.log("Processed tickets:", fetchedTickets);
        setTickets(fetchedTickets);
      });
    });

    return () => {
      console.log("Cleaning up listeners...");
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();
    setUser(auth.currentUser);
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

  useEffect(() => {
    if (openTickets.length > prevTicketCountRef.current) {
      setAnimate(true);
      playNotificationSound(); // ✅ Play sound
      setTimeout(() => setAnimate(false), 800);
    }
    prevTicketCountRef.current = openTickets.length; // Update the ref to the current count
  }, [openTickets.length]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Updated with gradient and better spacing */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white w-72 flex flex-col justify-between transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out backdrop-blur-lg shadow-2xl`}
      >
        <div className="p-8">
          {/* Logo Section */}
          <div className="flex justify-between gap-2 items-center mb-12">
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
              {
                icon: "🏠",
                label: "Dashboard",
                active: true,
                path: "/admin-dashboard",
              },
              { icon: "👤", label: "Users", path: "/manage-users" },
              { icon: "📊", label: "Reports", path: "/admin-reports" },
              { icon: "💭", label: "Feedbacks", path: "/admin-feedback" },
            ].map(({ icon, label, path }) => (
              <li key={path}>
                <button
                  onClick={() => navigate(path)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
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
          <div className="p-6 mx-6 mb-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
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
              className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 px-4 py-2.5 rounded-xl text-red-100 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Navbar - Modernized */}
        <nav className="bg-white rounded-xl shadow-sm m-2 p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="hidden md:block md:text-lg lg:text-xl font-bold text-gray-800">
              Dashboard Overview
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

        {/* Stats Cards - Redesigned with gradients */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: "Open Tickets",
              color: "from-blue-500 to-blue-600",
              status: "Open",
            },
            {
              label: "In Progress",
              color: "from-yellow-400 to-yellow-500",
              status: "In Progress",
            },
            {
              label: "Closed",
              color: "from-green-400 to-green-500",
              status: "Closed",
            },
          ].map(({ label, color, status }) => (
            <div
              key={status}
              className={`bg-gradient-to-r ${color} p-6 rounded-xl shadow-sm text-white`}
            >
              <h3 className="text-lg font-medium opacity-90">{label}</h3>
              <p className="text-3xl font-bold mt-2">
                {tickets.filter((t) => t.status === status).length}
              </p>
            </div>
          ))}
        </div>

        {/* Tickets Table - Enhanced */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Tickets</h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit mx-4">
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

          {/* Responsive Table Wrapper */}
          <div className="overflow-auto max-h-[360px] w-[415px] md:w-full lg:w-full">
            <Table className="w-full text-sm">
              {/* Table Head */}
              <Table.Head>
                {[
                  { label: "Category", width: "w-[15%]", align: "text-left" },
                  {
                    label: "Description",
                    width: "w-[25%]",
                    align: "text-left",
                  },
                  { label: "Date", width: "w-[15%]", align: "text-center" },
                  { label: "Status", width: "w-[15%]", align: "text-center" },
                  { label: "Priority", width: "w-[15%]", align: "text-center" },
                  { label: "Action", width: "w-[15%]", align: "text-center" },
                ].map(({ label, width, align }) => (
                  <Table.HeadCell
                    key={label}
                    className={`${width} ${align} px-4 py-2 font-medium`}
                  >
                    {label}
                  </Table.HeadCell>
                ))}
              </Table.Head>

              {/* Table Body - Updated to use filtered tickets */}
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
                        className="bg-white dark:border-gray-700 dark:bg-gray-800"
                      >
                        {/* Category */}
                        <Table.Cell className="w-[15%] text-left font-medium text-gray-900 dark:text-white px-4 py-2">
                          {ticket.category}
                        </Table.Cell>

                        {/* Description */}
                        <Table.Cell
                          className="w-[20%] text-left px-4 py-2 truncate max-w-[200px]"
                          title={ticket.description}
                        >
                          {ticket.description}
                        </Table.Cell>

                        {/* Date */}
                        <Table.Cell className="w-[15%] text-center px-4 py-2 whitespace-nowrap">
                          {ticket.createdAt}
                        </Table.Cell>

                        {/* Status */}
                        <Table.Cell className="w-[20%] text-center px-4 py-2">
                          <span
                            className={`  font-semibold text-xs ${
                              {
                                Open: "text-blue-500 text-center ",
                                "In Progress": "text-yellow-500 text-center ",
                                Closed: "text-green-500 text-center ",
                              }[ticket.status] || "bg-gray-500"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </Table.Cell>

                        {/* Priority */}
                        <Table.Cell className="w-[15%] text-center px-4 py-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs ${
                              ticket.issueColor
                                ? `${ticket.issueColor} text-white`
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {/* {ticket.priority} */}
                          </span>
                        </Table.Cell>

                        {/* Action Button */}
                        <Table.Cell className="w-[15%] text-center px-4 py-2">
                          <button
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                              ticket.status === "Open"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-gray-400 text-white cursor-not-allowed opacity-50"
                            }`}
                            onClick={() => {
                              console.log("Clicked Ticket:", ticket); // Debugging log
                              if (ticket.status === "Open") {
                                setSelectedTicket(ticket); // Set selected ticket
                                setIsModalOpen(true);
                              }
                            }}
                            disabled={ticket.status !== "Open"}
                          >
                            Assign
                          </button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                ) : (
                  <Table.Row>
                    <Table.Cell
                      colSpan="6"
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
      </main>
      {/* Modal */}
      <AssignTicketFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTicket={selectedTicket}
      />
    </div>
  );
};

export default AdminDashboard;
