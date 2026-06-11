const { bot, sticker } = require('../config/env');
const { createSticker, isVideoTooLong, sendHuTaoSticker } = require('../services/stickerService');
const { getMediaType, unwrapMessage } = require('../utils/messages');
const { getErrorMessage } = require('../utils/errors');

const stickerCommand = {
  name: 'sticker',
  aliases: ['s', 'figurinha', 'f'],
  async execute({ sock, message, args }) {
    const from = message.key.remoteJid;
    const text = args.join(' ').trim();
    const mediaMessage = getStickerSourceMessage(message, from);

    if (!mediaMessage) {
      await sock.sendMessage(
        from,
        {
          text: [
            'Envie uma imagem/video com o comando na legenda.',
            '',
            `Ou responda uma imagem/video/sticker com *${bot.prefix}s texto*.`,
          ].join('\n'),
        },
        { quoted: message }
      );
      return;
    }

    const mediaType = getMediaType(mediaMessage.message);
    if (!mediaType) {
      await sock.sendMessage(from, { text: 'Use esse comando em uma imagem, video ou sticker.' }, { quoted: message });
      return;
    }

    if (mediaType === 'stickerMessage' && !text) {
      await sock.sendMessage(
        from,
        { text: `Responda a figurinha com *${bot.prefix}s seu texto* para editar.` },
        { quoted: message }
      );
      return;
    }

    if (mediaType === 'videoMessage' && isVideoTooLong(mediaMessage)) {
      await sock.sendMessage(
        from,
        { text: `Para figurinha animada, envie um video de ate ${sticker.maxVideoSeconds} segundos.` },
        { quoted: message }
      );
      return;
    }

    await sock.sendMessage(from, { text: 'Criando figurinha...' }, { quoted: message });

    try {
      const stickerBuffer = await createSticker(mediaMessage, mediaType, text);
      await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: message });
      if (!text) {
        await sendHuTaoSticker(sock, from);
      }
    } catch (error) {
      console.error('Falha ao criar figurinha:', getErrorMessage(error));
      await sock.sendMessage(from, { text: 'Nao consegui criar essa figurinha.' }, { quoted: message });
    }
  },
};

function getStickerSourceMessage(message, remoteJid) {
  if (getMediaType(unwrapMessage(message.message))) {
    return {
      key: message.key,
      message: unwrapMessage(message.message),
    };
  }

  const content = unwrapMessage(message.message);
  const quotedMessage = content.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quotedMessage || !getMediaType(unwrapMessage(quotedMessage))) return null;

  const contextInfo = content.extendedTextMessage.contextInfo;

  return {
    key: {
      remoteJid,
      id: contextInfo.stanzaId,
      participant: contextInfo.participant,
    },
    message: unwrapMessage(quotedMessage),
  };
}

module.exports = {
  stickerCommand,
};
