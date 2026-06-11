const wallpaperCommand = {
  name: 'wallpaper',
  async execute({ sock, message }) {
    await sock.sendMessage(
      message.key.remoteJid,
      { text: 'Comando de wallpaper ainda nao configurado.' },
      { quoted: message }
    );
  },
};

module.exports = {
  wallpaperCommand,
};
