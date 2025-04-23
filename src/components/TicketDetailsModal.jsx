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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl transform transition-all">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Ticket Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
          <div className="space-y-6">
            {/* Status, Category, Priority Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Category</p>
                <p className="font-medium text-gray-800">{ticket.category}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Priority</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                    ticket.priority === "Critical"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>

            {/* Timestamps and User Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Feedback By</p>
                  <p className="font-medium text-gray-800">{ticket.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created At</p>
                  <p className="font-medium text-gray-800">
                    {ticket.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
                {ticket.status === "Resolved" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Resolved At</p>
                    <p className="font-medium text-gray-800">
                      {ticket.updatedAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-800 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Rating and Feedback Section */}
            {feedbackData && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">User Rating</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`w-5 h-5 ${
                            index < feedbackData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-medium text-gray-800">
                        {feedbackData.rating}/5
                      </span>
                    </div>
                  </div>
                </div>

                {feedbackData.comment && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">User Feedback</p>
                    <p className="text-gray-800 bg-white p-3 rounded-lg border border-gray-100">
                      "{feedbackData.comment}"
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium text-gray-800">
                        {feedbackData.email}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
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
