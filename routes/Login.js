const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.SECRET_KEY;
const db = require("../db/login");
const multe = require("multer")();
const auth = require("../middleware/auth");
const nodemailer = require("nodemailer");
const axios = require("axios");

// const Redis = require("ioredis");
// const redis = new Redis(
//   "rediss://red-cjhgavr6fquc73bpdf4g:HMEWicbfLH9qeOpEMo2sSdq5i1mBQibh@oregon-redis.render.com:6379"
// );
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
      const userdatas = await db
        .findOne(user._id)
        .select("-password -token -ip");
      res.status(200).json({
        token: token,
        data: userdatas,
        success: true,
        message: "User Login successfully",
      });
      const allowedIpAddress = user.ip;
      const clientIp =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
      if (clientIp != allowedIpAddress) {
      await  loginacc(user, clientIp);
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  async function loginacc(user, clientIp) {
    try {
      // console.log(clientIp);
      const ACCESS_KEY = "46da4f42faa1e035eb8c0d0856789935";
      const ipAddress = clientIp; // Replace with the IP address you want to look up
      var data;
      await axios
        .get(`http://api.ipstack.com/${ipAddress}?access_key=${ACCESS_KEY}`)
        .then((response) => {
          data = response.data;
          console.log("IP Address:", data.ip);
          console.log("Country:", data.country_name);
          console.log("Region:", data.region_name);
          console.log("City:", data.city);
          console.log("Zip Code:", data.zip);
          console.log("Latitude:", data.latitude);
          console.log("Longitude:", data.longitude);
        })
        .catch((error) => {
          console.error("Error:", error.message);
        });
      const now = new Date();
      const options = { timeZone: "Asia/Kolkata" };
      const day = now.toLocaleDateString("en-US", { weekday: "long" });
      const month = now.toLocaleDateString("en-US", { month: "long" });
      const time = now.toLocaleTimeString("en-US", options);

      const formattedDate = `${day}, ${month} ${now.getDate()}, ${now.getFullYear()} at ${time}`;
      // console.log(formattedDate,user.email)

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      var mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Booksharing platform",
        html: `<table border="0" width="430" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 auto 0 auto"><tbody><tr><td><table border="0" width="430px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin:0 auto 0 auto;text-align:center"><tbody><tr><td height="16" style="line-height:16px">&nbsp;</td></tr><tr><td><table border="0" width="300px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;text-align:center;margin:0 auto 0 auto"><tbody><tr><td style="width:300px;padding:0;margin:0;text-align:center;color:#262626;font-size:18px;font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif">We've noticed a new <span class="il">login</span>, ${user.name}</td></tr></tbody></table></td></tr><tr><td height="4" style="line-height:4px">&nbsp;</td></tr><tr><td><table border="0" width="300px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;text-align:center;margin:0 auto 0 auto"><tbody><tr><td style="width:300px;padding:0;margin:0;text-align:center;color:#999999;font-size:14px;font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif">We've noticed a <span class="il">login</span> from a device that you don't usually use.</td></tr></tbody></table></td></tr><tr><td height="16" style="line-height:16px">&nbsp;</td></tr></tbody></table></td></tr><tr><td><table border="0" width="430px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin:0 auto 0 auto;text-align:center;width:430px"><tbody><tr><td height="16" style="line-height:16px">&nbsp;</td></tr><tr><td align="center"><img width="76" src="https://ci4.googleusercontent.com/proxy/hsRmjjdXxg_iVT6scHGWNNF1lwe99d-tWc7JjvzuKq7D7VdEEJfDiLPyWvfntgiSsI2HrlhTwLSGNgyr96Yk4BbUfTG11H_VpqhjnZaJ-w=s0-d-e1-ft#https://static.xx.fbcdn.net/rsrc.php/v3/yp/r/7JLEaDkKvA7.png" height="76" style="border:0" class="CToWUd" data-bit="iit"></td></tr><tr><td height="16" style="line-height:16px">&nbsp;</td></tr></tbody></table></td></tr><tr><td><table border="0" width="430px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin:0 auto 0 auto;text-align:center;width:430px"><tbody><tr><td><table border="0" width="300px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;text-align:center;margin:0 auto 0 auto"><tbody><tr><td align="center" style="width:300px;padding:0;margin:0;text-align:center;color:#262626;font-size:16px;font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif">${data.region_name} · ${data.city} · ${data.zip}, ${data.country_name}</td></tr></tbody></table></td></tr><tr><td height="4" style="line-height:4px">&nbsp;</td></tr><tr><td><table border="0" width="300px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;text-align:center;margin:0 auto 0 auto"><tbody><tr><td align="center" style="width:300px;padding:0;margin:0;text-align:center;color:#999999;font-size:14px;font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif">${formattedDate}</td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td><table border="0" width="430px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin:0 auto 0 auto;text-align:center;width:430px"><tbody><tr><td height="16" style="line-height:16px">&nbsp;</td></tr><tr><td style="border-top:solid 1px #dbdbdb"></td></tr><tr><td height="16" style="line-height:16px">&nbsp;</td></tr></tbody></table></td></tr><tr><td><table border="0" width="430px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin:0 auto 0 auto;text-align:center;width:430px"><tbody><tr><td height="24" style="line-height:24px">&nbsp;</td></tr><tr><td><table border="0" width="300px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;text-align:center;margin:0 auto 0 auto"><tbody><tr><td style="width:300px;padding:0;margin:0;text-align:center;color:#999999;font-size:14px;font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif">/td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td><table border="0" width="430px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin:0 auto 0 auto;text-align:center;width:430px"><tbody><tr><td height="16" style="line-height:16px">&nbsp;</td></tr><tr><td><table border="0" width="300px" cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;text-align:center;margin:0 auto 0 auto"><tbody><tr><td style="width:300px;padding:0;margin:0;text-align:center;color:#999999;font-size:14px;font-family:Helvetica Neue,Helvetica,Roboto,Arial,sans-serif"></td></tr></tbody></table></td></tr><tr><td height="16" style="line-height:16px">&nbsp;</tbody></table></td></tr></tbody></table>`,
      };
      // "singhbhi337@gmail.com"
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          console.log(error);
          // res.send(error);
        } else {
          console.log("Email sent: " + info.response);
          // res.status(200).json("Email sent: " + info.response);
          // res.status(200).json("Otp send successfully");
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

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
      if (!userdatas) {
        return res
          .status(401)
          .json({ success: false, message: "User not exists" });
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
