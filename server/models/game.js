const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema for game
const GameSchema = new Schema({
  grid: {
    type: [String],
    required: [true, 'The grid array is required'],
  },
  winner: {
    type: String,
    required: false
  },

  username: {
    type: String,
    required: [true, 'User is required']
  },

  start_date: {
    type: Date,
    required: [true, 'Date is required']
  }
});

// Create model for game
const Game = mongoose.model('game', GameSchema);

module.exports = Game;
