require('dotenv').config();

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
          await sock.sendMessage(
            from,
            {
              text: [
                `*${BOT_NAME}*`,
                '',
                `${PREFIX}ping - testa se o bot esta online`,
                `${PREFIX}echo <texto> - repete uma mensagem`,
              ].join('\n'),
            },
            { quoted: message }
          );
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
  const content = message.message;

  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    ''
  ).trim();
}

startBot().catch((error) => {
  console.error('Erro ao iniciar o bot:', error);
  process.exit(1);
});
