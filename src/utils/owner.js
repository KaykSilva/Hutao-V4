const { owner } = require('../config/env');

function isOwnerMessage(message) {
  const senderNumber = getSenderNumber(message);
  if (!senderNumber) return false;

  const allowedNumbers = owner.numbers.flatMap(getNumberVariants);

  return allowedNumbers.includes(senderNumber);
}

function hasOwnerConfigured() {
  return owner.numbers.length > 0;
}

function getSenderNumber(message) {
  const jid = message.key.participant || message.key.remoteJid || '';
  return getNumberFromJid(jid);
}

function getNumberFromJid(jid) {
  const user = jid.split('@')[0].split(':')[0];
  return user.replace(/\D/g, '');
}

function getNumberVariants(number) {
  const variants = new Set([number]);

  if (number.startsWith('55') && number.length === 13 && number[4] === '9') {
    variants.add(`${number.slice(0, 4)}${number.slice(5)}`);
  }

  if (number.startsWith('55') && number.length === 12) {
    variants.add(`${number.slice(0, 4)}9${number.slice(4)}`);
  }

  return [...variants];
}

module.exports = {
  getSenderNumber,
  hasOwnerConfigured,
  isOwnerMessage,
};
