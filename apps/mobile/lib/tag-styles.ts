export interface TagStyle {
  color: string;
  bgColor: string;
}

const TAG_MAP: Record<string, TagStyle> = {
  'certification prep':  { color: '#185FA5', bgColor: '#E6F1FB' },
  'beginner friendly':   { color: '#0F6E56', bgColor: '#E1F5EE' },
  'advanced':            { color: '#991B1B', bgColor: '#FEE2E2' },
  'hands-on':            { color: '#854F0B', bgColor: '#FAEEDA' },
  'youtube companion':   { color: '#991B1B', bgColor: '#FEE2E2' },
  'quick course':        { color: '#534AB7', bgColor: '#EEEDFE' },
};

const DEFAULT_TAG: TagStyle = { color: '#475569', bgColor: '#F1F5F9' };

export function getTagStyle(tag: string): TagStyle {
  return TAG_MAP[tag.toLowerCase()] || DEFAULT_TAG;
}

export const AVAILABLE_TAGS = [
  'Certification Prep',
  'Beginner Friendly',
  'Advanced',
  'Hands-On',
  'YouTube Companion',
  'Quick Course',
] as const;
