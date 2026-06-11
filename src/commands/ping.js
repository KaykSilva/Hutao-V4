const pingCommand = {
  name: 'ping',
  async execute({ sock, message }) {
    await sock.sendMessage(message.key.remoteJid, { text: 'pong!' }, { quoted: message });
  },
};

module.exports = {
  pingCommand,
};
