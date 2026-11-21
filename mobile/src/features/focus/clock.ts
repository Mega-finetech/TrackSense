export type TimerSession = {
  id: string;
  durationSeconds: number;
  remainingSeconds: number;
  endAt: number | null;
};
export function remainingSeconds(session: TimerSession, now: number): number {
  return session.endAt === null ? session.remainingSeconds : Math.max(0, Math.min(session.durationSeconds, Math.ceil((session.endAt - now) / 1000)));
}
export function pauseSession(session: TimerSession, now: number): TimerSession {
  const remaining = remainingSeconds(session, now);
  // Preserve the completion timestamp if the timer elapsed in the background.
  return remaining === 0 ? session : { ...session, remainingSeconds: remaining, endAt: null };
}
export function resumeSession(session: TimerSession, now: number): TimerSession {
  return session.endAt !== null ? session : { ...session, endAt: now + session.remainingSeconds * 1000 };
}
