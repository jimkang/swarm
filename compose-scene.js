const async = require('async');
const queue = require('d3-queue').queue;
const Jimp = require('jimp');
const PasteBitmaps = require('paste-bitmaps');
const probable = require('probable');
const values = require('lodash.values');
const easeCubicInOut = require('d3-ease').easeCubicInOut;

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
      var bigThing = thing1;
      var smallThing = thing2;

      if (thing2.bitmap.width * thing2.bitmap.height >
        thing1.bitmap.width * thing1.bitmap.height) {

        bigThing = thing2;
        smallThing = thing1;
      }
      // bigThing.brightness(-1);

      const imageWidth = bigThing.bitmap.width * (3 + probable.roll(1));
      const imageHeight = bigThing.bitmap.height * (3 + probable.roll(1));

      if (bigThing.bitmap.width < 320) {
        bigThing.resize(320, Jimp.AUTO);
      }
      if (smallThing.bitmap.width > 128) {
        smallThing.resize(128, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
      }

      var bigImageSpecs = placeInstances(bigThing, 1);//probable.rollDie(3));
      var smallImageSpecs = placeSwarm(smallThing, 100, bigImageSpecs);

      var pasteOpts = {
        background: {
          width: imageWidth,
          height: imageHeight,
          fill: 0xFFFFFFFF
        },
        images: bigImageSpecs.concat(smallImageSpecs)
      };

      pasteBitmaps(pasteOpts, sceneDone);

      function placeInstances(thing, numberOfThings) {
        var imageSpecs = [];
        var marginX = ~~(imageWidth/3);
        var marginY = ~~(imageHeight/3);

        for (var i = 0; i < numberOfThings; ++i) {
          imageSpecs.push({
            jimpImage: thing,
            x: marginX + probable.roll(imageWidth - 2 * marginX - thing.bitmap.width/2),
            y: marginY + probable.roll(imageHeight - 2 * marginY - thing.bitmap.height/2)
          });
        }
        return imageSpecs;
      }

      function placeSwarm(thing, numberOfThings, targetSpecs) {
        var imageSpecs = [];

        for (var i = 0; i < numberOfThings; ++i) {
          var targetSpec = probable.pickFromArray(targetSpecs);
          var maxDistanceX = imageWidth/3;
          if (targetSpec.x > maxDistanceX) {
            maxDistanceX = targetSpec.x;
          }
          var minDistanceX = targetSpec.jimpImage.bitmap.width/5;

          var maxDistanceY = imageWidth/3;
          if (targetSpec.y > maxDistanceY) {
            maxDistanceY = targetSpec.y;
          }
          var minDistanceY = targetSpec.jimpImage.bitmap.height/5;

          var maxRadius = (maxDistanceX + maxDistanceY)/ 2;
          var minRadius = (minDistanceX + minDistanceY)/ 2;
          
          var angle = 2 * Math.PI * probable.roll(100)/100;
          var radius = minRadius +
            (Math.log(probable.roll(100))/5) * (maxRadius - minRadius);

          imageSpecs.push({
            jimpImage: thing,
            x: targetSpec.x + targetSpec.jimpImage.bitmap.width/2 + radius * Math.cos(angle),
            y: targetSpec.y + targetSpec.jimpImage.bitmap.height/2 + radius * Math.sin(angle) 
          });
        }

        // console.log(JSON.stringify(imageSpecs.map((spec) => ({x: spec.x, y: spec.y})), null, '  '));

        return imageSpecs;
      }
    }
  }
}



module.exports = ComposeScene;
