import React from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";

function App() {
  // Get the current path
  const path = window.location.pathname;

  // Simple routing
  const renderComponent = () => {
    switch (path) {
      case "/register":
        return <Register />;
      case "/chat":
        return <Chat />;
      case "/login":
      default:
        return <Login />;
    }
  };

  return <div className="min-h-screen bg-gray-100">{renderComponent()}</div>;
}

export default App;
