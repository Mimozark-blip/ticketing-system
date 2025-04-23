import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const priorityMapping = {
  "bg-black": "Critical",
  "bg-red-500": "High",
  "bg-yellow-500": "Medium",
  "bg-orange-500": "Medium",
  "bg-green-500": "Medium",
  "bg-purple-500": "Medium",
  "bg-blue-500": "Low",
  "bg-pink-500": "Low",
  "bg-brown-500": "Low",
  "bg-gray-500": "Low",
};

// Mappings for category to role
const categoryToRole = {
  "Billing Issue": "finance_officer",
  "Account Issue": "account_manager",
  "Network Issue": "network_engineer",
  "Hardware Issue": "hardware_technician",
  "Software Issue": "software_engineer",
  "Security Concern": "cybersecurity_analyst",
  "Feature Request": "product_manager",
  "Customer Service": "customer_support",
  Operations: "operations_manager",
};

const AssignTicketForm = ({ isOpen, onClose, selectedTicket }) => {
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeList, setAssigneeList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedTicket?.issueColor) {
      setPriority(priorityMapping[selectedTicket.issueColor] || "Unknown");
    }
  }, [selectedTicket?.issueColor]);

  useEffect(() => {
    if (selectedTicket?.category) {
      fetchAvailableAssignees();
    }
  }, [selectedTicket?.category]);

  // Fetch users based on role
  const fetchAvailableAssignees = async () => {
    const roleNeeded = categoryToRole[selectedTicket.category];

    if (!roleNeeded) {
      console.error("No matching role for this category");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", roleNeeded));
      const querySnapshot = await getDocs(q);

      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
      }));

      if (users.length === 0) {
        console.error("No available assignees for this category.");
      }

      setAssigneeList(users);
    } catch (error) {
      console.error("Error fetching assignees:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    // Check if fields are filled
    if (!assignee) {
      alert("Please fill all fields.");
      return;
    }

    try {
      console.log("Adding ticket to Firestore");
      await addDoc(collection(db, "assigned-tickets"), {
        category: selectedTicket.category,
        status: "In Progress",
        assignee: assignee, // Make sure this is included
        priority: priority, // Make sure this is included
        description: selectedTicket.description, // Make sure this is included
        AdminId: auth.currentUser?.uid, // If you want to save the user's ID
        UserId: selectedTicket.id,
        issueColor: selectedTicket?.issueColor || "default", // If you have color information
        createdAt: serverTimestamp(),
      });

      // Update the status of the ticket in the "tickets" collection
      const ticketRef = doc(db, "tickets", selectedTicket.id);
      await updateDoc(ticketRef, { status: "In Progress" });

      // Clear the form fields

      setAssignee("");
      setPriority("");
      setAssigneeList([]);
      onClose();
      navigate("/admin-dashboard");
    } catch (error) {
      console.error("Error assigning ticket:", error);
      alert("An error occurred while assigning the ticket.");
    }
  };

  const handleClose = () => {
    setAssignee("");
    setAssigneeList([]);
    onClose(); // Close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative p-6 w-full max-w-md bg-white rounded-lg shadow-lg transition-opacity animate-fadeIn">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-semibold">Assign Ticket</h3>
          <button
            type="button"
            className="text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
            onClick={() => {
              onClose(); // Close the modal
              handleClose(); // Reset the form
            }}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Assignee Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 py-2">
              Assignee
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white text-gray-700 shadow-sm focus:ring focus:ring-blue-200"
              required
            >
              <option value="">Select Assignee...</option>
              {assigneeList.length > 0 ? (
                assigneeList.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.email}
                  </option>
                ))
              ) : (
                <option disabled>No available assignees</option>
              )}
            </select>
          </div>

          {/* Priority (Read-Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 py-2">
              Priority
            </label>
            <input
              type="text"
              value={priority}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 shadow-sm"
              readOnly
            />
          </div>

          {/* Category Input (Read-Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 py-2">
              Category
            </label>
            <input
              type="text"
              value={selectedTicket?.category || "Unknown"}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 shadow-sm"
              readOnly
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Assign Ticket
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssignTicketForm;
