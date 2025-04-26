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

const FeedbackDashboard = () => {
  //   const [tickets, setTickets] = useState([]);
  // const [filteredTickets, setFilteredTickets] = useState([]);
  // const [filterStatus, setFilterStatus] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [openTickets, setOpenTickets] = useState([]);

  const [isHovered, setIsHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  const prevTicketCountRef = useRef(0); // useRef to store the previous count

  const audioRef = useRef(null); // ✅ useRef for audio

  const [feedbacks, setFeedbacks] = useState([]);
  // Add filter states
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterRating, setFilterRating] = useState("All");

  // Add helper function
  const getUniqueCategories = () => {
    const categories = [...new Set(feedbacks.map((f) => f.category))];
    return ["All", ...categories];
  };

  useEffect(() => {
    console.log("Initializing feedback listener...");

    // Set up real-time listener
    const unsubscribe = onSnapshot(collection(db, "feedback"), (snapshot) => {
      console.log("Snapshot received. Size:", snapshot.size);

      if (snapshot.empty) {
        console.log("No feedbacks found.");
      }

      const fetchedFeedbacks = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          category: data.category || "Uncategorized",
          assignee: data.assignee || "Unassigned", // Add this line
          comment: data.comment || "No Comment",
          description: data.description || "No Description",
          email: data.email || "No Email",
          feedback: data.feedback || 0,
          createdAt: data.createdAt
            ? new Date(data.createdAt.seconds * 1000).toLocaleString()
            : "Unknown Date",
        };
      });

      console.log("Processed feedbacks:", fetchedFeedbacks);
      setFeedbacks(fetchedFeedbacks);
    });

    return () => {
      console.log("Cleaning up feedback listener...");
      unsubscribe();
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
      {/* Sidebar - Updated with gradient */}
      {/* Sidebar with glass morphism effect */}
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
              { icon: "📊", label: "Reports", path: "/admin-reports" },
              { icon: "💭", label: "Feedbacks", path: "/admin-feedback" },
            ].map(({ icon, label, path }) => (
              <li key={path}>
                <button
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                    path === "/admin-feedback"
                      ? "bg-white/20 shadow-lg"
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
              Feedback Overview
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

        {/* Feedback Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: "Total Feedbacks",
              value: feedbacks.length,
              color: "from-purple-500 to-purple-600",
            },
            {
              label: "Positive Feedbacks",
              value: feedbacks.filter((f) => f.feedback >= 4).length,
              color: "from-green-400 to-green-500",
            },
            {
              label: "Needs Improvement",
              value: feedbacks.filter((f) => f.feedback < 2).length,
              color: "from-red-400 to-red-500",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`bg-gradient-to-r ${color} p-6 rounded-xl shadow-sm text-white`}
            >
              <h3 className="text-lg font-medium opacity-90">{label}</h3>
              <p className="text-3xl font-bold mt-2">{value}</p>
            </div>
          ))}
        </div>

        {/* Feedback Table - Enhanced */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                Feedback Details
              </h2>
              <div className="flex gap-4">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getUniqueCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Ratings</option>
                  <option value="positive">Positive (4-5)</option>
                  <option value="neutral">Neutral (2-3)</option>
                  <option value="negative">Negative (0-1)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="min-h-[260px] max-h-[260px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <tr>
                  {[
                    "Category",
                    "Assignee",
                    "Comment",
                    "Description",
                    "Date",
                    "Email",
                    "Feedback Score",
                  ].map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 font-semibold text-sm uppercase tracking-wider text-center"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-center">
                {feedbacks.length > 0 ? (
                  feedbacks
                    .filter((feedback) => {
                      const categoryMatch =
                        filterCategory === "All" ||
                        feedback.category === filterCategory;
                      let ratingMatch = true;

                      if (filterRating === "positive") {
                        ratingMatch = feedback.feedback >= 4;
                      } else if (filterRating === "neutral") {
                        ratingMatch =
                          feedback.feedback >= 2 && feedback.feedback <= 3;
                      } else if (filterRating === "negative") {
                        ratingMatch = feedback.feedback < 2;
                      }

                      return categoryMatch && ratingMatch;
                    })
                    .map((feedback, idx) => (
                      <tr
                        key={feedback.id}
                        className={`hover:bg-gray-100 transition duration-200 ${
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {feedback.category}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {feedback.assignee || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {feedback.comment || "No Comment"}
                        </td>
                        <td className="px-6 py-4 truncate max-w-[250px] text-gray-700">
                          {feedback.description || "No Description"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                          {feedback.createdAt || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {feedback.email || "N/A"}
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${
                            feedback.feedback >= 4
                              ? "text-green-600"
                              : feedback.feedback >= 2
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        >
                          {feedback.feedback}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center p-6 text-gray-500">
                      No feedback found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeedbackDashboard;
