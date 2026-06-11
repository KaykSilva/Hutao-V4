const { bot } = require('../config/env');
const { runCommand } = require('../commands');
const { sendHuTaoCallSticker } = require('../services/stickerService');
const { getMessageText } = require('../utils/messages');

async function handleMessagesUpsert(sock, { messages, type }) {
  if (type !== 'notify') return;

  const message = messages[0];
  if (!message?.message || message.key.fromMe) return;

  const text = getMessageText(message);
  if (isCallingHuTao(text)) {
    await sendHuTaoCallSticker(sock, message.key.remoteJid);
  }

  if (!text.startsWith(bot.prefix)) return;

  const [commandName, ...args] = text.slice(bot.prefix.length).trim().split(/\s+/);

  await runCommand({
    sock,
    message,
    commandName,
    args,
  });
}

function isCallingHuTao(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '').includes('hutao');
}

module.exports = {
  handleMessagesUpsert,
};
