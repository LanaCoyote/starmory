var express = require('express');
var router = express.Router();
const Partial = require('../lib/partial');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/data/armory.json', function(req, res, next) {
  const armory = new Partial( '{"categories":{', '}}' );

  console.log('loading armory partials...');
  armory.loadMultipleParts({
      "weapons":                    "armory/weapons.json",
      "ammunition":                 "armory/ammunition.json",
      "weapon fusions":             "armory/fusions.json",
      "solarian weapon crystals":   "armory/sol_crystals.json",
      "armor":                      "armory/armor.json",
      "armor upgrades":             "armory/armor_upgrades.json",
      "augmentations":              "armory/augmentations.json"
  }).then(function () {
      console.log('completed');
      res.type( 'json' );
      res.send( armory.toString() );
  }, console.error);
});

module.exports = router;
