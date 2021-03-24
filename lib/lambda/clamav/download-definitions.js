/**
 * Lambda function handler that will update the definitions stored in S3.
 */

const clamav = require('./clamav');
const utils = require('./utils');
const execSync = require('child_process').execSync;
const constants = require('./constants');

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
async function lambdaHandleEvent(event, context) {
  utils.generateSystemMessage(`AV definition update start time: ${new Date()}`);

  await utils.ensureExists(constants.FRESHCLAM_AVDEFINITION_DIR, function(err) {
    if (err) {throw new Error(`Somehting went wrong with creating the AV definition directory: ${err}`); };
  });
  await utils.cleanupFolder(constants.FRESHCLAM_AVDEFINITION_DIR);

  await clamav.updateAVDefinitonsWithFreshclam();

  let result = execSync(`ls -l ${constants.FRESHCLAM_AVDEFINITION_DIR}`);

  utils.generateSystemMessage("Folder content after freshclam ");
  console.log(result.toString());
  await clamav.uploadAVDefinitions();

  utils.generateSystemMessage(`AV definition update end time: ${new Date()}`);
}

// Export for AWS Lambda
module.exports = {
    lambdaHandleEvent: lambdaHandleEvent
};