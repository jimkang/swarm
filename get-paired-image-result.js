var async = require('async');
var getImageFromConcepts = require('./get-image-from-concepts');
var GetSwarmImage = require('./get-swarm-image');
var createWordnok = require('wordnok').createWordnok;
var pluck = require('lodash.pluck');
var probable = require('probable');
var iscool = require('iscool')();
var splitToWords = require('split-to-words');
var animals = require('./animals');
var plants = require('./plants');
var callNextTick = require('call-next-tick');

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
    if (probable.roll(5) === 0) {
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
    var opts = {
      word: primaryImageResult.concept
    };
    wordnok.getRelatedWords(opts, done);
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
