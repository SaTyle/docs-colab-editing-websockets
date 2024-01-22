const mongoose = require("mongoose");
const express = require("express");
const Document = require("./Document");

require("dotenv").config();


 mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,

});





const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running successfully!");
});

app.get("/documents/:documentId", async (req, res) => {
  const documentId = req.params.documentId;
  const document = await findOrCreateDocument(documentId);
  res.json({ data: document.data });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "https://collaborative-doc-editor.vercel.app/documents/59f7e4ff-2b61-4eca-bfb7-bc3ed2d2ec12",
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
  if (!id) return;

  const document = await Document.findById(id);
  if (document) return document;
  
  return await Document.create({ _id: id, data: defaultValue });
}
