const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = {}; // socket.id => nickname

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("join-room", nickname => {
    users[socket.id] = nickname;

    // Inform everyone that a new user joined
    socket.broadcast.emit("user-joined", { id: socket.id, name: nickname });

    // Update the full user list to all
    io.emit("update-user-list", Object.values(users));
  });

  socket.on("signal", data => {
    const { to, signal } = data;
    io.to(to).emit("signal", {
      from: socket.id,
      signal
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("update-user-list", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));
