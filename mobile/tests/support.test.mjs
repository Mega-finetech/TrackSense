import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_VERSION, BUG_CATEGORIES, FAQ_ENTRIES, SUPPORT_EMAIL, SUPPORT_WHATSAPP,
  SUPPORT_WHATSAPP_DISPLAY, bugReportEmailUrl, diagnosticsBlock, faqMatches,
  feedbackEmailUrl, supportEmailBody, supportEmailUrl, whatsappMessage, whatsappUrl,
} from '../src/features/support/support.ts';

const diagnostics = { userId: 'user-123', platform: 'android', appVersion: APP_VERSION };

test('support contact details match the published channels', () => {
  assert.equal(SUPPORT_EMAIL, 'Tracksensehelpnow@gmail.com');
  assert.equal(SUPPORT_WHATSAPP, '2349057434214');
  assert.equal(SUPPORT_WHATSAPP_DISPLAY, '+234 905 743 4214');
  assert.equal(APP_VERSION, '1.0.0');
  assert.deepEqual(BUG_CATEGORIES, ['Course Tracking', 'Notifications', 'Auth / OTP', 'UI / Design', 'Other']);
});

test('WhatsApp help URL carries encoded account diagnostics', () => {
  assert.equal(diagnosticsBlock(diagnostics), 'User ID: user-123\nDevice: android\nApp Version: v1.0.0');
  const message = whatsappMessage(diagnostics);
  assert.equal(
    message,
    'Hi TrackSense Admin! I need help with my account.\n\nUser ID: user-123\nDevice: android\nApp Version: v1.0.0',
  );
  const url = whatsappUrl(diagnostics);
  assert.ok(url.startsWith('https://wa.me/2349057434214?text='));
  assert.equal(decodeURIComponent(url.split('?text=')[1]), message);
  // Missing user data still produces a usable support link.
  assert.match(whatsappMessage({ userId: null, platform: 'ios' }), /User ID: Unknown user/);
});

test('support email URL uses mailto with encoded subject and body', () => {
  const url = supportEmailUrl(diagnostics);
  assert.ok(url.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`));
  const query = url.slice(url.indexOf('?') + 1);
  const params = new URLSearchParams(query);
  assert.equal(params.get('subject'), 'TrackSense Support Request');
  assert.equal(params.get('body'), supportEmailBody(diagnostics));
  assert.match(params.get('body'), /User ID: user-123/);
  assert.match(params.get('body'), /Device: android/);
  const contactSubject = new URLSearchParams(supportEmailUrl(diagnostics, 'TrackSense Support').split('?')[1]).get('subject');
  assert.equal(contactSubject, 'TrackSense Support');
});

test('bug reports forward category, details, and diagnostics', () => {
  const url = bugReportEmailUrl(diagnostics, {
    category: 'Auth / OTP',
    details: 'The code expired before I could type it & retry.',
  });
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'TrackSense Bug Report: Auth / OTP');
  const body = params.get('body');
  assert.match(body, /Category: Auth \/ OTP/);
  assert.match(body, /The code expired before I could type it & retry\./);
  assert.match(body, /User ID: user-123/);
  assert.match(body, /App Version: v1.0.0/);
  assert.equal(new URLSearchParams(feedbackEmailUrl(diagnostics, { message: 'Add a dark calendar view' }).split('?')[1]).get('subject'), 'TrackSense Feedback');
});

test('FAQ answers cover progress, reminders, and notification troubleshooting', () => {
  const progress = FAQ_ENTRIES.find(entry => entry.id === 'course-progress');
  assert.ok(progress);
  assert.equal(faqMatches(progress, 'syllabus'), true);
  assert.equal(faqMatches(progress, 'COURSE'), true);
  assert.equal(faqMatches(progress, 'billing'), false);
  assert.ok(FAQ_ENTRIES.some(entry => /study|spiritual/i.test(entry.question) && /reminder/i.test(entry.answer)));
  const push = FAQ_ENTRIES.find(entry => entry.id === 'push-troubleshooting');
  assert.ok(push);
  assert.equal(faqMatches(push, 'permission'), true);
  assert.equal(faqMatches(push, ''), true);
});
