const { execFile } = require('child_process');
const { promisify } = require('util');

const { paths, sticker } = require('../config/env');

const execFileAsync = promisify(execFile);

async function convertImageToSticker(inputPath, outputPath, text) {
  const filters = [
    'scale=512:512:force_original_aspect_ratio=increase',
    'crop=512:512',
    buildStickerTextFilter(text),
  ].filter(Boolean);

  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-vf',
    filters.join(','),
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

async function convertVideoToSticker(inputPath, outputPath, text) {
  const filters = [
    'fps=15',
    'scale=512:512:force_original_aspect_ratio=increase',
    'crop=512:512',
    buildStickerTextFilter(text),
  ].filter(Boolean);

  await execFileAsync('ffmpeg', [
    '-y',
    '-t',
    String(sticker.maxVideoSeconds),
    '-i',
    inputPath,
    '-vf',
    filters.join(','),
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

async function editStickerText(inputPath, outputPath, text) {
  const filters = [
    'scale=512:512:force_original_aspect_ratio=decrease',
    'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
    buildStickerTextFilter(text),
  ].filter(Boolean);

  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-vf',
    filters.join(','),
    '-vcodec',
    'libwebp',
    '-lossless',
    '0',
    '-compression_level',
    '6',
    '-q:v',
    '70',
    '-preset',
    'default',
    outputPath,
  ]);
}

function buildStickerTextFilter(text) {
  if (!text) return null;

  return [
    `drawtext=fontfile=${escapeDrawTextValue(paths.stickerFont)}`,
    `text='${escapeDrawTextValue(text)}'`,
    'fontcolor=white',
    'fontsize=44',
    'borderw=4',
    'bordercolor=black',
    'box=1',
    'boxcolor=black@0.25',
    'boxborderw=12',
    'x=(w-text_w)/2',
    'y=h-text_h-34',
  ].join(':');
}

function escapeDrawTextValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
}

module.exports = {
  convertHuTaoImageToSticker,
  convertImageToSticker,
  convertVideoToSticker,
  editStickerText,
};
