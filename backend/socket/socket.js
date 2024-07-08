import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";


const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: ["https://live-chat-site.onrender.com"],
		methods: ["GET", "POST"],
	},
});

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId;
	if (userId != "undefined") userSocketMap[userId] = socket.id;

	// io.emit() is used to send events to all the connected clients
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	// socket.on() is used to listen to the events. can be used both on client and server side
	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
	socket.on("newMessage", (data) => {
        // Broadcast the new message to the sender and receiver
        const { receiverId, message } = data;
        const senderSocketId = userSocketMap[data.senderId];
        const receiverSocketId = userSocketMap[receiverId];
        
        if (senderSocketId) io.to(senderSocketId).emit("newMessage", message);
        if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", message);
    });
});

export { app, io, server };
