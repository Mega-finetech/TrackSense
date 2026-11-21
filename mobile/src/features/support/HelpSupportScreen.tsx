import { useState } from 'react';
import {
  Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import {
  BookOpen, Check, ChevronLeft, Info, Lightbulb, Mail, MessageCircle, Search, X,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthStore } from '../../stores/authStore';
import {
  APP_VERSION, BUG_CATEGORIES, FAQ_ENTRIES, SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY,
  bugReportEmailUrl, faqMatches, feedbackEmailUrl, supportEmailUrl, whatsappUrl,
  type BugCategory,
} from './support';

type Panel = 'bug' | 'feedback' | null;

export default function HelpSupportScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore(state => state.user?.id);
  const [panel, setPanel] = useState<Panel>(null);
  const [category, setCategory] = useState<BugCategory>(BUG_CATEGORIES[0]);
  const [details, setDetails] = useState('');
  const [feedback, setFeedback] = useState('');
  const [panelError, setPanelError] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const appVersion = (Constants.expoConfig?.version || APP_VERSION).replace(/^v/i, '');
  const diagnostics = { userId, platform: Platform.OS, appVersion };
  const c = {
    page: colors.background,
    card: colors.surface,
    input: dark ? '#1E1E1E' : colors.background,
    border: dark ? '#2A2A2A' : colors.border,
    divider: colors.border,
    text: colors.text,
    sub: colors.secondary,
    muted: colors.muted,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    soft: colors.soft,
    danger: colors.danger,
    dangerSoft: colors.dangerSoft,
  };
  const faqs = FAQ_ENTRIES.filter(entry => faqMatches(entry, query));

  async function open(url: string) {
    setError('');
    try {
      await Linking.openURL(url);
    } catch {
      setError('This link could not be opened on this device. You can email us directly at ' + SUPPORT_EMAIL + '.');
    }
  }

  function openPanel(next: Panel) {
    setPanelError('');
    setError('');
    setSent(false);
    setPanel(next);
  }

  function submitBug() {
    if (details.trim().length < 5) {
      setPanelError('Describe what happened in a little more detail.');
      return;
    }
    const url = bugReportEmailUrl(diagnostics, { category, details });
    setDetails('');
    setSent(true);
    void open(url);
  }

  function submitFeedback() {
    if (feedback.trim().length < 3) {
      setPanelError('Add a short note so we know what to improve.');
      return;
    }
    const url = feedbackEmailUrl(diagnostics, { message: feedback });
    setFeedback('');
    setSent(true);
    void open(url);
  }

  function openPolicy(url: string | undefined, label: string) {
    if (!url) {
      setError(`${label} is not available yet. Email ${SUPPORT_EMAIL} and we can send a copy.`);
      return;
    }
    void open(url);
  }

  function tintedBadge(Icon: typeof Mail, badgeStyle: StyleProp<ViewStyle>, iconSize: number, tint: string) {
    return <View style={badgeStyle}>
      <View style={[s.tintLayer, { backgroundColor: tint }]} />
      <Icon size={iconSize} color={tint} />
    </View>;
  }

  function contactCard(label: string, detail: string, Icon: typeof Mail, onPress: () => void) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={detail}
        onPress={onPress}
        style={({ pressed }) => [s.contactCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={s.contactTop}>
          {tintedBadge(Icon, s.contactBadge, 20, colors.primary)}
          <Text style={[s.diagonalArrow, { color: colors.secondary }]}>↗</Text>
        </View>
        <Text numberOfLines={1} style={[s.contactTitle, { color: colors.text }]}>{label}</Text>
        <Text numberOfLines={1} style={[s.contactDetail, { color: colors.secondary }]}>{detail}</Text>
      </Pressable>
    );
  }

  function actionRow(
    label: string,
    detail: string,
    Icon: typeof Mail,
    tint: string,
    onPress: () => void,
    last = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={detail}
        onPress={onPress}
        style={({ pressed }) => [s.actionRow, {
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        }]}
      >
        {tintedBadge(Icon, s.actionBadge, 18, tint)}
        <View style={s.actionBody}>
          <Text style={[s.actionTitle, { color: colors.text }]}>{label}</Text>
          <Text numberOfLines={1} style={[s.actionDetail, { color: colors.secondary }]}>{detail}</Text>
        </View>
        <Text style={[s.chevron, { color: colors.secondary }]}>›</Text>
      </Pressable>
    );
  }

  return <SafeAreaView edges={['left', 'right']} style={[s.screen, { backgroundColor: c.page }]}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
      <View style={[s.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')} style={s.back}>
          <ChevronLeft size={24} color={c.text} />
        </Pressable>
        <Text accessibilityRole="header" style={[s.title, { color: c.text }]}>Help & Support</Text>
      </View>

      <View style={[s.hero, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.heroTitle, { color: c.text }]}>We're here to help.</Text>
        <Text style={[s.heroText, { color: c.sub }]}>Reach a real person or find a quick answer below.</Text>
      </View>

      <Text style={[s.sectionLabel, { color: colors.secondary }]}>CONTACT US</Text>
      <View style={s.contactGrid}>
        {contactCard('WhatsApp Admin', SUPPORT_WHATSAPP_DISPLAY, MessageCircle, () => open(whatsappUrl(diagnostics)))}
        {contactCard('Email Support', SUPPORT_EMAIL, Mail, () => open(supportEmailUrl(diagnostics, 'TrackSense Support')))}
      </View>

      <Text style={[s.sectionLabel, { color: colors.secondary }]}>TELL US MORE</Text>
      <View style={[s.actionGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {actionRow('Report a Bug', 'Spotted a glitch? Let us fix it', Info, colors.danger, () => openPanel('bug'))}
        {actionRow('Share Feedback', 'Suggest features or improvements', Lightbulb, colors.primary, () => openPanel('feedback'), true)}
      </View>

      <View style={s.faqHeader}>
        <Text style={[s.sectionTitle, { color: c.text, marginTop: 0, marginBottom: 0 }]}>Frequently Asked Questions</Text>
      </View>
      <View style={[s.search, { backgroundColor: c.input, borderColor: c.border }]}>
        <Search size={18} color={c.muted} />
        <TextInput
          accessibilityLabel="Search frequently asked questions"
          value={query}
          onChangeText={setQuery}
          placeholder="Search help articles"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[s.searchInput, { color: c.text }]}
        />
        {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear help search" onPress={() => setQuery('')} style={s.clear}>
          <X size={16} color={c.muted} />
        </Pressable>}
      </View>
      {faqs.length === 0 && <View style={[s.empty, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.emptyTitle, { color: c.text }]}>No matching answers yet.</Text>
        <Text style={[s.emptyText, { color: c.sub }]}>Email {SUPPORT_EMAIL} and we will help you directly.</Text>
      </View>}
      {faqs.map(entry => (
        <View key={entry.id} style={[s.faqCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[s.optionIcon, { backgroundColor: c.soft }]}>
            <BookOpen size={18} color={c.primary} />
          </View>
          <View style={s.faqBody}>
            <Text style={[s.faqQuestion, { color: c.text }]}>{entry.question}</Text>
            <Text style={[s.faqAnswer, { color: c.sub }]}>{entry.answer}</Text>
          </View>
        </View>
      ))}

      {!!error && !panel && <Text accessibilityRole="alert" style={[s.error, { color: colors.danger }]}>{error}</Text>}

      <View style={s.footer}>
        <Text style={[s.footerText, { color: c.muted }]}>TrackSense v{appVersion}</Text>
        <View style={s.status}>
          <Text style={s.statusDot}>🟢</Text>
          <Text style={[s.footerText, { color: c.sub }]}>Systems Operational</Text>
        </View>
        <View style={s.policyRow}>
          <Pressable accessibilityRole="link" accessibilityLabel="Terms of Service" onPress={() => openPolicy(process.env.EXPO_PUBLIC_TERMS_URL, 'Terms of Service')}>
            <Text style={[s.policy, { color: c.primary }]}>Terms of Service</Text>
          </Pressable>
          <Text style={[s.policy, { color: c.muted }]}>·</Text>
          <Pressable accessibilityRole="link" accessibilityLabel="Privacy Policy" onPress={() => openPolicy(process.env.EXPO_PUBLIC_PRIVACY_URL, 'Privacy Policy')}>
            <Text style={[s.policy, { color: c.primary }]}>Privacy Policy</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>

    <Modal visible={!!panel} transparent animationType="slide" onRequestClose={() => setPanel(null)}>
      <View style={s.scrim}>
        <View style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: 24 + insets.bottom }]}>
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {sent ? <View style={s.confirmation}>
              <View style={[s.confirmBadge, { backgroundColor: colors.soft }]}>
                <Check size={28} color={colors.primary} />
              </View>
              <Text style={[s.confirmTitle, { color: colors.text }]}>{panel === 'bug' ? 'Report submitted' : 'Feedback sent'}</Text>
              <Text style={[s.confirmText, { color: colors.secondary }]}>
                {panel === 'bug' ? 'Your report is ready in your email app.' : 'Thanks for helping us improve TrackSense.'}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={() => setPanel(null)} style={({ pressed }) => [s.sheetCta, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={[s.sheetCtaText, { color: colors.onPrimary }]}>Done</Text>
              </Pressable>
            </View> : <>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: colors.text }]}>{panel === 'bug' ? 'Report a Bug' : 'Share Feedback'}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Close dialog" onPress={() => setPanel(null)} style={s.back}>
                  <X size={22} color={colors.text} />
                </Pressable>
              </View>

              {panel === 'bug' ? <>
                <Text style={[s.fieldLabel, { color: colors.text }]}>Category</Text>
                <View style={s.pills}>
                  {BUG_CATEGORIES.map(option => {
                    const selected = option === category;
                    return <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, selected }}
                      aria-checked={selected}
                      accessibilityLabel={option}
                      onPress={() => setCategory(option)}
                      style={[s.pill, {
                        backgroundColor: selected ? colors.primary : colors.raised,
                        borderColor: selected ? colors.primary : colors.border,
                      }]}
                    >
                      <Text style={[s.pillText, { color: selected ? colors.onPrimary : colors.secondary }]}>{option}</Text>
                    </Pressable>;
                  })}
                </View>
                <Text style={[s.fieldLabel, { color: colors.text }]}>What happened?</Text>
                <TextInput
                  accessibilityLabel="Bug description"
                  value={details}
                  onChangeText={value => { setDetails(value); setPanelError(''); }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  multiline
                  numberOfLines={4}
                  maxLength={1200}
                  placeholder="Tell us what you were doing and what went wrong."
                  placeholderTextColor={colors.secondary}
                  style={[s.textArea, {
                    backgroundColor: colors.background,
                    borderColor: inputFocused ? colors.primary : colors.border,
                    color: colors.text,
                  }]}
                />
                <Text style={[s.hint, { color: colors.secondary }]}>Your message will open in your email app with account diagnostics attached.</Text>
              </> : <>
                <Text style={[s.fieldLabel, { color: colors.text }]}>Your idea</Text>
                <TextInput
                  accessibilityLabel="Feature feedback"
                  value={feedback}
                  onChangeText={value => { setFeedback(value); setPanelError(''); }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  multiline
                  numberOfLines={4}
                  maxLength={1200}
                  placeholder="What would make TrackSense better for you?"
                  placeholderTextColor={colors.secondary}
                  style={[s.textArea, {
                    backgroundColor: colors.background,
                    borderColor: inputFocused ? colors.primary : colors.border,
                    color: colors.text,
                  }]}
                />
              </>}
              {!!panelError && <Text accessibilityRole="alert" style={[s.sheetError, { color: colors.danger }]}>{panelError}</Text>}
              {!!error && <Text accessibilityRole="alert" style={[s.sheetError, { color: colors.danger }]}>{error}</Text>}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={panel === 'bug' ? 'Submit Report' : 'Send Feedback'}
                onPress={panel === 'bug' ? submitBug : submitFeedback}
                style={({ pressed }) => [s.sheetCta, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={[s.sheetCtaText, { color: colors.onPrimary }]}>{panel === 'bug' ? 'Submit Report' : 'Send Feedback'}</Text>
              </Pressable>
            </>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  title: { fontSize: 20, fontWeight: '700' },
  hero: { marginHorizontal: 20, marginTop: 12, marginBottom: 8, borderWidth: 1, borderRadius: 16, padding: 18 },
  heroTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  heroText: { fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 20, marginBottom: 8, marginHorizontal: 20 },
  sectionLabel: { fontSize: 11, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase', marginHorizontal: 20, marginTop: 24, marginBottom: 10 },
  contactGrid: { flexDirection: 'row', gap: 12, marginHorizontal: 20 },
  contactCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 138 },
  contactTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  contactBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tintLayer: { ...StyleSheet.absoluteFill, opacity: 0.15 },
  diagonalArrow: { fontSize: 18, fontWeight: '600' },
  contactTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  contactDetail: { fontSize: 12, lineHeight: 17 },
  actionGroup: { marginHorizontal: 20, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  actionBadge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 12 },
  actionBody: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  actionDetail: { fontSize: 12, lineHeight: 17 },
  chevron: { fontSize: 20 },
  optionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  faqHeader: { marginHorizontal: 20, marginTop: 24, marginBottom: 8 },
  search: { marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 10 },
  clear: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  faqCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderRadius: 16, padding: 16 },
  faqBody: { flex: 1, minWidth: 0, marginLeft: 12 },
  faqQuestion: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 6 },
  faqAnswer: { fontSize: 13, lineHeight: 20 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 18, marginHorizontal: 20 },
  emptyTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  emptyText: { fontSize: 13, lineHeight: 19 },
  error: { fontSize: 13, lineHeight: 19, marginHorizontal: 20, marginTop: 12 },
  footer: { marginTop: 28, alignItems: 'center', gap: 8 },
  footerText: { fontSize: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { fontSize: 11 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  policy: { fontSize: 12, fontWeight: '600' },
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, padding: 24, maxHeight: '88%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 16, alignSelf: 'center' },
  confirmation: { alignItems: 'center', paddingVertical: 24 },
  confirmBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  confirmText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 12, fontWeight: '600' },
  textArea: { minHeight: 110, borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  sheetError: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  sheetCta: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  sheetCtaText: { fontSize: 15, fontWeight: '700' },
});
