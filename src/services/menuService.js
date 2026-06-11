const fs = require('fs');

const { bot, paths } = require('../config/env');

const menuBanner = fs.existsSync(paths.menuBanner) ? fs.readFileSync(paths.menuBanner) : undefined;

function buildMenuText() {
  return [
    `*${bot.name.toUpperCase()}*`,
    '_Central de comandos_',
    '',
    '*Status*',
    'Online',
    `Prefixo: *${bot.prefix}*`,
    '',
    '*Comandos*',
    `*${bot.prefix}ping*`,
    'Testa a conexao do bot.',
    '',
    `*${bot.prefix}echo <texto>*`,
    'Repete a mensagem enviada.',
    '',
    `*${bot.prefix}sticker* ou *${bot.prefix}s*`,
    'Cria figurinha de imagem ou video.',
    '',
    `_Digite ${bot.prefix} antes do comando para usar._`,
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
  const caption = buildMenuText();

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
