const { getSenderNumber } = require('../utils/owner');

const ownerCommand = {
  name: 'dono',
  aliases: ['owner'],
  ownerOnly: true,
  async execute({ sock, message }) {
    const senderNumber = getSenderNumber(message);

    await sock.sendMessage(
      message.key.remoteJid,
      { text: `Reconhecido como dono: ${senderNumber}.` },
      { quoted: message }
    );
  },
};

module.exports = {
  ownerCommand,
};
