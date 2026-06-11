const fs = require('fs');
const os = require('os');
const path = require('path');

const { getErrorMessage } = require('./errors');

function createTempFilePath(prefix, extension) {
  return path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random()}.${extension}`);
}

async function removeTempFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Falha ao remover arquivo temporario:', filePath, getErrorMessage(error));
    }
  }
}

module.exports = {
  createTempFilePath,
  removeTempFile,
};
