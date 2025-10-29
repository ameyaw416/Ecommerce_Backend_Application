// generate password reset token hash
import crypto from 'crypto';

export const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// generate a secure random token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};