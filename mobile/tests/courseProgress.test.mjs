import test from 'node:test';
import assert from 'node:assert/strict';
import dayjs from 'dayjs';
import {
  calculateCourseGrade,
  calculateCourseProgress,
  coursePaceStatus,
  examUrgency,
  isAssignmentComplete,
  modulePosition,
  nextExamForCourse,
  sortAssignments,
  toAssignment,
  toCourse,
  topicCompletion,
} from '../src/features/study/courseProgress.ts';

const assignment = (id, { status = 'pending', dueDate, earnedScore, totalScore, isCompleted } = {}) => ({
  id,
  title: id,
  user_id: 'user',
  created_at: '',
  status,
  dueDate,
  earnedScore,
  totalScore,
  isCompleted: isCompleted ?? (status === 'submitted' || status === 'graded'),
});
const course = {
  id: 'course',
  name: 'Course',
  credits: 3,
  status: 'active',
  user_id: 'user',
  topics: [],
  modules: [],
};
const topic = (id, completed = false) => ({ id, title: id, completed });
const module = (id, isCompleted = false) => ({ id, title: id, isCompleted });

test('combined progress counts completed assignments and topics', () => {
  assert.equal(calculateCourseProgress(course, []), 0);
  assert.equal(calculateCourseProgress(course, [assignment('a')]), 0);
  assert.equal(calculateCourseProgress(course, [assignment('a'), assignment('b', { status: 'submitted' })]), 50);
  assert.equal(calculateCourseProgress(course, [assignment('a', { status: 'graded' }), assignment('b', { status: 'submitted' })]), 100);
  assert.equal(calculateCourseProgress(course, [assignment('a'), assignment('b'), assignment('c', { status: 'graded' })]), 33);
  const withTopics = { ...course, topics: [topic('t1', true), topic('t2')] };
  assert.equal(calculateCourseProgress(withTopics, [assignment('a', { status: 'submitted' }), assignment('b')]), 50);
  assert.equal(calculateCourseProgress(withTopics, []), 50);
});

test('completed courses stay complete when they have no tracked work', () => {
  assert.equal(calculateCourseProgress({ ...course, status: 'completed' }, []), 100);
});

test('assignment completion follows the view-model flag and legacy statuses', () => {
  assert.equal(isAssignmentComplete(assignment('a', { status: 'graded' })), true);
  assert.equal(isAssignmentComplete(assignment('a', { status: 'submitted' })), true);
  assert.equal(isAssignmentComplete(assignment('a', { status: 'pending' })), false);
  assert.equal(isAssignmentComplete(assignment('a', { status: 'pending', isCompleted: true })), true);
});

test('assignments sort by due date ascending with undated work last', () => {
  const sorted = sortAssignments([
    assignment('undated'),
    assignment('later', { dueDate: '2026-12-20T23:59:00.000Z' }),
    assignment('sooner', { dueDate: '2026-11-20T23:59:00.000Z' }),
  ]);
  assert.deepEqual(sorted.map(item => item.id), ['sooner', 'later', 'undated']);
});

test('the course score combines every graded assignment', () => {
  assert.equal(calculateCourseGrade([]), null);
  assert.equal(calculateCourseGrade([assignment('a'), assignment('b', { status: 'submitted' })]), null);
  assert.equal(calculateCourseGrade([assignment('a', { status: 'graded', earnedScore: 8, totalScore: 10 })]), 80);
  assert.equal(
    calculateCourseGrade([
      assignment('a', { status: 'graded', earnedScore: 8, totalScore: 10 }),
      assignment('b', { status: 'graded', earnedScore: 7, totalScore: 10 }),
      assignment('c'),
    ]),
    75,
  );
  assert.equal(calculateCourseGrade([assignment('a', { status: 'graded', earnedScore: 1, totalScore: 3 })]), 33);
});

