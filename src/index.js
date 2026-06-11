require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const {
  default: makeWASocket,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');

const execFileAsync = promisify(execFile);
const PREFIX = process.env.BOT_PREFIX || '!';
const BOT_NAME = process.env.BOT_NAME || 'Hutao V4';
const ENABLE_RICH_MENU = process.env.ENABLE_RICH_MENU === 'true';
const MENU_BANNER_PATH = path.join(__dirname, 'assets', 'images', 'banner.jpeg');
const MENU_BANNER = fs.existsSync(MENU_BANNER_PATH) ? fs.readFileSync(MENU_BANNER_PATH) : undefined;
const HU_TAO_STICKER_PATH = path.join(__dirname, 'assets', 'images', 'Hu Tao.jpeg');
const HU_TAO_STICKER_TEXT = 'Feito chefe';
const STICKER_FONT_PATH = '/usr/share/fonts/liberation/LiberationSans-Regular.ttf';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: [BOT_NAME, 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('Escaneie o QR Code abaixo com o WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log(`${BOT_NAME} conectado com sucesso.`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log('Conexao encerrada.', {
        statusCode,
        shouldReconnect,
      });

      if (shouldReconnect) {
        startBot();
      } else {
        console.log('Sessao desconectada. Apague a pasta auth e conecte novamente.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    const message = messages[0];
    if (!message?.message || message.key.fromMe) return;

    const from = message.key.remoteJid;
    const text = getMessageText(message);
    if (!text.startsWith(PREFIX)) return;

    const [command, ...args] = text.slice(PREFIX.length).trim().split(/\s+/);

    try {
      switch ((command || '').toLowerCase()) {
        case 'ping':
          await sock.sendMessage(from, { text: 'pong!' }, { quoted: message });
          break;

        case 'menu':
          await sendMenu(sock, from, message);
          break;

        case 'sticker':
        case 's':
        case 'figurinha':
        case 'f':
          await sendSticker(sock, from, message);
          break;

        case 'echo':
          await sock.sendMessage(
            from,
            { text: args.join(' ') || 'Envie um texto para eu repetir.' },
            { quoted: message }
          );
          break;

        default:
          await sock.sendMessage(
            from,
            { text: `Comando nao encontrado. Use ${PREFIX}menu.` },
            { quoted: message }
          );
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      await sock.sendMessage(from, { text: 'Ocorreu um erro ao executar esse comando.' });
    }
  });
}

function getMessageText(message) {
  const content = unwrapMessage(message.message);

  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    ''
  ).trim();
}

function unwrapMessage(content) {
  return (
    content?.ephemeralMessage?.message ||
    content?.viewOnceMessage?.message ||
    content?.viewOnceMessageV2?.message ||
    content?.documentWithCaptionMessage?.message ||
    content ||
    {}
  );
}

async function sendMenu(sock, from, quotedMessage) {
  const caption = buildMenuText();

  if (ENABLE_RICH_MENU) {
    try {
      await sock.sendMessage(
        from,
        {
          image: MENU_BANNER || { url: MENU_BANNER_PATH },
          caption,
          contextInfo: buildMenuContextInfo(),
        },
        { quoted: quotedMessage }
      );
      return;
    } catch (error) {
      console.error('Falha ao enviar menu com preview rico:', getErrorMessage(error));
    }
  }

  try {
    await sock.sendMessage(
      from,
      {
        image: MENU_BANNER || { url: MENU_BANNER_PATH },
        caption,
      },
      { quoted: quotedMessage }
    );
    return;
  } catch (error) {
    console.error('Falha ao enviar menu com imagem:', getErrorMessage(error));
  }

  await sock.sendMessage(from, { text: caption }, { quoted: quotedMessage });
}

function buildMenuText() {
  return [
    `*${BOT_NAME.toUpperCase()}*`,
    '_Central de comandos_',
    '',
    '*Status*',
    'Online',
    `Prefixo: *${PREFIX}*`,
    '',
    '*Comandos*',
    `*${PREFIX}ping*`,
    'Testa a conexao do bot.',
    '',
    `*${PREFIX}echo <texto>*`,
    'Repete a mensagem enviada.',
    '',
    `*${PREFIX}sticker* ou *${PREFIX}s*`,
    'Cria figurinha de imagem ou video.',
    '',
    `_Digite ${PREFIX} antes do comando para usar._`,
  ].join('\n');
}

function buildMenuContextInfo() {
  return {
    externalAdReply: {
      title: BOT_NAME,
      body: `Menu principal • Prefixo ${PREFIX}`,
      mediaType: 1,
      thumbnail: MENU_BANNER,
      renderLargerThumbnail: true,
    },
  };
}

