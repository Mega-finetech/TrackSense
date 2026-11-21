import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

type ChangePhotoSheetProps = {
  visible: boolean;
  onTakePicture: () => void;
  onChooseFromGallery: () => void;
  onCancel: () => void;
};

type SheetPalette = {
  background: string;
  handle: string;
  cancelBorder: string;
  cameraBackground: string;
  cameraIcon: string;
  galleryBackground: string;
  galleryIcon: string;
};

const LIGHT_PALETTE: SheetPalette = {
  background: '#FFFFFF',
  handle: '#D1D5DB',
  cancelBorder: '#E5E7EB',
  cameraBackground: '#DCFCE7',
  cameraIcon: '#1B4332',
  galleryBackground: '#DBEAFE',
  galleryIcon: '#2563EB',
};

const DARK_PALETTE: SheetPalette = {
  background: '#111915',
  handle: '#2D4A38',
  cancelBorder: '#2D4A38',
  cameraBackground: '#52B788',
  cameraIcon: '#0A0F0D',
  galleryBackground: '#1B3A5C',
  galleryIcon: '#60A5FA',
};

export default function ChangePhotoSheet({
  visible,
  onTakePicture,
  onChooseFromGallery,
  onCancel,
}: ChangePhotoSheetProps) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const p = dark ? DARK_PALETTE : LIGHT_PALETTE;

  function option(
    label: string,
    subtitle: string,
    Icon: typeof Camera,
    iconBackground: string,
    iconColor: string,
    onPress: () => void,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          s.option,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[s.optionIcon, { backgroundColor: iconBackground }]}>
          <Icon size={22} color={iconColor} />
        </View>
        <View style={s.optionBody}>
          <Text style={[s.optionTitle, { color: colors.text }]}>{label}</Text>
          <Text style={[s.optionSubtitle, { color: colors.muted }]}>{subtitle}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss change photo options" style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View
          style={[
            s.sheet,
            {
              backgroundColor: p.background,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[s.handle, { backgroundColor: p.handle }]} />
          <Text style={[s.title, { color: colors.text }]}>Change Profile Photo</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>Choose how you want to update your avatar</Text>

          {option(
            'Take a Picture',
            'Open camera to snap a new photo',
            Camera,
            p.cameraBackground,
            p.cameraIcon,
            onTakePicture,
          )}
          {option(
            'Choose from Gallery',
            'Pick an existing photo from your library',
            ImageIcon,
            p.galleryBackground,
            p.galleryIcon,
            onChooseFromGallery,
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onCancel}
            style={[s.cancel, { borderColor: p.cancelBorder }]}
          >
            <Text style={[s.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  option: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionBody: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 15, fontWeight: '700' },
  optionSubtitle: { fontSize: 12, marginTop: 3 },
  cancel: { width: '100%', height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
