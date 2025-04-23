import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Menu, X, Eye, Edit, Trash2 } from "lucide-react";
import AddTicketForm from "../components/AddTicketForm";
import ExpandedTicketView from "../components/ExpandedTicketView";

const TicketDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/");
      return;
    }

    const q = query(
      collection(db, "tickets"),
      where("email", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
      setTickets(ticketsData);
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Update the handleViewTicket function
  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsEditMode(true);
    setIsModalOpen(true);
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-blue-900 to-blue-700 text-white w-72 p-8 flex flex-col justify-between transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div>
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold">User Dashboard</h1>
            <button
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <ul className="space-y-6">
            {[
              { icon: "🏠", label: "Dashboard", path: "/dashboard" },
              {
                icon: "🎫",
                label: "My Tickets",
                path: "/ticket-dashboard",
                active: true,
              },
            ].map(({ icon, label, path, active }) => (
              <li
                key={path}
                className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-all duration-200 ${
                  active ? "bg-blue-600/50" : "hover:bg-blue-600/30"
                }`}
                onClick={() => navigate(path)}
              >
                <span className="text-xl">{icon}</span>
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <nav className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center m-2 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">My Tickets</h1>
          </div>
        </nav>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Created: {formatDate(ticket.createdAt)}
                  </span>
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
                </div>
                {ticket.updatedAt && (
                  <span className="text-xs text-gray-500">
                    Last Updated: {formatDate(ticket.updatedAt)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium">{ticket.category}</h3>
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
              </div>

              <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>

              {ticket.assignee && (
                <p className="text-xs text-gray-500">
                  Assigned to: {ticket.assignee}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Add/Edit Ticket Modal */}
        <AddTicketForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditMode(false);
            setSelectedTicket(null);
          }}
          ticket={isEditMode ? selectedTicket : null}
        />
      </main>
      {/* Add this before the AddTicketForm */}
      <ExpandedTicketView
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />

      {/* AddTicketForm remains the same */}
    </div>
  );
};

export default TicketDashboard;
