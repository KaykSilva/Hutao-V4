const qrcode = require('qrcode-terminal');
const pino = require('pino');
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');

const { bot, paths } = require('../config/env');
const { handleMessagesUpsert } = require('../handlers/messageHandler');
const { getErrorMessage } = require('../utils/errors');
const { scheduleReconnect } = require('./reconnect');
const state = require('./state');

async function startBot() {
  if (state.isStarting) return;

  state.isStarting = true;

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(paths.authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: [bot.name, 'Chrome', '1.0.0'],
    });

    state.currentSocket = sock;

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', handleConnectionUpdate);
    sock.ev.on('messages.upsert', (payload) => handleMessagesUpsert(sock, payload));
  } finally {
    state.isStarting = false;
  }
}

function handleConnectionUpdate({ connection, lastDisconnect, qr }) {
  if (qr) {
    console.log('Escaneie o QR Code abaixo com o WhatsApp:');
    qrcode.generate(qr, { small: true });
  }

  if (connection === 'open') {
    state.reconnectAttempts = 0;
    console.log(`${bot.name} conectado com sucesso.`);
  }

  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

    state.currentSocket = null;
    console.log('Conexao encerrada:', {
      statusCode,
      reason: getErrorMessage(lastDisconnect?.error),
      shouldReconnect,
    });

    if (shouldReconnect) {
      scheduleReconnect();
    } else {
      console.log('Sessao desconectada. Apague a pasta auth e conecte novamente.');
    }
  }
}

module.exports = {
  startBot,
};
