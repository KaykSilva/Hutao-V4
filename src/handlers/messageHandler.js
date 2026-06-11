const { bot } = require('../config/env');
const { runCommand } = require('../commands');
const { getMessageText } = require('../utils/messages');

async function handleMessagesUpsert(sock, { messages, type }) {
  if (type !== 'notify') return;

  const message = messages[0];
  if (!message?.message || message.key.fromMe) return;

  const text = getMessageText(message);
  if (!text.startsWith(bot.prefix)) return;

  const [commandName, ...args] = text.slice(bot.prefix.length).trim().split(/\s+/);

  await runCommand({
    sock,
    message,
    commandName,
    args,
  });
}

module.exports = {
  handleMessagesUpsert,
};
