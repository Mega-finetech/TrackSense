// Never serialize driver messages, SQL, parameters, connection URLs or request bodies.
export function safeErrorCode(error) {
  return typeof error?.code === 'string' && /^[A-Z0-9_]{2,40}$/.test(error.code) ? error.code : 'INTERNAL_ERROR';
}
