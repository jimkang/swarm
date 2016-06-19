var config = require('./config');
// var config = require('./test-config');

var Twit = require('twit');
var async = require('async');
var postImage = require('./post-image');
var getPairedImageResult = require('./get-paired-image-result');
const ComposeScene = require('./compose-scene');
var fs = require('fs');
var callNextTick = require('call-next-tick');

var source = 'wordnik';
var dryRun = false;
var tryCount = 0;

if (process.argv.length > 2) {
  if (process.argv[2].toLowerCase() === '--trending-source') {
    source = 'trending';
  }

  dryRun = (process.argv.indexOf('--dry') !== -1);
}

var twit = new Twit(config.twitter);

function tryToPostSwarm() {
  async.waterfall(
    [
      createComposeScene,
      obtainImages,
      postComposedImage
    ],
    wrapUp
  );
}

function createComposeScene(done) {
  ComposeScene({}, done);
}

function obtainImages(composeScene, done) {
  var opts = {
    source: source,
    twit: twit,
    config: config,
    composeScene: composeScene
  };
  getPairedImageResult(opts, done);
}

function postComposedImage(result, done) {
  var postImageOpts = {
    twit: twit,
    dryRun: dryRun,
    base64Image: result.base64Image,
    altText: result.concept,
    caption: '♪ DOO DOO DOO DOO! ♪'
  };

  if (dryRun) {
    const filename = 'image-output/would-have-posted-' +
      (new Date()).toISOString().replace(/:/g, '-') +
      '.png';
    console.log('Writing out', filename);
    fs.writeFileSync(filename, postImageOpts.base64Image, {encoding: 'base64'});
    process.exit();
  }

  if (source === 'trending') {
    postImageOpts.caption += ' #' + result.concept.replace(/ /g, '');
  }
  postImage(postImageOpts, done);
}

function wrapUp(error, data) {
  tryCount += 1;

  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }

    if (tryCount < 5) {
      console.log(tryCount, 'tries so far. Trying again!');
      callNextTick(tryToPostSwarm);
    }
  }
  else {
    // Technically, the user wasn't replied to, but good enough.
    // lastTurnRecord.recordTurn(callOutId, new Date(), reportRecording);
  }
}

tryToPostSwarm();
