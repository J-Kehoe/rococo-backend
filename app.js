const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });
const port = process.env.PORT ?? 3000;

app.use(express.static('public'))

app.get('*', (req, res) => {
    res.redirect('/');
})

httpServer.listen(port, () => {
    console.log(`App listening on port ${port}`);
})

const photos = [];

io.on("connection", (socket) => {

  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("join-room", (roomId, userId) => {

    console.log("🔥: join-room", roomId, userId);

    socket.join(roomId);


    const roomIndex = photos.findIndex((obj) => obj.roomId === roomId);
    const roomPhotos = photos[roomIndex]

    if (roomPhotos) {
      console.log(`room ${roomId} exists, sending photos`)
      io.to(roomId).emit("photos", roomPhotos.photos);
    } else {
      console.log(`room ${roomId} does not exist, creating and sending photos`)
      const newPhotos = { roomId: roomId, photos: [] }
      photos.push(newPhotos);
      io.to(roomId).emit("photos", newPhotos.photos);
    }
  });

  socket.on("checkRooms", (code, ack) => {
    console.log(`checking for room ${code}`)
    const roomIndex = photos.findIndex(obj => obj.roomId === code);
    ack(photos[roomIndex] ? true : false)
  })

  socket.on("send-photo", (roomId, imgData) => {
    console.log(`🔥: send-photo for room ${roomId}`);
    const roomIndex = photos.findIndex(obj => obj.roomId === roomId);
    photos[roomIndex].photos.push(imgData)

    console.log('server photos updated')

    io.to(roomId).emit("photos", photos[roomIndex].photos);
  });

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });
});