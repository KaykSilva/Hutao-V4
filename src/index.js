require('dotenv').config();

const { startBot } = require('./bot/startBot');
const { scheduleReconnect } = require('./bot/reconnect');
const { getErrorMessage } = require('./utils/errors');

startBot().catch((error) => {
  console.error('Erro ao iniciar o bot:', getErrorMessage(error));
  scheduleReconnect();
});
