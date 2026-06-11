function getErrorMessage(error) {
  if (!error) return undefined;
  if (error.output?.payload?.message) return error.output.payload.message;
  if (error.message) return error.message;
  return error;
}

module.exports = {
  getErrorMessage,
};
