const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.SECRET_KEY;
const db = require("../db/login");
const multe = require("multer")();
const auth = require("../middleware/auth");
const Redis = require("ioredis");
const redis = new Redis(
  "rediss://red-cjhgavr6fquc73bpdf4g:HMEWicbfLH9qeOpEMo2sSdq5i1mBQibh@oregon-redis.render.com:6379"
);
module.exports = function (router) {
  router.post("/register", multe.any(), async (req, res) => {
    try {
      const mobile = req.body.mobile;
      const email = req.body.email;
      const country = req.body.country;
      const password = req.body.password;
      const role_Id = req.body.role_Id;
      const existingUser = await db.findOne({ email });

      if (existingUser) {
        return res
          .status(409)
          .json({ success: false, message: "Email already exists" });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        const creatusere = await db.create({
          mobile: mobile,
          email: email,
          country: country,
          password: hashedPassword,
          name: req.body.name,
          role_Id: role_Id || 1,
          verify: true,
        });
        const token = jwt.sign({ userid: creatusere._id }, SECRET_KEY, {
          expiresIn: "24h",
        });
        creatusere.token[0] = token;
        await creatusere.save();
        const userdatas = await db
          .findOne(creatusere._id)
          .select("-password -token");
        res.status(200).json({
          token: token,
          data: userdatas,
          success: true,
          message: "User registered successfully",
        });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });
  router.post("/login", multe.any(), async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;

      const user = await db.findOne({ email });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userid: user._id, role_Id: user.role_Id },
        SECRET_KEY,
        {
          expiresIn: "24h",
        }
      );

      user.token[0] = token;
      await user.save();
      const userdatas = await db.findOne(user._id).select("-password -token");
      res.status(200).json({
        token: token,
        data: userdatas,
        success: true,
        message: "User Login successfully",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  //auth of user
  router.get("/home", auth, async (req, res) => {
    try {
      const userid = req.decoded.userid;
      const userdatas = await db.findById(userid).select("-password -token");
      if (userdatas) {
        res.status(200).json({ success: true, data: userdatas });
      } else {
        res.status(401).json({ success: false, message: "User not exists" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.get("/getusers", async (req, res) => {
    try {
      var result = await db.find();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      console.log(error);
    }
  });
  router.delete("/deleteusers/:_id", async (req, res) => {
    try {
      var result = await db.findByIdAndDelete(req.params._id);
      res
        .status(200)
        .json({ success: true, message: "User successfully Deleted!" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      console.log(error);
    }
  });

  router.put("/updateusers/:_id", async (req, res) => {
    try {
      var result = await db.findByIdAndUpdate(req.params._id, {
        $set: req.body,
      });
      res
        .status(200)
        .json({ success: true, message: "User successfully Updated!" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      console.log(error);
    }
  });
  router.get("/user/:_id", multe.any(), async (req, res) => {
    try {
      const result = await db.findById(req.params._id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      console.log(error);
    }
  });

  router.post("/newpasss", multe.any(), auth, async (req, res) => {
    try {
      const newpass = req.body.newpassword;
      const oldpass = req.body.oldpassword;
      const userid = req.decoded.userid;
      const userdatas = await db.findById(userid);
      if(!userdatas){
       return res.status(401).json({ success: false, message: "User not exists" });
      }
      const isPasswordValid = await bcrypt.compare(oldpass, userdatas.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      } else {
        const udpass = await bcrypt.hash(newpass, 10);
        userdatas.password = udpass;
        await userdatas.save();
        return res
          .status(200)
          .json({ success: true, message: "Password updated successfully" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      console.log(error);
    }
  });

  return router;
};
