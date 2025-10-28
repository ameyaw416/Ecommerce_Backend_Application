// backend/utils/httpErrors.js
export const createError = (message, { code = null, status = null } = {}) => {
  const err = new Error(message);
  if (code) err.code = code;
  if (status) err.status = status;
  return err;
};
