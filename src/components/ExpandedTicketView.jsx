import { X } from "lucide-react";

const ExpandedTicketView = ({ isOpen, onClose, ticket }) => {
  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ticket Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-lg font-semibold text-gray-900">{ticket.title}</p>
        <p className="text-sm text-gray-600">{ticket.category}</p>
        <div className="mt-4 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">
          <p className="text-gray-700">{ticket.description}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Created:{" "}
          {ticket.createdAt?.seconds
            ? new Date(ticket.createdAt.seconds * 1000).toLocaleString()
            : "Unknown"}
        </p>
        <p className="mt-3 text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-300 w-max">
          {ticket.status}
        </p>
      </div>
    </div>
  );
};

export default ExpandedTicketView;
