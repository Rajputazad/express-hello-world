require("dotenv").config();
require("./db/config");
var morgan = require("morgan");
const express = require("express");
const app = express();
const port = 3000;
const router = express.Router();
const login = require("./routes/Login")(router);
require("./routes/book")(router);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:3006","https://653e6432779d1a78ee281d4e--spiffy-figolla-e84639.netlify.app"],
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id,authorization"
  );
  next();
});

const auth = require("./middleware/auth");
var cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(morgan("dev"));

app.use("/", login);

app.listen(port, () => {
  console.log(`Port = ${port} URL:-http://localhost:${port}/`);
});
