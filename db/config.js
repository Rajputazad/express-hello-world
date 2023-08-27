require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL);
// console.log();
var server = mongoose.connection;

server.on("connected", function () {
  console.log("Successfully connected to MongoDB !!!");
});
server.on("disconnected", function () {
  console.log("Successfully disconnected to MongoDB !!!");
});
server.on("error", console.error.bind(console, "connection error:"));
