const mongoose = require("mongoose");

const loginSchema = mongoose.Schema({
  mobile: {
    require: [true, "User mobile required"],
    unique: [true, "mobile number already exists. try another"],
    type: String,
  },
  password: {
    require: [true, "Password  required"],
    type: String,
  },
  name: {
    require: [true, "name  required"],
    type: String,
  },
  email: {
    require: [true, "email  required"],
    type: String,
    unique: [true, "Email already exists. try another"],
    // type: String
  },
  country: {
    require: [true, "country  required"],
    type: String,
  },

  verify: {
    require: [true, "verify  required"],
    type: Boolean,
  },
  token: [],
  role_Id: {
    require: [true, "role_Id  required"],
    type: Number,
    default: 1,
  },
  inbox: [{ booktitle: String, username: String,message:String ,email:String}],
  favorite:[{bookadd:mongoose.Schema.Types.Mixed}],
  ip:[]
});

module.exports = mongoose.model("Login_Details", loginSchema);
