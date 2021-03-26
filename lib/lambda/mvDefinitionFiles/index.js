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

  // download files from S3 to EFS
  const promisesDL = filelist.Contents.map((item) => {
    if (item.Key.substr(0, constants.PATH_TO_AV_DEFINITIONS.length) === constants.PATH_TO_AV_DEFINITIONS) {
      return downloadFileFromS3(item.Key, constants.CLAMAV_BUCKET_NAME);
    }
    return null;
  });
  await Promise.all(promisesDL);

  // cleanup files on S3
  const deleteParam = {
    Bucket: constants.CLAMAV_BUCKET_NAME,
    Delete: {
      Objects: filelist.Contents.map((item) => { return { Key: item.Key }; })
    }
  };
  utils.generateSystemMessage(`Remove definition files from S3 bucket: ${constants.CLAMAV_BUCKET_NAME}`);
  await s3.deleteObjects(deleteParam, function (err, data) {
    if (err) console.log(err, err.stack);
    else console.log('delete', data);
  }).promise();

  utils.generateSystemMessage(`AV definition move S3->EFS stop time: ${new Date()}`);
}

// Export for AWS Lambda
module.exports = {
  lambdaHandleEvent: lambdaHandleEvent
};
