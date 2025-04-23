import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  Bell,
  TicketPlus,
  ListFilter,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import AddTicketForm from "../components/AddTicketForm";
import FeedbackForm from "../components/FeedbackForm";
// Add imports
import { Eye, Edit, Trash2 } from "lucide-react";
import ExpandedTicketView from "../components/ExpandedTicketView";
import UpdateTicketForm from "../components/UpdateTicketForm";
import { deleteDoc, doc } from "firebase/firestore";

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [openTickets, setOpenTickets] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevTicketCountRef = useRef(0);
  const audioRef = useRef(null);

  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "tickets"), where("userId", "==", user.uid));

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const fetchedTickets = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds); // Sort manually

      setTickets(fetchedTickets);
    });

    return () => unsubscribeFirestore();
  }, [user]);

  useEffect(() => {
    const auth = getAuth();
    setUser(auth.currentUser);
  }, []);

  useEffect(() => {
    if (filterStatus === "All") {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(
        tickets.filter((ticket) => ticket.status === filterStatus)
      );
    }
  }, [filterStatus, tickets]);

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

  useEffect(() => {
    const q = query(
      collection(db, "tickets"),
      where("status", "==", "In Progress")
    );
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

  // Add new state variables
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Add these handler functions
  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsEditModalOpen(true);
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await deleteDoc(doc(db, "tickets", ticketId));
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }
    }
  };

  // In the return statement, update the ticket card JSX
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <img
                  src="/ticket.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                TickZys
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
              { icon: "🏠", label: "Home", path: "/dashboard", active: true },
              // { icon: "🎫", label: "Tickets", path: "/ticket-dashboard" },
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
        <nav className="bg-white rounded-xl shadow-sm p-4 flex m-2 justify-between items-center sticky top-0 z-30">
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

          <div className="flex items-center gap-6">
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
                  {openTickets.length} Inprogress tickets
                </div>
              )}
            </div>

            {/* Filter Dropdown - Enhanced */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ListFilter className="w-5 h-5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute w-28 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="py-2">
                    {["All", "Open", "In Progress", "Closed"].map((status) => (
                      <button
                        key={status}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm transition-colors"
                        onClick={() => {
                          setFilterStatus(status);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Create Ticket Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <TicketPlus className="w-5 h-5" />
            </button>
          </div>
        </nav>

        {/* Tickets Grid */}
        <div className="space-y-6">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500 text-lg">No tickets found</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    {/* Ticket Category */}
                    <p className="text-xs text-blue-600 font-medium">
                      🏷️ {ticket.category || "Uncategorized"}
                    </p>
                    {ticket.status === "Open" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-yellow-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ticket Title */}
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate">
                    {ticket.title}
                  </h3>

                  {/* Ticket Date */}
                  <p className="text-xs text-gray-500 mb-2">
                    📅{" "}
                    {ticket.createdAt?.seconds
                      ? new Date(
                          ticket.createdAt.seconds * 1000
                        ).toLocaleString()
                      : "Pending..."}
                  </p>

                  {/* Ticket Description */}
                  <p className="text-gray-600 text-sm line-clamp-1">
                    {ticket.description}
                  </p>

                  <div className="flex justify-between items-center mt-4">
                    {/* Status Badge */}
                    <span
                      className={`inline-block  py-1 text-xs font-medium rounded-full ${
                        ticket.status === "Open"
                          ? "bg-green-100 text-green-700 border border-green-300 px-2"
                          : ticket.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-300 px-2"
                          : "bg-red-100 text-red-700 border border-red-300 px-2"
                      }`}
                    >
                      {ticket.status}
                    </span>

                    {/* Show feedback button if status is "Closed" */}
                    {ticket.status === "Closed" && (
                      <button
                        onClick={() => {
                          console.log("Selected Ticket:", ticket);
                          console.log("Selected Ticket ID:", ticket.assignee);
                          console.log("Selected Ticket Data:", {
                            category: ticket.category,
                            status: ticket.status,
                            comment: ticket.description,
                          });
                          setIsFeedbackModalOpen(true);
                          setSelectedTicket(ticket);
                        }}
                        className="bg-blue-500 text-white font-medium py-1 px-3 rounded-full transition shadow-md hover:shadow-lg hover:shadow-blue-500/50"
                      >
                        Feedback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <AddTicketForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {isFeedbackModalOpen && selectedTicket && (
        <FeedbackForm
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          ticket={selectedTicket} // Pass the selected ticket
          user={user.email}
        />
      )}

      {/* Add these modal components before the closing main tag */}
      <ExpandedTicketView
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />

      <UpdateTicketForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTicket(null);
        }}
        ticketId={selectedTicket?.id}
        existingCategory={selectedTicket?.category}
        existingDescription={selectedTicket?.description}
      />
    </div>
  );
};

export default Dashboard;
