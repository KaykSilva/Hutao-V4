const { bot, menu } = require('../config/env');

const infoCommand = {
  name: 'info',
  async execute({ sock, message }) {
    await sock.sendMessage(
      message.key.remoteJid,
      {
        text: [
          `Nome: ${bot.name}`,
          `Prefixo: ${bot.prefix}`,
          `Dono: ${menu.ownerName}`,
          `Canal: ${menu.channelUrl}`,
          `Site: ${menu.siteUrl}`,
        ].join('\n'),
      },
      { quoted: message }
    );
  },
};

module.exports = {
  infoCommand,
};
