// server.js
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

res.header("Access-Control-Allow-Credentials", "true");
res.header("Access-Control-Allow-Origin", "http://localhost:3000");

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// In-memory storage (replace with a real database in production)
const users = [];
const messages = [];

// JWT secret (use environment variable in production)
const JWT_SECRET = "your-secret-key";

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });

  const token = jwt.sign({ username }, JWT_SECRET);
  res.cookie("jwt", token, { httpOnly: true });
  res.json({ message: "Registration successful" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, JWT_SECRET);
  res.cookie("jwt", token, { httpOnly: true });
  res.json({ message: "Login successful" });
});

app.get("/api/messages", authenticateToken, (req, res) => {
  res.json(messages);
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("message", (data) => {
    const message = {
      id: Date.now(),
      text: data.text,
      user: data.user,
      timestamp: new Date(),
    };
    messages.push(message);
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
