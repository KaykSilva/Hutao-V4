const echoCommand = {
  name: 'echo',
  async execute({ sock, message, args }) {
    await sock.sendMessage(
      message.key.remoteJid,
      { text: args.join(' ') || 'Envie um texto para eu repetir.' },
      { quoted: message }
    );
  },
};

module.exports = {
  echoCommand,
};
