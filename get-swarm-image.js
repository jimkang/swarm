function GetSwarmImage(opts) {
  var config;
  var composeLinkScene;

  if (opts) {
    config = opts.config;
    composeLinkScene = opts.composeLinkScene;
  }

  return getSwarmImage;

  function getSwarmImage(opts, done) {
    var primaryImageResult;
    var secondaryImageResult;

    if (opts) {
      primaryImageResult = opts.primaryImageResult;
      secondaryImageResult = opts.secondaryImageResult;      
    }
    var base64Image = '';

    var composeOpts = {
      thing1URL: primaryImageResult.imgurl,
      thing2URL: secondaryImageResult.imgurl
    };
    composeLinkScene(composeOpts, passImageAndConcept);

    function passImageAndConcept(error, image) {
      if (error) {
        done(error);
        return;
      }

      var result = {
        base64Image: image.toString('base64'),
        concept: primaryImageResult.concept + ' and ' +  secondaryImageResult.concept
      };

      done(null, result);
    }
  }
}

module.exports = GetSwarmImage;
