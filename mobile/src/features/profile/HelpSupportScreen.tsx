import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ArrowLeft, Bug, Mail, MessageCircle, MessageSquare } from 'lucide-react-native';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

const SUPPORT_WHATSAPP = '2349057434214';
const SUPPORT_EMAIL = 'tracksensehelpnow@gmail.com';

type HelpPalette = {
  screen: string;
  card: string;
  border: string;
  title: string;
  muted: string;
  divider: string;
  whatsappIconBg: string;
  whatsappIcon: string;
  emailIconBg: string;
  emailIcon: string;
  bugIconBg: string;
  bugIcon: string;
  feedbackIconBg: string;
  feedbackIcon: string;
};

const LIGHT_PALETTE: HelpPalette = {
  screen: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E5E7EB',
  title: '#1A1A1A',
  muted: '#6B7280',
  divider: '#F3F4F6',
  whatsappIconBg: '#DCFCE7',
  whatsappIcon: '#1B4332',
  emailIconBg: '#DBEAFE',
  emailIcon: '#2563EB',
  bugIconBg: '#FEE2E2',
  bugIcon: '#DC2626',
  feedbackIconBg: '#EDE9FE',
  feedbackIcon: '#7C3AED',
};

const DARK_PALETTE: HelpPalette = {
  screen: '#0A0F0D',
  card: '#111915',
  border: '#2D4A38',
  title: '#F0FDF4',
  muted: '#86EFAC',
  divider: '#1A2E22',
  whatsappIconBg: '#52B788',
  whatsappIcon: '#0A0F0D',
  emailIconBg: '#1B3A5C',
  emailIcon: '#60A5FA',
  bugIconBg: '#3B0000',
  bugIcon: '#F87171',
  feedbackIconBg: '#2E1A5C',
  feedbackIcon: '#A78BFA',
};

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

function diagnosticBody() {
  return `Describe the problem:\n\n\nApp version: ${APP_VERSION}\nPlatform: ${Platform.OS}`;
}

function supportMailUrl(subject: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(diagnosticBody())}`;
}

export default function HelpSupportScreen() {
  const { dark } = useTheme();
  const p = dark ? DARK_PALETTE : LIGHT_PALETTE;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function openExternal(url: string, errorMessage: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', errorMessage);
    }
  }

  function contactCard(
    label: string,
    subtitle: string,
    Icon: typeof Mail,
    iconBg: string,
    iconColor: string,
    onPress: () => void,
    singleLineSubtitle = false,
  ) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        activeOpacity={0.7}
        onPress={onPress}
        style={[s.contactCard, { backgroundColor: p.card, borderColor: p.border }]}
      >
        <View style={[s.contactIcon, { backgroundColor: iconBg }]}>
          <Icon size={22} color={iconColor} />
        </View>
        <Text style={[s.contactTitle, { color: p.title }]}>{label}</Text>
        <Text
          numberOfLines={singleLineSubtitle ? 1 : undefined}
          adjustsFontSizeToFit={singleLineSubtitle}
          style={[s.contactSubtitle, { color: p.muted }]}
        >
          {subtitle}
        </Text>
      </TouchableOpacity>
    );
  }

  function actionRow(
    label: string,
    subtitle: string,
    Icon: typeof Bug,
    iconBg: string,
    iconColor: string,
    onPress: () => void,
    last = false,
  ) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          s.actionRow,
          {
            borderBottomWidth: last ? 0 : 1,
            borderBottomColor: p.divider,
          },
        ]}
      >
        <View style={[s.actionIcon, { backgroundColor: iconBg }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={s.actionBody}>
          <Text style={[s.actionTitle, { color: p.title }]}>{label}</Text>
          <Text style={[s.actionSubtitle, { color: p.muted }]}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={[s.screen, { backgroundColor: p.screen }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7} onPress={goBack} style={s.back}>
            <ArrowLeft size={24} color={p.title} />
          </TouchableOpacity>
        </View>

        <Text style={[s.title, { color: p.title }]}>Help &amp; Support</Text>

        <View style={s.contactRow}>
          {contactCard(
            'WhatsApp\nAdmin',
            '+234 905 743 4214',
            MessageCircle,
            p.whatsappIconBg,
            p.whatsappIcon,
            () => void openExternal(`https://wa.me/${SUPPORT_WHATSAPP}`, 'WhatsApp is not available on this device.'),
          )}
          {contactCard(
            'Email\nSupport',
            SUPPORT_EMAIL,
            Mail,
            p.emailIconBg,
            p.emailIcon,
            () => void openExternal(`mailto:${SUPPORT_EMAIL}`, 'Email is not available on this device.'),
            true,
          )}
        </View>

        <Text style={[s.sectionLabel, { color: p.muted }]}>TELL US MORE</Text>

        <View style={[s.actionGroup, { backgroundColor: p.card, borderColor: p.border }]}>
          {actionRow(
            'Report a Bug',
            'Spotted a glitch? Let us fix it',
            Bug,
            p.bugIconBg,
            p.bugIcon,
            () => void openExternal(supportMailUrl('TrackSense Bug Report'), 'Email is not available on this device.'),
          )}
          {actionRow(
            'Share Feedback',
            'Suggest features or improvements',
            MessageSquare,
            p.feedbackIconBg,
            p.feedbackIcon,
            () => void openExternal(supportMailUrl('TrackSense Feedback'), 'Email is not available on this device.'),
            true,
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 32 },
  header: { paddingTop: 56, paddingHorizontal: 20 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 20, marginBottom: 24, paddingHorizontal: 20 },
  contactRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  contactCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 16, minHeight: 150 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontSize: 17, fontWeight: '800', marginTop: 14 },
  contactSubtitle: { fontSize: 11, marginTop: 6 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: 28, marginBottom: 12, paddingHorizontal: 20 },
  actionGroup: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionBody: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  actionSubtitle: { fontSize: 12, marginTop: 3 },
});
