const { reconnect } = require('../config/env');
const { getErrorMessage } = require('../utils/errors');
const state = require('./state');

function scheduleReconnect() {
  if (state.reconnectTimeout) return;

  state.reconnectAttempts += 1;
  const delay = Math.min(reconnect.baseDelayMs * state.reconnectAttempts, reconnect.maxDelayMs);

  console.log(`Tentando reconectar em ${Math.round(delay / 1000)}s...`);

  state.reconnectTimeout = setTimeout(() => {
    state.reconnectTimeout = null;

    if (state.currentSocket || state.isStarting) return;

    const { startBot } = require('./startBot');

    startBot().catch((error) => {
      state.isStarting = false;
      console.error('Erro ao reconectar:', getErrorMessage(error));
      scheduleReconnect();
    });
  }, delay);
}

module.exports = {
  scheduleReconnect,
};
