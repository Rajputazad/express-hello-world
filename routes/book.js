const db = require("../db/book");
const multer = require("multer")({
  limits: { fieldSize: 2 * 1024 * 1024 }
});
const auth = require("../middleware/auth");
const database = require("../db/login")
const nodemailer = require("nodemailer");
module.exports = function (router) {
  //books uploud book image api is panding
  router.post("/bookinfo", multer.any(), auth, async (req, res) => {
    try {
      const data = {
        userid: req.decoded.userid,
        title: req.body.title,
        author: req.body.author,  
        genre: req.body.genre,
        description: req.body.description,
        bookurl:req.body.bookurl
      };

      const datas = await db(data);
      await datas.save();
      res
        .status(200)
        .json({ success: true, message: "book info submited successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "something went wrong" });
    }
  });

  //books on home page
  router.get("/booksget", async (req, res) => {
    try {
      const data = await db.find();
      res.status(200).json({ success: true, data: data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  //user books
  router.get("/userbooks/:userid", auth, async (req, res) => {
    try {
      console.log(req.params);
      const data = await db.find({ userid: req.params.userid });
      res.status(200).json({ success: true, data: data });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  //click to open book
  router.get("/bookget/:id", auth, async (req, res) => {
    try {
      const data = await db.findById(req.params.id);
      res.status(200).json({ success: true, data: data });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.delete("/bookdelete/:_id",auth, async (req, res) => {
    try {
      const cardatas = await db.findByIdAndDelete(req.params._id);
      res
        .status(200)
        .json({ success: true, message: "Book successfully Deleted!" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  router.put("/bookupdate/:_id",auth, async (req, res) => {
    try {
      let update = await db.findByIdAndUpdate(req.params._id, {
        $set: req.body,
      });
      res
        .status(200)
        .json({ success: true, message: "Book successfully updated!" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  //search book by title , genre
  router.get("/search/:search", async (req, res) => {
    try {
      let search = req.params.search;
      let users = await db.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { genre: { $regex: search, $options: "i" } },
          // { "price": { $regex: search, $options: "i" } }
        ],
      });
      // const reversedata = users.reverse();
      res.json({ success: true, data: users });
    } catch (error) {
      res.json({ success: false, message: "something went wrong" });
      console.log(error);
    }
  });
  
  router.post("/inbox",auth,multer.any(),async(req,res)=>{
var userid=req.decoded.userid
// console.log(userid);
var bookid=req.body.bookid
var bookownerid=req.body.bookownerid
try {

if(!req.body.message){
  return res.status(404).json({ message: 'please write something in message' });
}
const users = await database.findById(userid);
const book = await db.findById(bookid);

const user = await database.findById(bookownerid);
console.log(user);
if (!user) {
  return res.status(404).json({ message: 'User not found' });
}
var inboxitem={
  booktitle:book.title,
  username:users.name,
  email:users.email,
  mobile:user.mobile,
  message:req.body.message
}


  // if (user.inbox.some(item => JSON.stringify(item) === JSON.stringify(inboxitem))) {
  //   return res.status(400).json({ message: 'your message already sent' });
  // }
  user.inbox.push(inboxitem);

  // Save the updated user document
  await user.save();
  res.status(200).json({ success: true, data: user,message:"Your message successefully sent" });
} catch (error) {
  console.log(error);
  res
    .status(500)
    .json({ success: false, message: "Internal server error" });
}
  })


  router.post("/request/:itemId",multer.any(),auth,async(req,res)=>{
    try {
      var userid=req.decoded.userid
      const user = await database.findById(userid);
      const itemId = req.params.itemId;
      const inboxMessage = user.inbox.find(message => message._id.toString() === itemId);
  
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
  
      var mailOptions = {
        from: process.env.EMAIL,
        to: inboxMessage.email,
        subject: "Booksharing platform",
        html:`<h1>Hi ${inboxMessage.username} Your request is accepted for book ${inboxMessage.booktitle} </h1> <br> <h3>Now you can contact book owner with mobile:- ${inboxMessage.mobile}</h3> <br>`
      };
      // "singhbhi337@gmail.com"
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          console.log(error);
          // res.send(error);
          res.status(500).json({ success: false, message: 'Email not sent' });
  
        } else {
          console.log("Email sent: " + info.response);
          res.status(200).json({ success: true, data: info.response, message: 'Email sent' });
          // res.status(200).json("Email sent: " + info.response);
          // res.status(200).json("Otp send successfully");
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });

    }

  })

  router.delete('/inbox/:_id',auth, multer.any(), async (req, res) => {
    try {
      const  bookownerid  = req.decoded.userid;
      console.log(bookownerid)
      const { _id } = req.params;
      // console.log(_id)
  
      const user = await database.findById(bookownerid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Use $pull to remove the item with matching bookid and bookownerid
      user.inbox.pull({ _id: _id});
  
      // Save the updated user document
     const result= await user.save();
  
      res.status(200).json({ success: true, data: result, message: 'Item removed from inbox' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  })


router.post("/favorite/:_id", auth,multer.any(), async (req,res)=>{
try {
    var userid=req.decoded.userid
    const user = await database.findById(userid);
    if(!user){
      return res.status(404).json({ message: 'User not found' });
    }
    const users = await db.findById(req.params._id);

   var favoriteitem={
    bookadd:users
   }
   var add=true
  //  console.log(user.favorite[1]._id.toString());
  var result;
  for(i=0;i<user.favorite.length;i++){
    if(user.favorite[i].bookadd._id==req.params._id){
      // console.log(user.favorite[i].bookadd._id==req.params._id);
      // console.log(user.favorite[i]._id);
     await user.favorite.pull({ _id: user.favorite[i]._id.toString()});
       result= await user.save();
      add=false
    }else{
      add=true
    }
  }if(add){
        user.favorite.push(favoriteitem); 
      result= await user.save();
   return  res.status(200).json({ success: true,data :result,  message: 'book added' });
   
  }else{
    return  res.status(200).json({ success: true,data :result,  message: 'book removed' });
    
  }
} catch (error) {
  console.log(error);
  res.status(500).json({ success: false, message: 'Internal server error' });

}

})


router.delete('/favorite/:_id',auth, multer.any(), async (req, res) => {
  try {
    const  userid  = req.decoded.userid;
    // console.log(userid)
    const { _id } = req.params;
    // console.log(_id)

    const user = await database.findById(userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use $pull to remove the item with matching bookid and bookownerid
    user.favorite.pull({ _id: _id});

    // Save the updated user document
   const result= await user.save();

    res.status(200).json({ success: true, data: result, message: 'Item removed from inbox' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
})
const ip = require('ip');

// router.use((req, res, next) => {
//   const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress||req.socket.remoteAddress;
//   console.log(`Client IP: ${clientIp}`);
//   next();
// });

router.get('/get-ip', (req, res) => {
  const clientIps = req.headers['x-forwarded-for'] || req.connection.remoteAddress ||req.socket.remoteAddress;
  console.log(`Client IP: ${clientIps}`);
  const clientIp = ip.address();
  res.json({ ip: clientIp,ips:clientIps });
});








  return router;



};
