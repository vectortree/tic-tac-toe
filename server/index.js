const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require('mongoose');
const User = require("/root/server/models/user.js");
const Game = require("/root/server/models/game.js");
require("dotenv").config({ path: "./config.env" });
const port = process.env.PORT || 5000;
const path = require('path');
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
const validator = require("email-validator");

app.use(cors());
app.use(express.json());
app.use(express.static('../pages'));
app.use(require("./routes/api"));

app.engine('html', require('ejs').renderFile);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());
 
app.listen(port, () => {
  // perform a database connection when server starts
  mongoose
  .connect(process.env.ATLAS_URI, { useNewUrlParser: true })
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.log(err));
  console.log(`Server is running on port: ${port}`);
});

app.use(async function(req, res, next) {
  res.setHeader('X-CSE356', '6306e45058d8bb3ef7f6c3ab');
  next();
});

app.use(session( {
  name: "session-id",
  secret: '6306e45058d8bb3ef7f6c3ab',
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({
    uri: process.env.ATLAS_URI,
    ttl: 86400
  }),
  cookie: {maxAge: 86400000 }
}));

app.get('/ttt', async function(req, res) {
  // Authenticate user
  // If user is authenticated, send game page
  // Else, send login page
  if(req.session.user) {
    console.log(req.session);
    let date = new Date().toLocaleDateString();
    res.render(__dirname + "/../pages/html/game.html", {name: req.session.user.username, date: date});
  }
  else res.sendFile(path.join(__dirname, "../pages/html/index.html"));
  });

app.get('/register', async function(req, res) {
  res.sendFile(path.join(__dirname, "../pages/html/register.html"));
});

app.post('/adduser', async function(req, res) {
  const {username, password, email} = req.body;
  console.log(req.body);
  let usernameFound = false;
  let emailFound = false;
  User.findOne({'username': username}, function(err, user) {
    if(user) usernameFound = true;
    User.findOne({'email': email}, function(err, user) {
      if(user) emailFound= true;
      if(usernameFound && !emailFound) return res.json({status: "ERROR"});
      else if(!usernameFound && emailFound) return res.json({status: "ERROR"});
      else if(usernameFound && emailFound) return res.json({status: "ERROR"});
      else if(!validator.validate(email)) return res.json({status: "ERROR"});
      else {
        bcrypt.hash(password, 10, function(err, hash) {
          let key = crypto.randomBytes(64).toString('hex');

          User.create({username: username, passwordHash: hash, email: email, key: key, score: {human: 0, wopr: 0, tie: 0}});
          // Send verification link to email here
          let transport = nodemailer.createTransport({
            host: 'localhost',
            port: 25,
            tls: {
              rejectUnauthorized: false
            }
          });

          let link = "http://comet.cse356.compas.cs.stonybrook.edu/verify?email=" + encodeURIComponent(email) + "&key=" + encodeURIComponent(key);
          // console.log(link);

          let msg = {
            from: 'no-reply@comet.cse356.compas.cs.stonybrook.edu',
            to: email,
            subject: "Activate your Tic Tac Toe account",
            text: link
          };

          transport.sendMail(msg, function(err, info) {
            if(err) console.log(err);
            else console.log(info);
          });
          return res.json({status: "OK"});
        });
      }
    });
  });
});

app.post('/listgames', async function(req, res) {
  if(!req.session || !req.session.user) return res.json({status: "ERROR"});
  let username = req.session.user.username;
  Game.find({username}, function(err, games) {
    if(err) console.log(err);
    if(!games) return res.json({status: 'OK', games: []});
    let array = [];
    games.forEach((game) => {
      let obj = {id: game.id, start_date: game.start_date};
      array.push(obj);
    });
    return res.json({status: 'OK', games: array});
  });
});

app.post('/getgame', async function(req, res) {
  if(!req.session || !req.session.user) return res.json({status: "ERROR"});
  let username = req.session.user;
  let id = req.body.id;
  console.log(id);
  Game.findOne({_id: id}, function(err, game) {
    if(err) console.log(err);
    // if(!games) return res.json({status: 'OK', games: []);
    if(!game) return res.json({status: "ERROR"});
    return res.json({status: 'OK', grid: game.grid, winner: game.winner});
  });
});

