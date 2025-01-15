import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useNavigate } from 'react-router-dom';

const SOCKET_URL = "https://chatbackend-xi.vercel.app";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const username = localStorage.getItem("username");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }

    const initializeSocket = () => {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected");
        setLoading(false);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setLoading(false);
      });

      socketRef.current.on("message", (message) => {
        setMessages((prev) => [...prev, message]);
      });
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${SOCKET_URL}/api/messages`, {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
      setLoading(false);
    };

    initializeSocket();
    fetchMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [username, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && username) {
      console.log("Sending message:", newMessage);
      socketRef.current.emit("message", {
        text: newMessage,
        user: username,
      });
      setNewMessage("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    navigate('/login');
  };

  if (!username) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-blue-500 text-white p-4">
        <div className="flex justify-between items-center">
          <h1>Chat as {username}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${
              message.user === username ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs rounded-lg p-3 ${
                message.user === username
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <p className="text-sm font-semibold">{message.user}</p>
              <p>{message.text}</p>
              <p className="text-xs opacity-75">
                {message.timestamp
                  ? new Date(message.timestamp).toLocaleTimeString()
                  : ""}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
