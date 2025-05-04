require("dotenv").config({ path: ".env" });
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieparser = require("cookie-parser");
const connectdb = require("./config/database");
const router = require("./routes/routes.js");
const path = require("path");

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(cookieparser());

app.use(express.static(path.join(__dirname, "build")));

app.get("/", (req, res) => {
  res.send("rajesh😂");
});

app.use("/api", router);

connectdb().then(() => {
  app.listen(process.env.PORT);
  console.log(`server is running on port ${process.env.PORT}`);
});
