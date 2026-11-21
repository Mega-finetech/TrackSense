// Never pass request/response objects, user data, or raw error messages to console.
export function safeAuthError(error: unknown) {
  const value = error as { code?: unknown; status?: unknown; response?: { status?: unknown } } | null;
  const allowed = ['ERR_NETWORK', 'ECONNABORTED', 'ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE', 'user_already_exists', 'email_exists', 'invalid_credentials', 'email_not_confirmed'];
  const status = value?.response?.status ?? value?.status;
  return { code: typeof value?.code === 'string' && allowed.includes(value.code) ? value.code : 'AUTH_FLOW_ERROR', status: typeof status === 'number' && status >= 100 && status <= 599 ? status : undefined };
}
export function authDiagnostic(stage: string, error?: unknown) {
  if (__DEV__) console.info(`[TrackSense auth] ${stage}`, error === undefined ? '' : safeAuthError(error));
}