app.post('/getscore', async function(req, res) {
  if(!req.session || !req.session.user) return res.json({status: "ERROR"});
  let username = req.session.user.username;
  User.findOne({username}, function(err, user) {
    if(err) console.log(err);
    // if(!games) return res.json({status: 'OK', games: []);
    return res.json({status: 'OK', human: user.score.human, wopr: user.score.wopr, tie: user.score.tie });
  });
});

app.get('/verify', async function(req, res) {
  const {email, key} = req.query;
  console.log("Received GET request for verification:\n" + req.originalUrl);
  console.log(req.query);
  User.findOne({$and:[{'email': email}, {'key': key}]}, function(err, user) {
    if(err) console.log(err);
    if(user) {
      user.key = '';
      user.save();
      return res.json({status: 'OK'});
    }
    return res.json({status: "ERROR"});
  });
});

app.post('/login', async function(req, res) {
  const {username, password} = req.body;
  console.log(username);
  // Check if login credentials are valid
  if(!username || !password) return res.json({status: "ERROR"});
  User.findOne({username}).then((user) => {
    if(!user) return res.json({status: "ERROR"});
    if(user.key !== '') return res.json({status: "ERROR"});
    bcrypt.compare(password, user.passwordHash).then((valid) => {
      if(!valid) return res.json({status: "ERROR"});
        let sess = {id: user.id, username: user.username, email: user.email};
        req.session.user = sess;
        return res.json({status: 'OK'});
    });
  });
});

app.post('/logout', async function(req, res) {
  if(!req.session || !req.session.user) return res.json({status: "ERROR"});
  req.session.destroy((err) => {
    if(err) throw err;
    res.clearCookie("session-id");
    return res.json({status: 'OK'});
  });
});

app.post('/ttt/play', async function(req, res) {
  let move = req.body.move;
  console.log("Received POST request");
  if(!req.session || !req.session.user) return res.json({status: "ERROR"});
  let username = req.session.user.username;
  Game.findOne({$and: [{username}, {winner: " "}]}, async function(err, game) {
    if(!game) {
      let g = Array(9).fill(" ");
      let d = new Date();
      game = await Game.create({grid: g, winner: " ", username: username, start_date: d });
      console.log("Created new game");
    }
    let grid = game.grid;
    let winner = game.winner;
    console.log(move);
    if(!move) return res.json( { status: 'OK', grid: grid, winner: winner } );
    
    grid[parseInt(move)] = "X";

    let filled = boardFilled(grid);
    winner = findWinner(grid, filled);
    // Generate server-side move
    let rand = parseInt(Math.floor(Math.random() * grid.length));
    console.log(rand);
    if(!filled && winner === " ") {
      while(grid[rand] !== " ") {
        rand = Math.floor(Math.random() * grid.length);
      }
      grid[rand] = "O";
      //for (let i = 0; i < grid.length; i++) {
        //if (grid[i] === " ") {
          //grid[i] = "O";
          //break;
        //}
      //}
    }
    if(winner === " ") winner = findWinner(grid, filled);
    console.log(grid);
    console.log("winner:", winner);
    game.grid = grid;
    game.winner = winner;
    game.save();
    updateScore(winner, username);
    return res.json( { status: 'OK', grid: grid, winner: winner } );
  });
});

function updateScore(winner, username) {
  User.findOne({username: username}, function(err, user) {
    if(err) console.log(err);
    if(user) {
      if(winner === "X") user.score = {human: user.score.human + 1, wopr: user.score.wopr, tie: user.score.tie};
      else if(winner === "O") user.score = {human: user.score.human, wopr: user.score.wopr + 1, tie: user.score.tie};
      else if(winner === "T") user.score = {human: user.score.human, wopr: user.score.wopr, tie: user.score.tie + 1};
      user.save();
    }
  });
}

function findWinner(grid, filled) {
  let winner = " ";
  let winningPos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  // Check if there is a winner
  for(let i = 0; i < winningPos.length; i++) {
    if(threeInARow("X", grid, winningPos[i])) {
      winner = "X";
      return winner;
    }
    if(threeInARow("O", grid, winningPos[i])) {
      winner = "O";
      return winner;
    }
  }
  // If there is no winner and the board is filled, then it's a tie
  if(filled) winner = "T";
  return winner;
}

function threeInARow(playerType, grid, row) {
  for(let i = 0; i < row.length; i++) {
    if(grid[row[i]] !== playerType) return false;
  }
  return true;
}

function boardFilled(grid) {
  for(let i = 0; i < grid.length; i++) {
    if(grid[i] === " ") return false;
  }
  return true;
}

