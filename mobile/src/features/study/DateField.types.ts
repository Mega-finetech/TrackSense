import type { StudyPalette } from './studyTheme';

export type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  palette: StudyPalette;
  disabled?: boolean;
};
