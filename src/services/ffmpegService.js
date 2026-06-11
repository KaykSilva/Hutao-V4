const { execFile } = require('child_process');
const { promisify } = require('util');

const { paths, sticker } = require('../config/env');

const execFileAsync = promisify(execFile);

async function convertImageToSticker(inputPath, outputPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-vf',
    'scale=512:512:force_original_aspect_ratio=increase,crop=512:512',
    '-vcodec',
    'libwebp',
    '-lossless',
    '0',
    '-compression_level',
    '6',
    '-q:v',
    '70',
    '-preset',
    'picture',
    outputPath,
  ]);
}

async function convertHuTaoImageToSticker(inputPath, outputPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-vf',
    [
      'scale=512:512:force_original_aspect_ratio=increase',
      'crop=512:512',
      `drawtext=fontfile=${paths.stickerFont}:text='${sticker.huTaoText}':fontcolor=white:fontsize=46:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-text_h-34`,
    ].join(','),
    '-vcodec',
    'libwebp',
    '-lossless',
    '0',
    '-compression_level',
    '6',
    '-q:v',
    '70',
    '-preset',
    'picture',
    outputPath,
  ]);
}

async function convertVideoToSticker(inputPath, outputPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-t',
    String(sticker.maxVideoSeconds),
    '-i',
    inputPath,
    '-vf',
    'fps=15,scale=512:512:force_original_aspect_ratio=increase,crop=512:512',
    '-vcodec',
    'libwebp',
    '-loop',
    '0',
    '-an',
    '-vsync',
    '0',
    '-q:v',
    '60',
    '-preset',
    'default',
    outputPath,
  ]);
}

module.exports = {
  convertHuTaoImageToSticker,
  convertImageToSticker,
  convertVideoToSticker,
};
