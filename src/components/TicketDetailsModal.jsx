import { X, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const TicketDetailsModal = ({ isOpen, onClose, ticket }) => {
  const [feedbackData, setFeedbackData] = useState(null);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (!ticket?.id) {
        console.log("No ticket ID available");
        return;
      }

      console.log("Ticket data:", ticket);

      try {
        // Get feedback data from the assign-tickets collection since it contains the feedback
        if (ticket.feedback && ticket.comment) {
          console.log("Using feedback data from ticket");
          setFeedbackData({
            id: ticket.id,
            rating: ticket.feedback,
            comment: ticket.comment,
            email: ticket.assignee,
            createdAt: ticket.updatedAt,
          });
          return;
        }

        // Fallback: query feedback collection
        const feedbackRef = collection(db, "feedback");
        const feedbackQuery = query(
          feedbackRef,
          where("ticketId", "==", ticket.id)
        );

        const querySnapshot = await getDocs(feedbackQuery);
        console.log("Feedback query results:", querySnapshot.size);

        if (!querySnapshot.empty) {
          const feedbackDoc = querySnapshot.docs[0];
          const feedback = feedbackDoc.data();
          console.log("Found feedback via query:", feedback);
          setFeedbackData({
            id: feedbackDoc.id,
            rating: feedback.feedback,
            comment: feedback.description,
            email: feedback.email,
            createdAt: feedback.createdAt,
          });
        } else {
          console.log("No feedback found for ticket:", ticket.id);
          setFeedbackData(null);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
        setFeedbackData(null);
      }
    };

    if (isOpen && ticket) {
      console.log("Modal opened, fetching feedback");
      fetchFeedbackData();
    }
  }, [isOpen, ticket]);

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all scale-100 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Ticket Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-5rem)] bg-gray-50/30">
          <div className="space-y-6">
            {/* Status, Category, Priority Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-2 font-medium">Status</p>
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-medium inline-block ${
                    ticket.status === "Resolved"
                      ? "bg-green-100 text-green-700"
                      : ticket.status === "In Progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-2 font-medium">Category</p>
                <p className="font-medium text-gray-800">{ticket.category}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-2 font-medium">Priority</p>
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-medium inline-block ${
                    ticket.priority === "Critical"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>

            {/* Timestamps and User Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-medium">Feedback By</p>
                  <p className="font-semibold text-gray-800">{ticket.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-medium">Created At</p>
                  <p className="font-semibold text-gray-800">
                    {ticket.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
                {ticket.status === "Resolved" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-medium">Resolved At</p>
                    <p className="font-semibold text-gray-800">
                      {ticket.updatedAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-3 font-medium">Description</p>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Rating and Feedback Section */}
            {feedbackData && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-3 font-medium">User Rating</p>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`w-6 h-6 ${
                            index < feedbackData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="ml-3 font-semibold text-gray-800">
                        {feedbackData.rating}/5
                      </span>
                    </div>
                  </div>
                </div>

                {feedbackData.comment && (
                  <div>
                    <p className="text-sm text-gray-500 mb-3 font-medium">User Feedback</p>
                    <p className="text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                      "{feedbackData.comment}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-1 font-medium">Created By</p>
                      <p className="font-semibold text-gray-800">
                        {feedbackData.email}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {feedbackData.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsModal;
