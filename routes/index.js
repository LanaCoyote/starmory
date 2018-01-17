var express = require('express');
var router = express.Router();
const Partial = require('../lib/partial');

var armoryString;
const armory = new Partial( '{"categories":{', '}}' );
const armoryLoadPromise = armory.loadMultipleParts({
    "weapons":                    "armory/weapons.json",
    "ammunition":                 "armory/ammunition.json",
    "weapon fusions":             "armory/fusions.json",
    "solarian weapon crystals":   "armory/sol_crystals.json",
    "armor":                      "armory/armor.json",
    "armor upgrades":             "armory/armor_upgrades.json",
    "augmentations":              "armory/augmentations.json"
}).then(() => armoryString = armory.toMinifiedString());

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/data/armory.json', function(req, res, next) {
    armoryLoadPromise.then(function () {
        res.type( 'json' );
        res.send( armoryString );
    }, function ( error ) {
        res.status( 500 );
        res.send( 'error loading armory' );

        console.error( "tried to load the armory but there was an unresolvable error:\n" + error );
    });
});

module.exports = router;