function getErrorMessage(error) {
  return error?.message || error?.output?.payload || error;
}

async function sendSticker(sock, from, message) {
  const mediaMessage = getStickerSourceMessage(message, from);

  if (!mediaMessage) {
    await sock.sendMessage(
      from,
      {
        text: [
          'Envie uma imagem/video com o comando na legenda.',
          '',
          `Ou responda uma imagem/video com *${PREFIX}s*.`,
        ].join('\n'),
      },
      { quoted: message }
    );
    return;
  }

  const mediaType = getMediaType(mediaMessage.message);
  if (!mediaType) {
    await sock.sendMessage(from, { text: 'Use esse comando em uma imagem ou video.' }, { quoted: message });
    return;
  }

  if (mediaType === 'videoMessage') {
    const seconds = mediaMessage.message.videoMessage?.seconds || 0;
    if (seconds > 10) {
      await sock.sendMessage(
        from,
        { text: 'Para figurinha animada, envie um video de ate 10 segundos.' },
        { quoted: message }
      );
      return;
    }
  }

  await sock.sendMessage(from, { text: 'Criando figurinha...' }, { quoted: message });

  const inputExt = mediaType === 'imageMessage' ? 'jpg' : 'mp4';
  const inputPath = path.join(os.tmpdir(), `hutao-sticker-${Date.now()}-${Math.random()}.${inputExt}`);
  const outputPath = path.join(os.tmpdir(), `hutao-sticker-${Date.now()}-${Math.random()}.webp`);

  try {
    const buffer = await downloadMediaMessage(mediaMessage, 'buffer', {});
    await fs.promises.writeFile(inputPath, buffer);

    if (mediaType === 'imageMessage') {
      await convertImageToSticker(inputPath, outputPath);
    } else {
      await convertVideoToSticker(inputPath, outputPath);
    }

    const sticker = await fs.promises.readFile(outputPath);
    await sock.sendMessage(from, { sticker }, { quoted: message });
    await sendHuTaoSticker(sock, from);
  } catch (error) {
    console.error('Falha ao criar figurinha:', getErrorMessage(error));
    await sock.sendMessage(from, { text: 'Nao consegui criar essa figurinha.' }, { quoted: message });
  } finally {
    await removeTempFile(inputPath);
    await removeTempFile(outputPath);
  }
}

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

function getMediaType(content) {
  if (content?.imageMessage) return 'imageMessage';
  if (content?.videoMessage) return 'videoMessage';
  return null;
}

async function convertImageToSticker(inputPath, outputPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-vf',
    'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
    '-vcodec',
    'libwebp',
    '-lossless',
    '0',
    '-compression_level',
    '6',
    '-q:v',
    '70',
    '-preset',
    'picture',
    outputPath,
  ]);
}

async function sendHuTaoSticker(sock, from) {
  if (!fs.existsSync(HU_TAO_STICKER_PATH)) return;

  const outputPath = path.join(os.tmpdir(), `hutao-extra-sticker-${Date.now()}-${Math.random()}.webp`);

  try {
    await convertHuTaoImageToSticker(HU_TAO_STICKER_PATH, outputPath);
    const sticker = await fs.promises.readFile(outputPath);
    await sock.sendMessage(from, { sticker });
  } catch (error) {
    console.error('Falha ao enviar figurinha extra da Hu Tao:', getErrorMessage(error));
  } finally {
    await removeTempFile(outputPath);
  }
}

async function convertHuTaoImageToSticker(inputPath, outputPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-vf',
    [
      'scale=512:512:force_original_aspect_ratio=decrease',
      'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
      `drawtext=fontfile=${STICKER_FONT_PATH}:text='${HU_TAO_STICKER_TEXT}':fontcolor=white:fontsize=46:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-text_h-34`,
    ].join(','),
    '-vcodec',
    'libwebp',
    '-lossless',
    '0',
    '-compression_level',
    '6',
    '-q:v',
    '70',
    '-preset',
    'picture',
    outputPath,
  ]);
}

async function convertVideoToSticker(inputPath, outputPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-t',
    '10',
    '-i',
    inputPath,
    '-vf',
    'fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
    '-vcodec',
    'libwebp',
    '-loop',
    '0',
    '-an',
    '-vsync',
    '0',
    '-q:v',
    '60',
    '-preset',
    'default',
    outputPath,
  ]);
}

async function removeTempFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Falha ao remover arquivo temporario:', filePath, getErrorMessage(error));
    }
  }
}

startBot().catch((error) => {
  console.error('Erro ao iniciar o bot:', error);
  process.exit(1);
});
