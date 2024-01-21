const mongoose = require("mongoose");
const express = require("express");
const Document = require("./Document");

require("dotenv").config();
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const app = express(); // Create an Express application

// Set up a default route for the home page
app.get("/", (req, res) => {
  res.send("Server is running successfully!");
});

const server = app.listen(3001, () => {
  console.log("Server is running on port 3001");
});

const io = require("socket.io")(server, {
  cors: {
    // origin: "http://localhost:3000",
    origin: "https://docs-colab-websockets-frontend.vercel.app/",
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}



