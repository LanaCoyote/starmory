var express = require('express');
var router = express.Router();

var armory = require('../public/data/armory.json');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
