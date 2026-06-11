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

function getMediaType(content) {
  if (content?.imageMessage) return 'imageMessage';
  if (content?.videoMessage) return 'videoMessage';
  return null;
}

module.exports = {
  getMediaType,
  getMessageText,
  unwrapMessage,
};
