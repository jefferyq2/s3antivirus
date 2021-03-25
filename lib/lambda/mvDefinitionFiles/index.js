const AWS = require('aws-sdk');
const utils = require('./utils');
const constants = require('./constants');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3();

function downloadFileFromS3 (s3ObjectKey, s3ObjectBucket) {
  const downloadDir = constants.EFS_AVDEFINITION_DIR;
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  const localPath = `${downloadDir}/${path.basename(s3ObjectKey)}`;

  const writeStream = fs.createWriteStream(localPath);

  utils.generateSystemMessage(`Downloading file s3://${s3ObjectBucket}/${s3ObjectKey}`);

  const options = {
    Bucket: s3ObjectBucket,
    Key:    s3ObjectKey
  };

  return new Promise((resolve, reject) => {
    s3.getObject(options).createReadStream().on('end', function () {
      utils.generateSystemMessage(`Finished downloading new object ${s3ObjectKey}`);
      resolve();
    }).on('error', function (err) {
      console.log(err);
      reject(err);
    }).pipe(writeStream);
  });
}

/**
 * This function will do the following
 *
 * @param event Event fired to invoke the new update function.
 * @param context
 */
async function lambdaHandleEvent (event, context) {
  utils.generateSystemMessage(`AV definition move S3->EFS start time: ${new Date()}`);

  // Call S3 to obtain a list of the objects in the bucket
  const filelist = await s3.listObjects({ Bucket: constants.CLAMAV_BUCKET_NAME }, function (err, data) {
    if (err) {
      console.log('Error', err);
    } else {
      utils.generateSystemMessage('Successfully grab metadata of all S3 files.');
      return data;
    }
  }).promise();

  const promises = [];
  // loop through all files
  for (let i = 0; i < filelist.Contents.length; i++) {
    const key = filelist.Contents[i].Key;
    // check if key prefix fits
    if (key.substr(0, constants.PATH_TO_AV_DEFINITIONS.length) === constants.PATH_TO_AV_DEFINITIONS) {
      promises.push(downloadFileFromS3(filelist.Contents[i].Key, constants.CLAMAV_BUCKET_NAME));
    };
  }
  await Promise.all(promises);

  // delete files
  // utils.cleanupFolder(constants.EFS_AVDEFINITION_DIR+'/');
  utils.generateSystemMessage(`AV definition move S3->EFS stop time: ${new Date()}`);
}

// Export for AWS Lambda
module.exports = {
  lambdaHandleEvent: lambdaHandleEvent
};
