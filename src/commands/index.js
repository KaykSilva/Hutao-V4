const { bot } = require('../config/env');
const { echoCommand } = require('./echo');
const { menuCommand } = require('./menu');
const { pingCommand } = require('./ping');
const { stickerCommand } = require('./sticker');

const commands = new Map();

registerCommand(pingCommand);
registerCommand(menuCommand);
registerCommand(echoCommand);
registerCommand(stickerCommand);

function registerCommand(command) {
  commands.set(command.name, command);

  for (const alias of command.aliases || []) {
    commands.set(alias, command);
  }
}

async function runCommand(context) {
  const from = context.message.key.remoteJid;
  const command = commands.get((context.commandName || '').toLowerCase());

  try {
    if (!command) {
      await context.sock.sendMessage(
        from,
        { text: `Comando nao encontrado. Use ${bot.prefix}menu.` },
        { quoted: context.message }
      );
      return;
    }

    await command.execute(context);
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    await context.sock.sendMessage(from, { text: 'Ocorreu um erro ao executar esse comando.' });
  }
}

module.exports = {
  registerCommand,
  runCommand,
};
