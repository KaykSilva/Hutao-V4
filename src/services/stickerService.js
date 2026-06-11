const fs = require('fs');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const { paths, sticker } = require('../config/env');
const {
  convertHuTaoImageToSticker,
  convertImageToSticker,
  convertVideoToSticker,
} = require('./ffmpegService');
const { getErrorMessage } = require('../utils/errors');
const { createTempFilePath, removeTempFile } = require('../utils/tempFiles');

async function createSticker(mediaMessage, mediaType) {
  const inputExt = mediaType === 'imageMessage' ? 'jpg' : 'mp4';
  const inputPath = createTempFilePath('hutao-sticker', inputExt);
  const outputPath = createTempFilePath('hutao-sticker', 'webp');

  try {
    const buffer = await downloadMediaMessage(mediaMessage, 'buffer', {});
    await fs.promises.writeFile(inputPath, buffer);

    if (mediaType === 'imageMessage') {
      await convertImageToSticker(inputPath, outputPath);
    } else {
      await convertVideoToSticker(inputPath, outputPath);
    }

    return await fs.promises.readFile(outputPath);
  } finally {
    await removeTempFile(inputPath);
    await removeTempFile(outputPath);
  }
}

async function sendHuTaoSticker(sock, from) {
  if (!fs.existsSync(paths.huTaoStickerImage)) return;

  const outputPath = createTempFilePath('hutao-extra-sticker', 'webp');

  try {
    await convertHuTaoImageToSticker(paths.huTaoStickerImage, outputPath);
    const stickerBuffer = await fs.promises.readFile(outputPath);
    await sock.sendMessage(from, { sticker: stickerBuffer });
  } catch (error) {
    console.error('Falha ao enviar figurinha extra da Hu Tao:', getErrorMessage(error));
  } finally {
    await removeTempFile(outputPath);
  }
}

function isVideoTooLong(mediaMessage) {
  const seconds = mediaMessage.message.videoMessage?.seconds || 0;
  return seconds > sticker.maxVideoSeconds;
}

module.exports = {
  createSticker,
  isVideoTooLong,
  sendHuTaoSticker,
};
