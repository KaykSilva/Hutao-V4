const { sendMenu } = require('../services/menuService');

const menuCommand = {
  name: 'menu',
  async execute({ sock, message }) {
    await sendMenu(sock, message.key.remoteJid, message);
  },
};

module.exports = {
  menuCommand,
};
