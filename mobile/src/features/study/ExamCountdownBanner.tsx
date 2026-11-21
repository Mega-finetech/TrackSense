import { CalendarDays, Clock } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import type { Exam } from '../../types';
import { examDaysLeft, examUrgency } from './courseProgress';
import type { StudyPalette } from './studyTheme';

type ExamCountdownBannerProps = {
  exam?: Exam;
  palette: StudyPalette;
};

export function ExamCountdownBanner({ exam, palette }: ExamCountdownBannerProps) {
  if (!exam) {
    return (
      <View accessibilityLabel="No upcoming exam scheduled" style={[styles.banner, { backgroundColor: palette.soft, borderColor: palette.border }]}>
        <View style={[styles.icon, { backgroundColor: palette.card }]}><CalendarDays size={20} color={palette.muted} /></View>
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: palette.muted }]}>EXAM COUNTDOWN</Text>
          <Text style={[styles.subject, { color: palette.text }]}>No upcoming exam scheduled</Text>
        </View>
      </View>
    );
  }

  const daysLeft = examDaysLeft(exam.exam_date);
  const urgency = examUrgency(daysLeft, palette.primary);
  return (
    <View
      accessibilityLabel={`${urgency.label} for ${exam.subject}`}
      style={[styles.banner, { backgroundColor: urgency.background, borderColor: urgency.border }]}
    >
      <View style={[styles.icon, { backgroundColor: palette.card }]}>
        <CalendarDays size={20} color={urgency.color} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.eyebrow, { color: urgency.color }]}>EXAM COUNTDOWN</Text>
        <Text numberOfLines={1} style={[styles.subject, { color: palette.text }]}>{exam.subject}</Text>
        <View style={styles.dateRow}>
          <Clock size={12} color={palette.secondary} />
          <Text style={[styles.date, { color: palette.secondary }]}>{dayjs(exam.exam_date).format('MMM D, YYYY')}</Text>
        </View>
      </View>
      <Text style={[styles.days, { color: urgency.color }]}>{urgency.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  body: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  subject: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  date: { fontSize: 11, fontWeight: '500' },
  days: { fontSize: 12, fontWeight: '800', marginLeft: 8, textAlign: 'right', maxWidth: 84 },
});
