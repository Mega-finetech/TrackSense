import { BookOpen, GraduationCap, Layers3, Activity } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { Assignment, Course } from '../../types';
import {
  calculateCourseGrade,
  coursePaceStatus,
  modulePosition,
  topicCompletion,
} from './courseProgress';
import type { StudyPalette } from './studyTheme';

type CourseHealthBannerProps = {
  course: Course;
  assignments: Assignment[];
  palette: StudyPalette;
};

/**
 * Compact health strip for the course detail sheet. It reuses the existing
 * Study palette and spacing so the banner reads as part of the original UI.
 */
export function CourseHealthBanner({ course, assignments, palette }: CourseHealthBannerProps) {
  const pace = coursePaceStatus(assignments);
  const grade = calculateCourseGrade(assignments);
  const topics = topicCompletion(course);
  const roadmap = modulePosition(course);

  return (
    <View
      accessibilityLabel="Course health"
      style={[styles.banner, { borderColor: palette.border, backgroundColor: palette.soft }]}
    >
      <View style={styles.topRow}>
        <View
          accessibilityLabel={`Course pace: ${pace.label}`}
          style={[styles.status, { backgroundColor: pace.background, borderColor: pace.border }]}
        >
          <View style={[styles.dot, { backgroundColor: pace.color }]} />
          <Text style={[styles.statusText, { color: pace.color }]}>{pace.label}</Text>
        </View>
        {roadmap && (
          <View style={[styles.module, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <Layers3 size={12} color={palette.secondary} />
            <Text style={[styles.moduleText, { color: palette.secondary }]}>
              Module {roadmap.current} of {roadmap.total}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metrics}>
        {grade !== null && (
          <View accessibilityLabel={`Current Score: ${grade}%`} style={[styles.pill, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <GraduationCap size={13} color={palette.primary} />
            <Text style={[styles.pillText, { color: palette.text }]}>Current Score: {grade}%</Text>
          </View>
        )}
        <View accessibilityLabel={`${topics.completed} / ${topics.total} Topics Done`} style={[styles.pill, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <BookOpen size={13} color={palette.primary} />
          <Text style={[styles.pillText, { color: palette.text }]}>
            {topics.completed} / {topics.total} Topics Done
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Activity size={12} color={palette.muted} />
        <Text style={[styles.footerText, { color: palette.muted }]}>
          {pace.key === 'onTrack'
            ? 'All pending work is on schedule.'
            : pace.key === 'focus'
              ? 'An assignment is due within 24 hours.'
              : 'A pending assignment is overdue.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  module: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  moduleText: { fontSize: 10, fontWeight: '700' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 11, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  footerText: { flex: 1, fontSize: 10, fontWeight: '500' },
});
