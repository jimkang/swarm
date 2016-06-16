const async = require('async');
const queue = require('d3-queue').queue;
const Jimp = require('jimp');
const PasteBitmaps = require('paste-bitmaps');
const probable = require('probable');
const values = require('lodash.values');

function ComposeScene(createOpts, createDone) {
  var pasteBitmaps;
  var pasteConfig = {
  };
  PasteBitmaps(pasteConfig, passComposeFn);

  function passComposeFn(error, thePasteBitmapsFn) {
    if (error) {
      createDone(error);
    }
    else {
      pasteBitmaps = thePasteBitmapsFn;
      createDone(null, ComposeScene);
    }
  }

  function ComposeScene(opts, sceneDone) {
    var thing1URL;
    var thing2URL;
    var scene;

    if (opts) {
      thing1URL = opts.thing1URL;
      thing2URL = opts.thing2URL;
    }

    Jimp.read(thing1URL, getThing2Image);

    function getThing2Image(error, thing1) {
      if (error) {
        sceneDone(error);
      }
      else {
        Jimp.read(thing2URL, wrapMakeScene);
      }

      function wrapMakeScene(error, thing2) {
        if (error) {
          sceneDone(error);
        }
        else {
          makeSceneWithThings(thing1, thing2);
        }
      }
    }

    function makeSceneWithThings(thing1, thing2) {
      const repeatCount = probable.rollDie(100);
      // Square layout
      const repeatsToASide = Math.ceil(Math.sqrt(repeatCount));
      const imageWidth = repeatsToASide * thing1.bitmap.width;
      const imageHeight = repeatsToASide * thing1.bitmap.height;
      var imageSpecs = [];

      // TODO: Grid-ish layout that doesn't make things block other things.

      for (var x = 0; x < repeatsToASide; ++x) {
        for (var y = 0; y < repeatsToASide; ++y) {
          imageSpecs.push({
            jimpImage: thing1,
            x: probable.roll(imageWidth),
            y: probable.roll(imageHeight)
            // x: x * thing.bitmap.width,
            // y: y * thing.bitmap.height
          });
        }
      }

      for (var x = 0; x < repeatsToASide; ++x) {
        for (var y = 0; y < repeatsToASide; ++y) {
          imageSpecs.push({
            jimpImage: thing2,
            x: probable.roll(imageWidth),
            y: probable.roll(imageHeight)
            // x: x * thing.bitmap.width,
            // y: y * thing.bitmap.height
          });
        }
      }

      var pasteOpts = {
        background: {
          width: imageWidth,
          height: imageHeight,
          fill: 0xFFFFFFFF
        },
        images: imageSpecs
      };

      pasteBitmaps(pasteOpts, sceneDone);
    }
  }
}

module.exports = ComposeScene;
