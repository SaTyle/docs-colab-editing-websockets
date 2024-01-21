const mongoose = require("mongoose")
const Document = require("./Document")

// require("dotenv");
// mongoose.connect("mongodb+srv://ajit:ajit-123@cluster0.pji9qqc.mongodb.net/word-edit-websockets", {
// // mongoose.connect("mongodb+srv://ajit:ajit-123@ac-mkfq4cb-shard-00-02.pji9qqc.mongodb.net,ac-mkfq4cb-shard-00-00.pji9qqc.mongodb.net,ac-mkfq4cb-shard-00-01.pji9qqc.mongodb.net/word-edit-websockets?authSource=admin&replicaSet=atlas-j706ye-shard-0&ssl=true", {

//     useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false,
//   useCreateIndex: true,
// })

require("dotenv").config(); // Load environment variables from .env file

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});




const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    // origin: "http://docs-colab-editing-websockets.vercel.app/",
    methods: ["GET", "POST"],
  },
})

const defaultValue = ""

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}
