const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const srcPath = path.join(rootPath, 'src');

module.exports = {
  rootPath,
  dllPath,
  srcPath,
};
