var express = require('express');
var router = express.Router();
const fs = require('fs');

var armory = require('../public/data/armory.json');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

module.exports = router;
