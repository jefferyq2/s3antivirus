/**
 * Lambda function handler that will update the definitions stored in S3.
 */

const clamav = require('./clamav');
const utils = require('./utils');
const constants = require('./constants');
const fs = require('fs');

/**
 * This function will do the following
 * 0. Cleanup the folder beforehand to make sure there's enough space.
 * 1. Download the S3 definitions from the S3 bucket.
 * 2. Invoke freshclam to download the newest definitions
 * 3. Cleanup the folders
 * 4. Upload the newest definitions to the existing bucket.
 *
 * @param event Event fired to invoke the new update function.
 * @param context
 */
async function lambdaHandleEvent (event, context) {
  utils.generateSystemMessage(`AV definition update start time: ${new Date()}`);

/*   // create directory if necessary
  if (!fs.existsSync(constants.TMP_AVDEFINITION_DIR)) {
    fs.mkdirSync(constants.TMP_AVDEFINITION_DIR, { recursive: true });
  }

  // cleanup tmp directory if necessary
  utils.cleanupFolder(constants.TMP_AVDEFINITION_DIR + '/');

  // download Antivirus definition files
  clamav.updateAVDefinitonsWithFreshclam();

  // move definition files to s3
  const test = await clamav.uploadAVDefinitions();
  console.log('Put to S3 result: ', test); */

  utils.generateSystemMessage(`AV definition update end time: ${new Date()}`);
}

// Export for AWS Lambda
module.exports = {
  lambdaHandleEvent: lambdaHandleEvent
};
