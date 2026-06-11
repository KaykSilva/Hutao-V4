const fs = require('fs');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const { paths, sticker } = require('../config/env');
const {
  convertHuTaoImageToSticker,
  convertImageToSticker,
  convertVideoToSticker,
  editStickerText,
} = require('./ffmpegService');
const { getErrorMessage } = require('../utils/errors');
const { createTempFilePath, removeTempFile } = require('../utils/tempFiles');

async function createSticker(mediaMessage, mediaType, text) {
  const inputExt = getInputExtension(mediaType);
  const inputPath = createTempFilePath('hutao-sticker', inputExt);
  const outputPath = createTempFilePath('hutao-sticker', 'webp');

  try {
    const buffer = await downloadMediaMessage(mediaMessage, 'buffer', {});
    await fs.promises.writeFile(inputPath, buffer);

    if (mediaType === 'imageMessage') {
      await convertImageToSticker(inputPath, outputPath, text);
    } else if (mediaType === 'videoMessage') {
      await convertVideoToSticker(inputPath, outputPath, text);
    } else {
      await editStickerText(inputPath, outputPath, text);
    }

    return await fs.promises.readFile(outputPath);
  } finally {
    await removeTempFile(inputPath);
    await removeTempFile(outputPath);
  }
}

function getInputExtension(mediaType) {
  if (mediaType === 'imageMessage') return 'jpg';
  if (mediaType === 'videoMessage') return 'mp4';
  return 'webp';
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

async function sendHuTaoCallSticker(sock, from) {
  if (!fs.existsSync(paths.huTaoCallStickerGif)) return;

  const outputPath = createTempFilePath('hutao-call-sticker', 'webp');

  try {
    await convertVideoToSticker(paths.huTaoCallStickerGif, outputPath);
    const stickerBuffer = await fs.promises.readFile(outputPath);
    await sock.sendMessage(from, { sticker: stickerBuffer });
  } catch (error) {
    console.error('Falha ao enviar figurinha de chamada da Hu Tao:', getErrorMessage(error));
  } finally {
    await removeTempFile(outputPath);
  }
}

async function sendErrorSticker(sock, from, quotedMessage) {
  if (!fs.existsSync(paths.errorStickerImage)) return false;

  const outputPath = createTempFilePath('hutao-error-sticker', 'webp');

  try {
    await convertImageToSticker(paths.errorStickerImage, outputPath);
    const stickerBuffer = await fs.promises.readFile(outputPath);
    await sock.sendMessage(from, { sticker: stickerBuffer }, quotedMessage ? { quoted: quotedMessage } : undefined);
    return true;
  } catch (error) {
    console.error('Falha ao enviar figurinha de erro:', getErrorMessage(error));
    return false;
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
  sendErrorSticker,
  sendHuTaoCallSticker,
  sendHuTaoSticker,
};
