export function readEnvironment(source) {
  if (!source.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!source.JWT_SECRET || source.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const port = Number(source.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  const authProvider = source.AUTH_PROVIDER || 'legacy';
  if (!['legacy', 'supabase'].includes(authProvider)) throw new Error('Invalid AUTH_PROVIDER');
  const supabaseKey = source.SUPABASE_PUBLISHABLE_KEY || source.SUPABASE_ANON_KEY;
  let supabaseUrl = '';
  if (source.SUPABASE_URL) {
    let parsed;
    try { parsed = new URL(source.SUPABASE_URL); } catch { throw new Error('Invalid SUPABASE_URL'); }
    if ((parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost','127.0.0.1'].includes(parsed.hostname))) || parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) throw new Error('Invalid SUPABASE_URL');
    supabaseUrl = parsed.origin;
  }
  if (authProvider === 'supabase' && (!supabaseUrl || !supabaseKey)) throw new Error('Supabase URL and public key are required for AUTH_PROVIDER=supabase');
  const supportEmail = source.SUPPORT_EMAIL || 'Tracksensehelpnow@gmail.com';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) throw new Error('Invalid SUPPORT_EMAIL');
  const supportWhatsapp = source.SUPPORT_WHATSAPP || '2349057434214';
  if (!/^\d{10,15}$/.test(supportWhatsapp)) throw new Error('Invalid SUPPORT_WHATSAPP');
  const smtpHost = source.SMTP_HOST || '';
  const smtpPort = Number(source.SMTP_PORT || 587);
  if (smtpHost && (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)) throw new Error('Invalid SMTP_PORT');
  if (smtpHost && (!source.SMTP_USER || !source.SMTP_PASS) && !['localhost', '127.0.0.1'].includes(smtpHost)) {
    throw new Error('SMTP_USER and SMTP_PASS are required for SMTP_HOST');
  }
  const smtpSecure = source.SMTP_SECURE === 'true' || smtpPort === 465;
  const mailFrom = source.MAIL_FROM || `TrackSense <${supportEmail}>`;
  return {
    databaseUrl: source.DATABASE_URL, jwtSecret: source.JWT_SECRET,
    jwtExpiresIn: source.JWT_EXPIRES_IN || '7d', port,
    production: source.NODE_ENV === 'production', authProvider, supabaseUrl, supabaseKey,
    supportEmail, supportWhatsapp, smtpHost, smtpPort, smtpSecure,
    smtpUser: source.SMTP_USER || '', smtpPass: source.SMTP_PASS || '', mailFrom,
  };
}
