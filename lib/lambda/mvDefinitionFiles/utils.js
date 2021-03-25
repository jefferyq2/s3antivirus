const fs = require('fs');
const execSync = require('child_process').execSync;

/**
 * Generates & logs a system message (simple --- the message here ---)
 * @param systemMessage Inbound message to log and generate.
 * @return {string} Formatted message.
 */
function generateSystemMessage (systemMessage) {
  const finalMessage = `--- ${systemMessage} ---`;
  console.log(finalMessage);
  return finalMessage;
}

/**
 * Cleanup the specific S3 folder by removing all of its content.
 * We need that to cleanup the /tmp/ folder after the download of the definitions.
 */
function cleanupFolder (folderToClean) {
  let result = execSync(`ls -l ${folderToClean}`);

  console.log('-- Folder before cleanup--');
  console.log(result.toString());

  execSync(`rm -rf ${folderToClean}*`);

  result = execSync(`ls -l ${folderToClean}`);

  console.log('-- Folder after cleanup --');
  console.log(result.toString());
};

module.exports = {
  generateSystemMessage:  generateSystemMessage,
  cleanupFolder:          cleanupFolder
};
