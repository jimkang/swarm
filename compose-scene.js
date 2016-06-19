const async = require('async');
const Jimp = require('jimp');
const PasteBitmaps = require('paste-bitmaps');
const probable = require('probable');
const roll = probable.roll;
const rollDie = probable.rollDie;

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

      const imageWidth = 1280;
      const imageHeight = 768;

      if (bigThing.bitmap.width < 320) {
        bigThing.resize(320, Jimp.AUTO);
      }
      else if (bigThing.bitmap.width > 960 || bigThing.bitmap.height > 540) {
        bigThing.contain(960, 540);
      }

      if (smallThing.bitmap.width > 128) {
        smallThing.resize(128, Jimp.AUTO);
      }

      var bigImageSpecs = placeInstances(bigThing, rollDie(3));
      var imageSpecs = placeSwarm(smallThing, 100 + roll(150), bigImageSpecs);
      bigImageSpecs.forEach(insertSpecAtRandomPlace);

      var pasteOpts = {
        background: {
          width: imageWidth,
          height: imageHeight,
          fill: roll(3) === 0 ? 0xFFFFFFFF : Jimp.rgbaToInt(roll(256), roll(256), roll(256), 0xFF)
        },
        images: imageSpecs
      };

      pasteBitmaps(pasteOpts, sceneDone);

      function insertSpecAtRandomPlace(spec) {
        imageSpecs.splice(probable.roll(imageSpecs.length), 0, spec);
      }

      function placeInstances(thing, numberOfThings) {
        var imageSpecs = [];
        var marginX = ~~(imageWidth/3);
        var marginY = ~~(imageHeight/3);

        for (var i = 0; i < numberOfThings; ++i) {
          imageSpecs.push({
            jimpImage: thing,
            x: marginX + roll(imageWidth - 2 * marginX - thing.bitmap.width/2),
            y: marginY + roll(imageHeight - 2 * marginY - thing.bitmap.height/2)
          });
        }
        return imageSpecs;
      }

      function placeSwarm(thing, numberOfThings, targetSpecs) {
        var imageSpecs = [];

        for (var i = 0; i < numberOfThings; ++i) {
          var targetSpec = probable.pickFromArray(targetSpecs);
          var maxDistanceX = imageWidth/3 * 2;
          if (targetSpec.x > maxDistanceX) {
            maxDistanceX = targetSpec.x;
          }
          var minDistanceX = targetSpec.jimpImage.bitmap.width/8;

          var maxDistanceY = imageWidth/3 * 2;
          if (targetSpec.y > maxDistanceY) {
            maxDistanceY = targetSpec.y;
          }
          var minDistanceY = targetSpec.jimpImage.bitmap.height/8;

          var maxRadius = (maxDistanceX + maxDistanceY)/ 2;
          var minRadius = (minDistanceX + minDistanceY)/ 2;
          
          var angle = 2 * Math.PI * roll(100)/100;
          var radius = minRadius +
            (roll(33) + roll(33) + roll(34))/100 * (maxRadius - minRadius);

          var specImage = thing.clone().rotate(roll(360))
          // if (roll(10) === 0) {
          //   specImage.invert();
          // }
          if (roll(5) == 0) {
            specImage.color(
              [
                {
                  apply: 'hue',
                  params: [roll(360)]
                }
              ]
            );
          }

          imageSpecs.push({
            jimpImage: specImage,
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
