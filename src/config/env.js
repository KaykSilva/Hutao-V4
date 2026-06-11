const path = require('path');

const assetsPath = path.join(__dirname, '..', 'assets');

module.exports = {
  bot: {
    name: process.env.BOT_NAME || 'Hutao V4',
    prefix: process.env.BOT_PREFIX || '!',
    enableRichMenu: process.env.ENABLE_RICH_MENU === 'true',
  },
  paths: {
    authDir: process.env.AUTH_DIR || 'auth',
    menuBanner: path.join(assetsPath, 'images', 'banner.jpeg'),
    huTaoStickerImage: path.join(assetsPath, 'images', 'Hu Tao.jpeg'),
    stickerFont: process.env.STICKER_FONT_PATH || '/usr/share/fonts/liberation/LiberationSans-Regular.ttf',
  },
  sticker: {
    huTaoText: process.env.HU_TAO_STICKER_TEXT || 'Feito chefe',
    maxVideoSeconds: Number(process.env.STICKER_MAX_VIDEO_SECONDS || 10),
  },
  reconnect: {
    baseDelayMs: Number(process.env.RECONNECT_BASE_DELAY_MS || 5_000),
    maxDelayMs: Number(process.env.RECONNECT_MAX_DELAY_MS || 60_000),
  },
};
