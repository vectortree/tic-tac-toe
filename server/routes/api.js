const express = require('express');
const router = express.Router();
const Game = require('../models/game');

router.get('/play', (req, res, next) => {
  // get placeholder
});

router.post('/play', (req, res, next) => {
  if (req.body.action) {
    Game.create(req.body).then((data) => res.json(data)).catch(next);
  } else {
    res.json({ error: 'Error' });
  }
});

module.exports = router;