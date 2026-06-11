const fs = require('fs');

const { bot, menu, paths } = require('../config/env');

const menuBanner = fs.existsSync(paths.menuBanner) ? fs.readFileSync(paths.menuBanner) : undefined;

function buildMenuText() {
  return [
    '> 𝙈𝙀𝙉𝙐',
    '',
    '------------------',
    '>📌 INFORMAÇÕES',
    '',
    `➤ ${bot.prefix}menu`,
    `➤ ${bot.prefix}ping`,
    `➤ ${bot.prefix}info`,
    `➤ ${bot.prefix}dono`,
    `➤ ${bot.prefix}wallpaper`,
    '',
    '---------------',
    `Prefixo: ${bot.prefix}`,
    `Dono: ${menu.ownerName}`,
    `Canal: ${menu.channelUrl}`,
    `Site: ${menu.siteUrl}`,
    '---------------',
  ].join('\n');
}

function buildTextMenu() {
  return [
    buildMenuText(),
    '',
    '> OUTROS',
    '',
    `➤ ${bot.prefix}echo <texto>`,
    `➤ ${bot.prefix}sticker`,
  ].join('\n');
}

function buildMenuContextInfo() {
  return {
    externalAdReply: {
      title: bot.name,
      body: `Menu principal - Prefixo ${bot.prefix}`,
      mediaType: 1,
      thumbnail: menuBanner,
      renderLargerThumbnail: true,
    },
  };
}

async function sendMenu(sock, from, quotedMessage) {
  const caption = buildTextMenu();

  if (bot.enableRichMenu) {
    try {
      await sock.sendMessage(
        from,
        {
          image: menuBanner || { url: paths.menuBanner },
          caption,
          contextInfo: buildMenuContextInfo(),
        },
        { quoted: quotedMessage }
      );
      return;
    } catch (error) {
      console.error('Falha ao enviar menu com preview rico:', error.message || error);
    }
  }

  try {
    await sock.sendMessage(
      from,
      {
        image: menuBanner || { url: paths.menuBanner },
        caption,
      },
      { quoted: quotedMessage }
    );
    return;
  } catch (error) {
    console.error('Falha ao enviar menu com imagem:', error.message || error);
  }

  await sock.sendMessage(from, { text: caption }, { quoted: quotedMessage });
}

module.exports = {
  sendMenu,
};
