import dayjs, { type Dayjs } from 'dayjs';
import type {
  Assignment,
  AssignmentRecord,
  Course,
  CourseModule,
  CourseTopic,
  Exam,
} from '../../types';

export type ExamUrgency = {
  color: string;
  background: string;
  border: string;
  label: string;
};

export type CoursePace = {
  key: 'behind' | 'focus' | 'onTrack';
  label: 'Behind Schedule' | 'Needs Focus' | 'On Track';
  color: string;
  background: string;
  border: string;
};

const paceStyles: Record<CoursePace['key'], Omit<CoursePace, 'key'>> = {
  behind: { label: 'Behind Schedule', color: '#FF4D4D', background: '#FF4D4D1F', border: '#FF4D4D' },
  focus: { label: 'Needs Focus', color: '#FFA500', background: '#FFA5001F', border: '#FFA500' },
  onTrack: { label: 'On Track', color: '#3BCCA3', background: '#3BCCA31F', border: '#3BCCA3' },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function numberOrUndefined(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

/** Maps a legacy assignment response into the camelCase Study view model. */
export function toAssignment(record: AssignmentRecord): Assignment {
  const status = record.status ?? 'pending';
  return {
    id: record.id,
    user_id: record.user_id,
    course_id: record.course_id,
    title: record.title,
    dueDate: record.due_date,
    isCompleted: status === 'submitted' || status === 'graded',
    earnedScore: numberOrUndefined(record.earned_score),
    totalScore: numberOrUndefined(record.total_score),
    status,
    created_at: record.created_at,
  };
}

/** Normalises a course response so checklist arrays always exist. */
export function toCourse(record: Course): Course {
  return {
    ...record,
    topics: Array.isArray(record.topics) ? record.topics : [],
    modules: Array.isArray(record.modules) ? record.modules : [],
  };
}

export function courseTopics(course: Course | null | undefined): CourseTopic[] {
  return course?.topics ?? [];
}

export function courseModules(course: Course | null | undefined): CourseModule[] {
  return course?.modules ?? [];
}

export function isAssignmentComplete(assignment: Assignment): boolean {
  if (typeof assignment.isCompleted === 'boolean') return assignment.isCompleted;
  return assignment.status === 'submitted' || assignment.status === 'graded';
}

export function hasGrade(assignment: Assignment): boolean {
  return (
    typeof assignment.earnedScore === 'number' &&
    typeof assignment.totalScore === 'number' &&
    assignment.totalScore > 0
  );
}

/** Stable ascending due-date order; undated work stays at the bottom. */
export function sortAssignments(items: Assignment[]): Assignment[] {
  return [...items].sort((a, b) => {
    const left = a.dueDate ? dayjs(a.dueDate).valueOf() : Number.POSITIVE_INFINITY;
    const right = b.dueDate ? dayjs(b.dueDate).valueOf() : Number.POSITIVE_INFINITY;
    return left - right;
  });
}

export function assignmentsForCourse(items: Assignment[], courseId: string): Assignment[] {
  return sortAssignments(items.filter(item => item.course_id === courseId));
}

/**
 * Combined progress = completed assignments + completed topics over all
 * tracked work. Nothing is stored on the course row, so every checkoff updates
 * the ring immediately.
 */
export function calculateCourseProgress(course: Course | null | undefined, items: Assignment[]): number {
  const topics = courseTopics(course);
  const total = items.length + topics.length;
  if (!total) return course?.status === 'completed' ? 100 : 0;
  const completed = items.filter(isAssignmentComplete).length + topics.filter(topic => topic.completed).length;
  return Math.round((completed / total) * 100);
}

/** Cumulative grade across graded assignments, or null when nothing is graded. */
export function calculateCourseGrade(items: Assignment[]): number | null {
  let earned = 0;
  let possible = 0;
  for (const item of items) {
    if (!hasGrade(item)) continue;
    earned += item.earnedScore as number;
    possible += item.totalScore as number;
  }
  if (!possible) return null;
  return Math.round((earned / possible) * 100);
}

/** Pace is derived only from pending assignments with a usable due date. */
export function coursePaceStatus(items: Assignment[], now: Dayjs = dayjs()): CoursePace {
  const pending = items.filter(item => !isAssignmentComplete(item) && !!item.dueDate);
  if (pending.some(item => dayjs(item.dueDate).isBefore(now))) {
    return { key: 'behind', ...paceStyles.behind };
  }
  if (pending.some(item => dayjs(item.dueDate).diff(now, 'millisecond') <= DAY_MS)) {
    return { key: 'focus', ...paceStyles.focus };
  }
  return { key: 'onTrack', ...paceStyles.onTrack };
}

export type ModulePosition = { current: number; total: number };

/** Roadmap position: the first incomplete module, or the final module. */
export function modulePosition(course: Course | null | undefined): ModulePosition | null {
  const modules = courseModules(course);
  if (!modules.length) return null;
  const firstIncomplete = modules.findIndex(module => !module.isCompleted);
  return { current: firstIncomplete === -1 ? modules.length : firstIncomplete + 1, total: modules.length };
}

export function topicCompletion(course: Course | null | undefined): { completed: number; total: number } {
  const topics = courseTopics(course);
  return { completed: topics.filter(topic => topic.completed).length, total: topics.length };
}

export function examDaysLeft(examDate: string): number {
  return dayjs(examDate).diff(dayjs(), 'day');
}

export function nextExamForCourse(items: Exam[], courseId: string): Exam | undefined {
  return [...items]
    .filter(item => item.course_id === courseId && examDaysLeft(item.exam_date) >= 0)
    .sort((a, b) => dayjs(a.exam_date).valueOf() - dayjs(b.exam_date).valueOf())[0];
}

export function examUrgency(daysLeft: number, brandColor: string): ExamUrgency {
  if (daysLeft <= 3) {
    return { color: '#FF4D4D', background: '#FF4D4D1F', border: '#FF4D4D', label: daysLeft <= 0 ? 'Exam is today' : `Exam in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}` };
  }
  if (daysLeft <= 7) {
    return { color: '#FFA500', background: '#FFA5001F', border: '#FFA500', label: `Exam in ${daysLeft} days` };
  }
  return { color: brandColor, background: `${brandColor}1F`, border: brandColor, label: `Exam in ${daysLeft} days` };
}
