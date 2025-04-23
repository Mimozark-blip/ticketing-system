import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
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
  service: { name: "Customer Service", color: "bg-gray-500" },
  other: { name: "Other", color: "bg-gray-400" },
};

const UpdateTicketForm = ({
  isOpen,
  onClose,
  ticketId,
  existingCategory,
  existingDescription,
}) => {
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      console.log("Existing category:", existingCategory); // Debugging
      setCategory(existingCategory || "other"); // Ensure a default value
      setDescription(existingDescription || "");
    }
  }, [isOpen, existingCategory, existingDescription]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("ticketId received:", ticketId);

    if (!ticketId) {
      setError("Ticket ID is missing. Cannot update ticket.");
      console.error("Error: ticketId is undefined or null.");
      return;
    }

    try {
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        category: categories[category]?.name || "Other",
        description,
        issueColor: categories[category]?.color || "bg-gray-400",
        updatedAt: serverTimestamp(),
      });

      setCategory("other");
      setDescription("");
      setError("");

      onClose();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating ticket:", error);
      setError("Failed to update ticket. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative p-6 w-full max-w-md bg-white rounded-lg shadow-lg transition-opacity animate-fadeIn">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-semibold">Update Ticket</h3>
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
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Category Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 py-2">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-full px-4 py-2 border rounded-lg bg-white text-gray-700 shadow-sm focus:ring focus:ring-blue-200 flex justify-between items-center"
            >
              {categories[category]?.name || "Select Category..."}
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
              <div className="absolute z-10 mt-2 bg-white shadow-sm w-full max-h-40 overflow-y-auto scrollbar-hide rounded-lg border">
                <ul className="py-2 text-sm text-gray-700">
                  {Object.entries(categories).map(([key, { name }]) => (
                    <li key={key}>
                      <button
                        type="button"
                        className={`block w-full text-left px-4 py-2 ${
                          category === key
                            ? "bg-gray-200 font-semibold"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setCategory(key);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {name}
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
            Update Ticket
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateTicketForm;
