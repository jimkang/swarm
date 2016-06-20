var async = require('async');
var getImageFromConcepts = require('./get-image-from-concepts');
var GetSwarmImage = require('./get-swarm-image');
var createWordnok = require('wordnok').createWordnok;
var pluck = require('lodash.pluck');
var probable = require('probable');
var animals = require('./animals');
var plants = require('./plants');
var callNextTick = require('call-next-tick');

var swarmConceptTable = probable.createTableFromDef({
  '0-49': 'ant',
  '50-79': 'bee',
  '80-99': 'locust',
  '100-119': 'bird',
  '120-139': 'fish',
  '140-149': 'krill',
  '150-159': 'copepod',
  '160-169': 'shrimp',
  '170-179': 'algae',
  '180-189': 'bacterium',
  '190-199': 'robot',
  '200-209': 'soldier',
  '210-229': 'drone',
  '230-239': 'star',
  '240-249': 'goat',
  '250-259': 'cow',
  '260-269': 'sheep',
  '270-279': 'buffalo',
  '280-289': 'insects',
  '290-299': 'animals',
  '300-319': 'linguistically-related-to-target'
});

function getRelatedImageResult(opts, allDone) {
  var twit;
  var config;
  var composeLinkScene;
  var primaryImageResult;
  var secondaryConcept;

  if (opts) {
    source = opts.source;
    twit = opts.twit;
    config = opts.config;
    composeLinkScene = opts.composeScene;
  }

  const getSwarmImage = GetSwarmImage({
    config: config,
    composeLinkScene: composeLinkScene
  });

  var wordnok = createWordnok({
    apiKey: config.wordnikAPIKey
  });

  async.waterfall(
    [
      getPrimaryConcept,
      getImageFromConcepts,
      getSecondaryConcept,
      getImageFromConcepts,
      wrapGetSwarm
    ],
    allDone
  );

  function getPrimaryConcept(done) {
    if (probable.roll(2) === 0) {
      var opts = {
        customParams: {
          limit: 5
        }
      };
      wordnok.getRandomWords(opts, done);
    }
    else {
      var topic;
      if (probable.roll(5) > 2) {
        topic = probable.pickFromArray(plants);
      }
      else {
        topic = probable.pickFromArray(animals);
      }
      console.log('topic', topic);
      callNextTick(done, null, [topic]);
    }
  }
  
  function getSecondaryConcept(thePrimaryImageResult, done) {
    primaryImageResult = thePrimaryImageResult;

    var concept = swarmConceptTable.roll();
    if (concept === 'linguistically-related-to-target') {
      var opts = {
        word: primaryImageResult.concept
      };
      wordnok.getRelatedWords(opts, done);
    }
    else {
      callNextTick(done, null, [concept]);
    }
  }

  function wrapGetSwarm(secondaryImageResult, done) {
    var opts = {
      primaryImageResult: primaryImageResult,
      secondaryImageResult, secondaryImageResult
    };
    getSwarmImage(opts, done);
  }
}

module.exports = getRelatedImageResult;
