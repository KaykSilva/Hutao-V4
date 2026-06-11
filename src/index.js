require('dotenv').config();

const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');

const PREFIX = process.env.BOT_PREFIX || '!';
const BOT_NAME = process.env.BOT_NAME || 'Hutao V4';
const ENABLE_RICH_MENU = process.env.ENABLE_RICH_MENU === 'true';
const MENU_BANNER_PATH = path.join(__dirname, 'assets', 'images', 'banner.jpeg');
const MENU_BANNER = fs.existsSync(MENU_BANNER_PATH) ? fs.readFileSync(MENU_BANNER_PATH) : undefined;

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

startBot().catch((error) => {
  console.error('Erro ao iniciar o bot:', error);
  process.exit(1);
});
