const fs = require('fs');
const constants = require('./constants');
const execSync = require('child_process').execSync;

/**
 * Generates the set of tags that will be used to tag the files of S3.
 * @param virusScanStatus String representing the status.
 * @return {{TagSet: *[]}} TagSet ready to be attached to an S3 file.
 */
function generateTagSet(virusScanStatus) {
    return {
        TagSet: [
            {
                Key  : constants.VIRUS_STATUS_STATUS_KEY,
                Value: virusScanStatus
            },
            {
                Key  : constants.VIRUS_SCAN_TIMESTAMP_KEY,
                Value: new Date().getTime().toString()
            }
        ]
    };
}

/**
 * Cleanup the specific S3 folder by removing all of its content.
 * We need that to cleanup the /tmp/ folder after the download of the definitions.
 */
function cleanupFolder(folderToClean) {
  let result = execSync(`ls -l ${folderToClean}`);

  console.log('-- Folder before cleanup--');
  console.log(result.toString());

  execSync(`rm -rf ${folderToClean}*`);

  result = execSync(`ls -l ${folderToClean}`);

  console.log('-- Folder after cleanup --');
  console.log(result.toString());
}

/**
 * Extract the key from an S3 event.
 * @param s3Event Inbound S3 event.
 * @return {string} decoded key.
 */
function extractKeyFromS3Event(s3Event) {
    let key = s3Event['Records'][0]['s3']['object']['key'];

    if (!key) {
        throw new Error('Unable to retrieve key information from the event');
    }

    return key.replace(/\+/g,' ');
}

/**
 * Extract the bucket from an S3 event.
 * @param s3Event Inbound S3 event.
 * @return {string} Bucket
 */
function extractBucketFromS3Event(s3Event) {
    let bucketName = s3Event['Records'][0]['s3']['bucket']['name'];

    if (!bucketName) {
        throw new Error('Unable to retrieve bucket information from the event');
    }

    return bucketName;
}

/**
 * Extract the key from an Api Gateway event.
 * @param  Invoked from 3rd party, Inbound Api event.
 * @return {string} decoded key.
 */
function extractKeyFromApiEvent(s3Event) {
    let key = s3Event.s3Key;

    if (!key) {
        throw new Error('Unable to retrieve key information from the api event');
    }

    return key.replace(/\+/g,' ');
}

/**
 * Extract the bucket from an Api Gateway event.
 * @param  Invoked from 3rd party, Inbound Api event.
 * @return {string} Bucket
 */
function extractBucketFromApiEvent(s3Event) {
    let bucketName = s3Event.s3Bucket;

    if (!bucketName) {
        throw new Error('Unable to retrieve bucket information from the api event');
    }

    return bucketName;
}

/**
 * Generates & logs a system message (simple --- the message here ---)
 * @param systemMessage Inbound message to log and generate.
 * @return {string} Formatted message.
 */
function generateSystemMessage(systemMessage) {
    let finalMessage = `--- ${systemMessage} ---`;
    console.log(finalMessage);
    return finalMessage
}

/**
 * Creates a directory if necessary
 * @param path Directory path
 * @param mask Permission mask (optional -> default: 0777)
 * @param cb Callback function.
 */
function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

module.exports = {
    generateTagSet          : generateTagSet,
    cleanupFolder           : cleanupFolder,
    extractKeyFromS3Event   : extractKeyFromS3Event,
    extractBucketFromS3Event: extractBucketFromS3Event,
    extractKeyFromApiEvent   : extractKeyFromApiEvent,
    extractBucketFromApiEvent: extractBucketFromApiEvent,
    generateSystemMessage   : generateSystemMessage,
    ensureExists            : ensureExists
};