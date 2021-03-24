const AWS = require('aws-sdk');
const utils = require('./utils');
const constants = require('./constants');

const s3 = new AWS.S3();

/**
 * This function will do the following
 *
 * @param event Event fired to invoke the new update function.
 * @param context
 */
async function lambdaHandleEvent (event, context) {
  utils.generateSystemMessage(`AV definition move S3->EFS start time: ${new Date()}`);

  utils.ensureExists(constants.EFS_AVDEFINITION_DIR);

  // Create the parameters for calling listObjects
  const bucketParams = {
    Bucket: constants.CLAMAV_BUCKET_NAME
  };

  // Call S3 to obtain a list of the objects in the bucket
  s3.listObjects(bucketParams, function (err, data) {
    if (err) {
      console.log('Error', err);
    } else {
      console.log('Success', data);
    }
  });
}

// Export for AWS Lambda
module.exports = {
  lambdaHandleEvent: lambdaHandleEvent
};