test('course pace prioritises overdue work, then the next 24 hours', () => {
  const now = dayjs('2026-01-10T12:00:00.000Z');
  assert.equal(coursePaceStatus([], now).label, 'On Track');
  assert.equal(coursePaceStatus([assignment('a', { dueDate: now.subtract(1, 'hour').toISOString() })], now).label, 'Behind Schedule');
  assert.equal(coursePaceStatus([assignment('a', { dueDate: now.add(2, 'hour').toISOString() })], now).label, 'Needs Focus');
  assert.equal(coursePaceStatus([assignment('a', { dueDate: now.add(3, 'day').toISOString() })], now).label, 'On Track');
  assert.equal(
    coursePaceStatus([assignment('a', { status: 'submitted', dueDate: now.subtract(1, 'day').toISOString() })], now).label,
    'On Track',
    'completed work never makes a course late',
  );
});

test('module position follows the first incomplete module', () => {
  assert.equal(modulePosition(course), null);
  assert.deepEqual(modulePosition({ ...course, modules: [module('m1'), module('m2')] }), { current: 1, total: 2 });
  assert.deepEqual(modulePosition({ ...course, modules: [module('m1', true), module('m2')] }), { current: 2, total: 2 });
  assert.deepEqual(modulePosition({ ...course, modules: [module('m1', true), module('m2', true)] }), { current: 2, total: 2 });
});

test('topic completion counts checked topics', () => {
  assert.deepEqual(topicCompletion(course), { completed: 0, total: 0 });
  assert.deepEqual(topicCompletion({ ...course, topics: [topic('t1', true), topic('t2'), topic('t3', true)] }), { completed: 2, total: 3 });
});

test('legacy API records map into camelCase study view models', () => {
  const mapped = toAssignment({
    id: 'a',
    user_id: 'user',
    course_id: 'course',
    title: 'Quiz',
    due_date: '2026-02-01T23:59:00.000Z',
    status: 'graded',
    earned_score: '8.00',
    total_score: '10.00',
    created_at: '',
  });
  assert.equal(mapped.dueDate, '2026-02-01T23:59:00.000Z');
  assert.equal(mapped.earnedScore, 8);
  assert.equal(mapped.totalScore, 10);
  assert.equal(mapped.isCompleted, true);
});

test('courses normalise missing checklist arrays', () => {
  const mapped = toCourse({ id: 'course', user_id: 'user', name: 'Course', credits: 3, status: 'active' });
  assert.deepEqual(mapped.topics, []);
  assert.deepEqual(mapped.modules, []);
});

test('exam urgency follows the 3 / 7 day thresholds', () => {
  assert.equal(examUrgency(1, '#52B788').color, '#FF4D4D');
  assert.equal(examUrgency(3, '#52B788').color, '#FF4D4D');
  assert.equal(examUrgency(4, '#52B788').color, '#FFA500');
  assert.equal(examUrgency(7, '#52B788').color, '#FFA500');
  assert.equal(examUrgency(8, '#52B788').color, '#52B788');
  assert.match(examUrgency(0, '#52B788').label, /today/i);
});

test('the course countdown picks the nearest upcoming exam only', () => {
  const soon = dayjs().add(5, 'day').toISOString();
  const later = dayjs().add(20, 'day').toISOString();
  const past = dayjs().subtract(1, 'day').toISOString();
  const exams = [
    { id: 'past', course_id: 'course', subject: 'Past', exam_date: past, user_id: 'user', created_at: '' },
    { id: 'later', course_id: 'course', subject: 'Later', exam_date: later, user_id: 'user', created_at: '' },
    { id: 'soon', course_id: 'course', subject: 'Soon', exam_date: soon, user_id: 'user', created_at: '' },
    { id: 'other', course_id: 'other', subject: 'Other', exam_date: soon, user_id: 'user', created_at: '' },
  ];
  assert.equal(nextExamForCourse(exams, 'course').id, 'soon');
});
