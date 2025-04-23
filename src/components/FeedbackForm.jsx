import { useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  where,
  query,
  getDocs,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../pages/AdminDashboard";

// const feedbackCategories = {
//   bug: { name: "Bug Report", color: "bg-red-500" },
//   feature: { name: "Feature Request", color: "bg-green-500" },
//   improvement: { name: "Improvement", color: "bg-yellow-500" },
//   other: { name: "Other", color: "bg-gray-500" },
// };

const FeedbackForm = ({ isOpen, onClose, ticket, user }) => {
  const [formData, setFormData] = useState({
    category: ticket.category,
    email: user,
    rating: 1,
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Handle changes in the form inputs
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  // Handle rating button clicks
  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    console.log("Ticket ID:", ticket.id);

    if (!formData.category || !formData.message.trim()) {
      console.log("Form is invalid");
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackRef = collection(db, "feedback");
      const feedbackQuery = query(
        feedbackRef,
        where("ticketId", "==", ticket.id),
        where("userId", "==", auth.currentUser?.uid)
      );

      const querySnapshot = await getDocs(feedbackQuery);
      let feedbackId = null;

      if (querySnapshot.empty) {
        const feedbackDocRef = await addDoc(feedbackRef, {
          ticketId: ticket.id,
          category: ticket.category,
          comment: formData.message,
          description: ticket.description,
          userId: auth.currentUser?.uid,
          feedback: formData.rating,
          status: "Resolved",
          email: user,
          assignee: ticket.assignee,
          createdAt: serverTimestamp(),
        });
        feedbackId = feedbackDocRef.id;
        console.log("New Feedback created with ID:", feedbackId);
      } else {
        const existingFeedbackDoc = querySnapshot.docs[0];
        feedbackId = existingFeedbackDoc.id;
        await updateDoc(existingFeedbackDoc.ref, {
          comment: formData.message,
          feedback: formData.rating,
          updatedAt: serverTimestamp(),
        });
        console.log("Updated existing feedback:", feedbackId);
      }

      // Update both assigned-tickets and tickets collections
      try {
        const assignedTicketRef = doc(
          db,
          "assigned-tickets",
          ticket.feedbackId
        );
        await updateDoc(assignedTicketRef, {
          email: user,
          feedbackId: ticket.feedbackId,
          comment: formData.message,
          feedback: formData.rating,
          updatedAt: serverTimestamp(),
        });
        console.log("Updated assigned-tickets document");
      } catch (updateError) {
        console.error("Error updating tickets:", updateError);
      }

      setFormData({
        category: ticket.category,
        email: user,
        rating: null,
        message: "",
      });

      onClose();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative p-8 w-full max-w-md bg-white rounded-lg shadow-xl transition-opacity animate-fadeIn">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-2xl font-semibold text-gray-800">
            Share Your Feedback
          </h3>
          <button
            type="button"
            className="text-gray-500 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Category Input */}
          <div className="form-group">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Ticket Category
            </label>
            <input
              type="text"
              id="category"
              value={ticket.category}
              disabled
              required
              // Removed disabled to allow this field to be editable
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email Input */}
          <div className="form-group">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Your Email
            </label>
            <input
              type="email"
              id="email"
              value={user}
              disabled
              required
              // Removed disabled to allow this field to be editable
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Rating Buttons */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700">
              How satisfied are you with this ticket?
            </label>
            <div className="flex space-x-2 mt-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`w-10 h-10 rounded-full ${
                    formData.rating === rating
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300"
                  } text-xl`}
                  onClick={() => handleRatingClick(rating)}
                >
                  {rating === 1
                    ? "😔"
                    : rating === 2
                    ? "😐"
                    : rating === 3
                    ? "😊"
                    : rating === 4
                    ? "😃"
                    : "🤩"}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700"
            >
              Your Feedback
            </label>
            <textarea
              id="message"
              placeholder="Describe your experience..."
              value={formData.message}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting} // Disable button when submitting
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
