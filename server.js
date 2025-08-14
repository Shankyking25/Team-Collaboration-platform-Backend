require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes= require('./src/routes/auth')

const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const messageRoutes = require('./src/routes/messages');
const teamRoutes = require('./src/routes/team');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());





const httpServer = require("http").createServer(app);
const { Server } = require("socket.io");
const io = require("socket.io")(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("joinTeam", (teamId) => {
    socket.join(teamId);
  });

  socket.on("sendMessage", (msg) => {
    io.to(msg.teamId).emit("newMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});



app.get("/", (_, res) => res.send("----API Running-------"));
app.use("/api/auth", authRoutes);

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/team', teamRoutes)

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));
});
