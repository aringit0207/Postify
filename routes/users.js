const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/pinterest");

// Define the User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  fullname: {
    type: String,
    required: true
  },
  dp: {
    type: String, // URL or path to the display picture
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post' // Assuming 'Post' is another model you have for posts
  }]
});

userSchema.plugin(plm);

// Create the User model from the schema
module.exports = mongoose.model('User', userSchema);