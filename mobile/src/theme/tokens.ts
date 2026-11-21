export const palettes = {
  light: {
    background: '#F6F7F4', surface: '#FFFFFF', raised: '#EDF1ED', text: '#172F32',
    secondary: '#465B5B', muted: '#657571', border: '#E5EAE6', primary: '#225C4B', onPrimary: '#FFFFFF',
    soft: '#E8F3ED', accent: '#49A577', danger: '#B8434A', dangerSoft: '#FCECEE',
    success: '#32845B', warning: '#AC7429', warningSoft: '#FCF2DF',
    blue: '#427F9E', blueSoft: '#EAF3F9', purple: '#8270B6', purpleSoft: '#F0EDFA',
    coral: '#B96D61', coralSoft: '#FBECE7', shadow: '#18382B',
  },
  dark: {
    background: '#101D19', surface: '#182A24', raised: '#253B32', text: '#EDF4EF',
    secondary: '#C4D2C9', muted: '#9CAFA5', border: '#2C4137', primary: '#A3D7B7', onPrimary: '#123625',
    soft: '#244333', accent: '#69BF8F', danger: '#FFA6AD', dangerSoft: '#48272D',
    success: '#7ED2A2', warning: '#E2BC78', warningSoft: '#3D3424',
    blue: '#8FBEDB', blueSoft: '#233B48', purple: '#B9A6E0', purpleSoft: '#342F48',
    coral: '#E2A298', coralSoft: '#43312F', shadow: '#000000',
  },
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, hero: 48 };
export const radius = { xs: 8, sm: 12, md: 16, lg: 22, pill: 999 };
export const type = { micro: 11, caption: 12, body: 15, label: 14, section: 16, heading: 20, title: 28, hero: 40 };
export const iconSize = { sm: 16, md: 20, lg: 24, hero: 32 };
export const elevation = { card: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.035, shadowRadius: 12, elevation: 1 }, floating: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 5 } };
export type ThemeMode = 'light' | 'dark' | 'system';

// Revision 2 is opt-in: deferred modules and the approved navigation retain
// their current palette until their own visual review.
export const fidelityPalettes = {
  light: { ...palettes.light, background: '#F7F6F2', surface: '#FFFFFF', raised: '#ECEDE8', text: '#18313F', secondary: '#465950', muted: '#64736A', border: '#E3E6DF', primary: '#176444', onPrimary: '#FFFFFF', soft: '#E5F1E7', accent: '#329966' },
  dark: { ...palettes.dark, background: '#141817', surface: '#242927', raised: '#373E39', text: '#F1F4ED', secondary: '#CBD5CB', muted: '#A9B8AB', border: '#344039', primary: '#96E1B5', onPrimary: '#112E20', soft: '#203E2D', accent: '#6BCD95' },
};
export const fidelitySurfaces = {
  light: { elevated: '#FFFFFF', hero: '#163F30', heroText: '#F5FAF4', heroMuted: '#C8DECD', heroTrack: '#3A6250', heroAccent: '#96DEAB' },
  dark: { elevated: '#303833', hero: '#284235', heroText: '#F5FAF4', heroMuted: '#D0E2D1', heroTrack: '#496553', heroAccent: '#A2E5B8' },
};
export const fidelityType = { display: 25, title: 24, section: 18, card: 15, support: 13, meta: 11, action: 13 };
