export const SUPPORT_EMAIL = 'Tracksensehelpnow@gmail.com';
export const SUPPORT_WHATSAPP = '2349057434214';
export const SUPPORT_WHATSAPP_DISPLAY = '+234 905 743 4214';
export const APP_VERSION = '1.0.0';

export const BUG_CATEGORIES = ['Course Tracking', 'Notifications', 'Auth / OTP', 'UI / Design', 'Other'] as const;
export type BugCategory = (typeof BUG_CATEGORIES)[number];

export type SupportDiagnostics = {
  userId?: string | null;
  platform: string;
  appVersion?: string;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

function resolvedVersion(appVersion?: string) {
  return (appVersion || APP_VERSION).replace(/^v/i, '');
}

export function diagnosticsBlock({ userId, platform, appVersion }: SupportDiagnostics) {
  return [
    `User ID: ${userId?.trim() || 'Unknown user'}`,
    `Device: ${platform}`,
    `App Version: v${resolvedVersion(appVersion)}`,
  ].join('\n');
}

export function whatsappMessage(diagnostics: SupportDiagnostics) {
  return `Hi TrackSense Admin! I need help with my account.\n\n${diagnosticsBlock(diagnostics)}`;
}

export function whatsappUrl(diagnostics: SupportDiagnostics) {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(whatsappMessage(diagnostics))}`;
}

export function supportEmailBody(diagnostics: SupportDiagnostics) {
  return [
    'Hi TrackSense Support,',
    '',
    'I need help with my account.',
    '',
    diagnosticsBlock(diagnostics),
    '',
    'Thank you.',
  ].join('\n');
}

export function supportEmailUrl(diagnostics: SupportDiagnostics, subject = 'TrackSense Support Request') {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(supportEmailBody(diagnostics))}`;
}

export function bugReportEmailUrl(
  diagnostics: SupportDiagnostics,
  { category, details }: { category: BugCategory; details: string },
) {
  const body = [
    'TrackSense Bug Report',
    '',
    `Category: ${category}`,
    '',
    'What happened:',
    details.trim() || '(not provided)',
    '',
    'Diagnostics:',
    diagnosticsBlock(diagnostics),
    '',
    'Sent from the TrackSense app.',
  ].join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`TrackSense Bug Report: ${category}`)}&body=${encodeURIComponent(body)}`;
}

export function feedbackEmailUrl(
  diagnostics: SupportDiagnostics,
  { message }: { message: string },
) {
  const body = [
    'TrackSense Feature Request / Feedback',
    '',
    message.trim() || '(not provided)',
    '',
    'Diagnostics:',
    diagnosticsBlock(diagnostics),
    '',
    'Sent from the TrackSense app.',
  ].join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('TrackSense Feedback')}&body=${encodeURIComponent(body)}`;
}

export function faqMatches(entry: FaqEntry, query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return [entry.question, entry.answer, ...entry.keywords]
    .some(value => value.toLowerCase().includes(term));
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'course-progress',
    question: 'How is my course progress calculated?',
    answer:
      'Course progress combines completed assignments with checked-off topics. Both contribute to the combined percentage, while modules show where you are in the syllabus. Add topics and modules from a course to keep the overview accurate.',
    keywords: ['course', 'progress', 'assignment', 'topic', 'module', 'syllabus'],
  },
  {
    id: 'study-reminders',
    question: 'How do study and spiritual reminders work?',
    answer:
      'Turn on the reminder types you want under Profile → Notifications. Reminders are scheduled on this device and sync with your account. Keep notifications enabled for TrackSense so study, prayer, and journal prompts can reach you.',
    keywords: ['study', 'spiritual', 'prayer', 'journal', 'reminder', 'notifications', 'schedule'],
  },
  {
    id: 'push-troubleshooting',
    question: "I'm not receiving push notifications. What should I check?",
    answer:
      'First confirm that TrackSense notifications are allowed in your device settings. Then open Profile → Notifications and make sure the specific reminder is switched on. Battery saver and focus modes can delay delivery, and a device restart usually clears a stuck notification channel.',
    keywords: ['push', 'notification', 'troubleshoot', 'missing', 'battery', 'permission', 'alert'],
  },
  {
    id: 'verification-code',
    question: "I didn't receive my verification code. What can I do?",
    answer:
      'Check your spam or promotions folder first. Account verification codes expire after 1 minute, so use Resend Code after the 60-second countdown and enter the newest message. Password reset codes stay valid for 10 minutes.',
    keywords: ['auth', 'otp', 'verification', 'code', 'email', 'reset', 'expired'],
  },
  {
    id: 'account-security',
    question: 'How do I keep my account secure?',
    answer:
      'Use a unique password of at least 8 characters and never share your one-time codes. Resetting your password signs out every other device. If you think someone else has access, reset your password immediately and contact support.',
    keywords: ['account', 'security', 'password', 'reset', 'sign out', 'support'],
  },
];
