const fs = require('fs');

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
* Creates a directory if necessary
* @param path Directory path
* @param mask Permission mask (optional -> default: 0777)
* @param cb Callback function.
*/
function ensureExists (path, mask, cb) {
  if (typeof mask === 'function') { // allow the `mask` parameter to be optional
    cb = mask;
    mask = '0777';
  }
  fs.mkdir(path, mask, function (err) {
    if (err) {
      if (err.code === 'EEXIST') cb(null); // ignore the error if the folder already exists
      else cb(err); // something else went wrong
    } else cb(null); // successfully created folder
  });
}

module.exports = {
  generateSystemMessage:  generateSystemMessage,
  ensureExists:           ensureExists
};
