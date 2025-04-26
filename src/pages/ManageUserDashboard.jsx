import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Menu, X, Bell, Trash2, UserPlus, Search } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { Table } from "flowbite-react";

// Custom hook for user management
const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    const checkAdminAndFetchUsers = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const userData = userDoc.data();

        if (userData?.role !== "admin") {
          navigate("/");
          return;
        }

        return onSnapshot(collection(db, "users"), (snapshot) => {
          const userData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setUsers(userData);
        });
      } catch {
        navigate("/");
      }
    };

    const unsubscribePromise = checkAdminAndFetchUsers();
    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, [auth.currentUser, navigate]);

  const handleDelete = async (userId) => {
    if (!userId) return;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const userToDelete = users.find((u) => u.id === userId);

    if (userToDelete?.role === "admin" && adminCount <= 1) return;

    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const adminCount = users.filter((u) => u.role === "admin").length;
    const userToUpdate = users.find((u) => u.id === userId);

    if (
      userToUpdate?.role === "admin" &&
      newRole !== "admin" &&
      adminCount <= 1
    ) {
      return;
    }

    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setSelectedRoles({ ...selectedRoles, [userId]: newRole });
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  return { users, selectedRoles, handleDelete, handleRoleChange };
};

// Custom hook for notification system
const useNotificationSystem = () => {
  const [openTickets, setOpenTickets] = useState([]);
  const [animate, setAnimate] = useState(false);
  const prevTicketCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "tickets"), where("status", "==", "Open"));
    return onSnapshot(q, (snapshot) => {
      const openTicketsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOpenTickets(openTicketsData);
    });
  }, []);

  useEffect(() => {
    if (openTickets.length > prevTicketCountRef.current) {
      setAnimate(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      setTimeout(() => setAnimate(false), 800);
    }
    prevTicketCountRef.current = openTickets.length;
  }, [openTickets.length]);

  return { openTickets, animate, audioRef };
};

const ManageUsers = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const { users, selectedRoles, handleDelete, handleRoleChange } =
    useUserManagement();
  const { openTickets, animate, audioRef } = useNotificationSystem();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {
                icon: "👤",
                label: "Users",
                path: "/manage-users",
                active: true,
              },
              { icon: "📊", label: "Reports", path: "/admin-reports" },
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
        <nav className="sticky top-0 z-30 bg-white rounded-xl shadow-sm p-4 m-2">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                User Management
              </h1>
            </div>

            {/* Search and Notification Area */}
            <div className="flex items-center gap-4">
              {/* Search Bar for Desktop */}
              <div className="hidden sm:flex relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Icon for Mobile */}
              <div className="sm:hidden relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>

                {/* Mobile Search Popup */}
                {isSearchOpen && (
                  <div className="fixed inset-0 flex items-start justify-center bg-black/20 pt-20 px-4 z-50">
                    <div className="relative bg-white rounded-lg shadow-lg p-4 w-full">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <Search className="w-5 h-5 absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <button
                        onClick={() => setIsSearchOpen(false)}
                        className="absolute right-6 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bell Icon */}
              <div className="relative">
                <audio ref={audioRef} src="/bellsound.mp3" preload="auto" />
                <button
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Bell
                    className={`w-6 h-6 ${animate ? "animate-shake" : ""}`}
                  />
                  {openTickets.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {openTickets.length}
                    </span>
                  )}
                </button>
                {isHovered && (
                  <div className="absolute -top-2 right-10 mt-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap z-50">
                    {openTickets.length} Open tickets
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Stats Cards - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: "Total IT Staff",
              color: "from-blue-500 to-blue-600",
              role: [
                "finance_officer",
                "account_manager",
                "network_engineer",
                "hardware_technician",
                "software_engineer",
                "cybersecurity_analyst",
                "product_manager",
                "customer_support",
                "operations_manager",
              ],
            },
            {
              label: "Admins",
              color: "from-purple-500 to-purple-600",
              role: "admin",
            },
            {
              label: "Regular Users",
              color: "from-green-400 to-green-500",
              role: "user",
            },
          ].map(({ label, color, role }) => (
            <div
              key={label}
              className={`bg-gradient-to-r ${color} p-6 rounded-xl shadow-sm text-white`}
            >
              <h3 className="text-lg font-medium opacity-90">{label}</h3>
              <p className="text-3xl font-bold mt-2">
                {Array.isArray(role)
                  ? users.filter((u) => role.includes(u.role)).length
                  : users.filter((u) => u.role === role).length}
              </p>
            </div>
          ))}
        </div>

        {/* Users Table - Enhanced */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">User List</h2>
          </div>

          <div className="min-h-[260px] max-h-[260px] overflow-y-auto">
            <Table className="w-full">
              <Table.Head className="sticky top-0 bg-white z-10">
                <Table.HeadCell className="px-6 py-4">Email</Table.HeadCell>
                <Table.HeadCell className="px-6 py-4">Role</Table.HeadCell>
                <Table.HeadCell className="px-6 py-4 text-right">
                  Actions
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {filteredUsers.map((user) => (
                  <Table.Row key={user.id} className="hover:bg-gray-50">
                    <Table.Cell className="px-6 py-4">{user.email}</Table.Cell>
                    <Table.Cell className="px-6 py-4">
                      <select
                        value={selectedRoles[user.id] || user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="finance_officer">Finance Officer</option>
                        <option value="account_manager">Account Manager</option>
                        <option value="network_engineer">
                          Network Engineer
                        </option>
                        <option value="hardware_technician">
                          Hardware Technician
                        </option>
                        <option value="software_engineer">
                          Software Engineer
                        </option>
                        <option value="cybersecurity_analyst">
                          Cybersecurity Analyst
                        </option>
                        <option value="product_manager">Product Manager</option>
                        <option value="customer_support">
                          Customer Support Representative
                        </option>
                        <option value="operations_manager">
                          Operations Manager
                        </option>
                        <option value="user">User</option>
                      </select>
                    </Table.Cell>
                    <Table.Cell className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageUsers;
