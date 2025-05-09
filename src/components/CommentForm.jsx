import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { EmojiPicker } from "frimousse";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const CommentForm = ({ isOpen, onClose, ticket, user }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  // Add the handleEmojiSelect function
  const handleEmojiSelect = (emoji) => {
    setComment((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to messages in real-time with proper cleanup
  useEffect(() => {
    // Update the message collection path to use ticket.id
    if (!ticket?.id || !isOpen) return;

    const messagesRef = collection(db, "tickets", ticket.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    console.log("Chat room opened for ticket:", {
      ticketId: ticket.id,
      category: ticket.category,
      status: ticket.status,
      messagesPath: `tickets/${ticket.UserId}/messages`,
    });

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(newMessages);
      scrollToBottom();
    });

    return () => {
      console.log("Closing chat room for ticket:", ticket.id);
      unsubscribe();
      setMessages([]);
    };
  }, [ticket?.id, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !ticket?.id) return;

    setIsSubmitting(true);

    try {
      const messagesRef = collection(db, "tickets", ticket.id, "messages");

      // Check if user exists and has required properties
      if (!user || !user.email) {
        console.error("User authentication data:", user);
        throw new Error("Please sign in to send messages");
      }

      const senderData = {
        email: user.email,
        photoURL:
          user.photoURL ||
          `https://api.dicebear.com/6.x/initials/svg?seed=${user.email}`,
        role: user.role || "user",
        ticketCategory: ticket.category,
        ticketStatus: ticket.status,
        userId: user.uid || null, // Add user ID if available
      };

      await addDoc(messagesRef, {
        message: comment.trim(),
        createdAt: serverTimestamp(),
        sender: senderData,
        status: "sent",
        ticketContext: {
          category: ticket.category,
          status: ticket.status,
          issueColor: ticket.issueColor,
        },
      });

      setComment("");
    } catch (error) {
      console.error("Error submitting message:", error);
      // Show error to user
      alert(error.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add message status indicators
  const MessageStatus = ({ status, deliveredAt, readAt }) => (
    <span className="text-xs text-gray-400 ml-2">
      {readAt
        ? "Read"
        : deliveredAt
        ? "Delivered"
        : status === "sent"
        ? "Sent"
        : "Sending..."}
    </span>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative p-8 w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center align-middle justify-around gap-5">
            <h3 className="text-xl font-semibold text-gray-800">
              {ticket.category || "Message"}
            </h3>
            <p className="text-sm text-gray-500">
              Status:{" "}
              <span
                className={`p-1 text-xs rounded-full ${ticket.issueColor} text-white`}
              >
                {ticket.status}
              </span>
            </p>
          </div>
          <button
            type="button"
            className="text-gray-500 hover:bg-gray-100 rounded-full p-2"
            onClick={onClose}
          >
            ✖
          </button>
        </div>

        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender?.email === user.email
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div className="flex items-end space-x-2">
                {msg.sender?.email !== user.email && (
                  <img
                    src={
                      msg.sender?.photoURL ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${msg.sender?.email}`
                    }
                    alt="avatar"
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div
                  className={`max-w-xs rounded-lg p-3 ${
                    msg.sender?.email === user.email
                      ? "bg-blue-700 text-white rounded-br-none"
                      : "bg-blue-600 text-white rounded-br-none"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs mt-1 opacity-70">
                      {msg.createdAt?.toDate().toLocaleString() || "Just now"}
                    </p>
                    {msg.sender?.email === user.email && (
                      <MessageStatus
                        status={msg.status}
                        deliveredAt={msg.deliveredAt}
                        readAt={msg.readAt}
                      />
                    )}
                  </div>
                </div>
                {msg.sender?.email === user.email && (
                  <img
                    src={
                      user.photoURL ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${user.email}`
                    }
                    alt="avatar"
                    className="h-8 w-8 rounded-full"
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2">
                  <EmojiPicker.Root
                    className="isolate flex h-[368px] w-fit flex-col bg-white dark:bg-neutral-900 shadow-lg rounded-lg"
                    onEmojiSelect={handleEmojiSelect}
                  >
                    <EmojiPicker.Search className="z-10 mx-2 mt-2 appearance-none rounded-md bg-neutral-100 px-2.5 py-2 text-sm dark:bg-neutral-800" />
                    <EmojiPicker.Viewport className="relative flex-1 outline-hidden">
                      <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
                        Loading…
                      </EmojiPicker.Loading>
                      <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
                        No emoji found.
                      </EmojiPicker.Empty>
                      <EmojiPicker.List
                        className="select-none pb-1.5"
                        components={{
                          CategoryHeader: ({ category, ...props }) => (
                            <div
                              className="bg-white px-3 pt-3 pb-1.5 font-medium text-neutral-600 text-xs dark:bg-neutral-900 dark:text-neutral-400"
                              {...props}
                            >
                              {category.label}
                            </div>
                          ),
                          Row: ({ children, ...props }) => (
                            <div className="scroll-my-1.5 px-1.5" {...props}>
                              {children}
                            </div>
                          ),
                          Emoji: ({ emoji, ...props }) => (
                            <button
                              className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-neutral-100 dark:data-[active]:bg-neutral-800"
                              {...props}
                            >
                              {emoji.emoji}
                            </button>
                          ),
                        }}
                      />
                    </EmojiPicker.Viewport>
                  </EmojiPicker.Root>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentForm;
