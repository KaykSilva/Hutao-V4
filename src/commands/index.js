const { bot } = require('../config/env');
const { echoCommand } = require('./echo');
const { infoCommand } = require('./info');
const { menuCommand } = require('./menu');
const { ownerCommand } = require('./owner');
const { pingCommand } = require('./ping');
const { stickerCommand } = require('./sticker');
const { wallpaperCommand } = require('./wallpaper');
const { getSenderNumber, hasOwnerConfigured, isOwnerMessage } = require('../utils/owner');

const commands = new Map();

registerCommand(pingCommand);
registerCommand(menuCommand);
registerCommand(infoCommand);
registerCommand(echoCommand);
registerCommand(stickerCommand);
registerCommand(ownerCommand);
registerCommand(wallpaperCommand);

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

    if (command.ownerOnly && !canRunOwnerCommand(context.message)) {
      await context.sock.sendMessage(
        from,
        { text: getOwnerOnlyMessage(context.message) },
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

function canRunOwnerCommand(message) {
  return hasOwnerConfigured() && isOwnerMessage(message);
}

function getOwnerOnlyMessage(message) {
  if (!hasOwnerConfigured()) {
    return 'Comando restrito ao dono, mas nenhum OWNER_NUMBER foi configurado.';
  }

  const senderNumber = getSenderNumber(message);

  return [
    'Esse comando e restrito ao dono do bot.',
    senderNumber ? `Numero detectado: ${senderNumber}` : 'Nao consegui detectar seu numero.',
  ].join('\n');
}

module.exports = {
  registerCommand,
  runCommand,
};
