import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  // getDocs,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  CheckCircle,
  Hourglass,
  Bell,
  ChevronDown,
  ListFilter,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { Eye } from "lucide-react";
import TicketDetailsModal from "../components/TicketDetailsModal";
import FeedbackForm from "../components/FeedbackForm";

const ITStaffDashboard = () => {
  // Add these two lines with your other state declarations
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [staff, setStaff] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

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

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Fetch only tickets assigned to the current user
      const ticketsRef = collection(db, "assigned-tickets");
      const q = query(ticketsRef, where("assignee", "==", currentUser.email)); // or use currentUser.uid if you are storing UID instead of email

      // Real-time listener using onSnapshot
      const unsubscribe = onSnapshot(q, (ticketsSnapshot) => {
        const ticketsData = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // // Log the fetched tickets data
        console.log(ticketsData);

        setTickets(ticketsData);
      });

      // Cleanup the listener on component unmount
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    setStaff(auth.currentUser);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setStaff(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const filteredTickets = tickets.filter((ticket) =>
    filterStatus === "All" ? true : ticket.status === filterStatus
  );

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      // Optimistic UI update
      setTickets(
        tickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: newStatus, updatedAt: new Date() }
            : ticket
        )
      );

      // Update status and timestamp in Firestore
      await updateDoc(doc(db, "assigned-tickets", ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp(), // Firestore server timestamp
      });
    } catch (error) {
      console.error("Error updating ticket:", error);
      // Optionally, revert the status in case of an error
      setTickets(
        tickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: ticket.status } : ticket
        )
      );
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

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
                <span className="text-2xl">🏠</span>
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
              {
                icon: "🏠",
                label: "Dashboard",
                path: "/it-staff-dashboard",
                active: true,
              },
              { icon: "📊", label: "Reports", path: "/it-staff-report" },
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
        {staff && (
          <div className="p-6 mx-6 mb-6 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-white/20">
                {staff.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-white/80">Welcome back</p>
                <p className="font-semibold truncate max-w-[110px]">
                  {staff.email}
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
              Assigned Tickets
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
                  {openTickets.length} assigned tickets
                </div>
              )}
            </div>

            {/* Filter Dropdown - Enhanced */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ListFilter className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div className="absolute w-28 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {["All", "In Progress", "Resolved"].map((status) => (
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
              )}
            </div>
          </div>
        </nav>

        {/* Tickets Grid */}
        <div className="min-h-[calc(100vh-12rem)]">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-sm p-8">
              <p className="text-gray-500 text-lg">No tickets found</p>
              <p className="text-gray-400 text-sm mt-2">
                All your assigned tickets will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Created: {ticket.createdAt?.toDate().toLocaleString()}
                      </span>
                      {ticket.feedback && (
                        <span
                          className="w-2 h-2 rounded-full bg-yellow-400"
                          title="Has feedback"
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      {ticket.status === "In Progress" ? (
                        <button
                          onClick={async () => {
                            try {
                              console.log("Ticket Object:", ticket);
                              console.log("Ticket ID:", ticket.id);
                              console.log("User ID:", ticket.UserId);

                              await updateTicketStatus(ticket.id, "Resolved");

                              const ticketRef = doc(
                                db,
                                "tickets",
                                ticket.UserId
                              );
                              await updateDoc(ticketRef, {
                                assignee: staff.email,
                                feedbackId: ticket.id,
                                status: "Closed",
                                updatedAt: serverTimestamp(),
                              });

                              console.log("Status updated successfully");
                            } catch (error) {
                              console.error(
                                "Error updating ticket status:",
                                error
                              );
                            }
                          }}
                          className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            console.log("Clicked Ticket ID:", ticket.id);
                            handleViewTicket(ticket);
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ticket Category */}
                  <p className="text-xs text-blue-600 font-medium">
                    🏷️ {ticket.category || "Uncategorized"}
                  </p>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {ticket.description}
                  </p>

                  <div className="flex justify-between items-center mt-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === "Resolved"
                          ? "bg-green-100 text-green-600"
                          : ticket.status === "In Progress"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {ticket.status}
                    </span>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.priority === "Critical"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* Add the modal component before closing main tag */}
      <TicketDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />
    </div>
  );
};

export default ITStaffDashboard;
