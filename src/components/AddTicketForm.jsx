import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const categories = {
  technical: { name: "Technical Issue", color: "bg-red-500" },
  billing: { name: "Billing Issue", color: "bg-yellow-500" },
  account: { name: "Account Issue", color: "bg-blue-500" },
  network: { name: "Network Issue", color: "bg-green-500" },
  hardware: { name: "Hardware Issue", color: "bg-orange-500" },
  software: { name: "Software Issue", color: "bg-purple-500" },
  security: { name: "Security Concern", color: "bg-black" },
  feature: { name: "Feature Request", color: "bg-brown-500" },
  service: { name: "Customer Service", color: "bg-pink-500" },
  other: { name: "Other", color: "bg-gray-900" },
};

const AddTicketForm = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !description.trim()) return;

    const selectedCategory = categories[category] || categories.other;

    try {
      const ticketRef = await addDoc(collection(db, "tickets"), {
        category: selectedCategory.name,
        description,
        status: "Open",
        userId: auth.currentUser?.uid,
        issueColor: selectedCategory.color,
        createdAt: serverTimestamp(),
        chatRoomId: null,
      });

      // Update the ticket with its own ID as the chatRoomId
      await updateDoc(ticketRef, {
        chatRoomId: ticketRef.id
      });

      // Clear form fields
      setCategory("");
      setDescription("");

      onClose(); // Close modal
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative p-6 w-full max-w-md bg-white rounded-lg shadow-lg transition-opacity animate-fadeIn">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-semibold">Create Ticket</h3>
          <button
            type="button"
            className="text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Category Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 py-2">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2 border rounded-lg bg-white text-gray-700 shadow-sm focus:ring focus:ring-blue-200 flex justify-between items-center"
            >
              {category ? categories[category]?.name : "Select Category..."}
              <svg
                className="w-4 h-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-2 bg-white divide-y divide-gray-100  shadow-sm w-full max-h-40 overflow-y-auto scrollbar-hide">
                <ul className="py-2 text-sm text-gray-700">
                  {Object.keys(categories).map((key) => (
                    <li key={key}>
                      <button
                        type="button"
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:ring focus:ring-gray-300"
                        onClick={() => {
                          setCategory(key);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {categories[key].name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium py-4 text-gray-700">
              Description
            </label>
            <textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTicketForm;
