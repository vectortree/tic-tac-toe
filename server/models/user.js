const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema for user
const UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required']
  },
  key: {
    type: String,
    required: false
  },

  score: {
    type: {human: Number,
      wopr: Number,
      tie: Number},
      required: true
  }
});

// Create model for user
const User = mongoose.model('user', UserSchema);

module.exports = User;
