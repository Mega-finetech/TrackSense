import { safeErrorCode } from '../utils/safeError.js';

export default function errorHandler(err, req, res, next) {
  console.error(`API request failed (${safeErrorCode(err)}).`);
  res.status(err.status || 500).json({
    success: false,
    error: err.status && err.status < 500 ? err.message : 'Something went wrong. Please try again.',
  });
}
