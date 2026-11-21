export type StudyPalette = {
  dark: boolean;
  background: string;
  card: string;
  border: string;
  primary: string;
  onPrimary: string;
  text: string;
  secondary: string;
  muted: string;
  soft: string;
};

/** Existing Study colours, kept in one place for the new sub-components. */
export function studyPalette(dark: boolean): StudyPalette {
  return {
    dark,
    background: dark ? '#0A0F0D' : '#F8F9FA',
    card: dark ? '#111915' : '#FFFFFF',
    border: dark ? '#2D4A38' : '#E5E7EB',
    primary: dark ? '#52B788' : '#1B4332',
    onPrimary: dark ? '#0A0F0D' : '#FFFFFF',
    text: dark ? '#F0FDF4' : '#1A1A1A',
    secondary: dark ? '#86EFAC' : '#6B7280',
    muted: dark ? '#4B6E58' : '#9CA3AF',
    soft: dark ? '#1A2E22' : '#F3F4F6',
  };
}
