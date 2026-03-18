export interface CategoryStyle {
  icon: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  gradientColors: [string, string];
  barColor: string;
  cardBg: string;
}

// Card background tints by color family
const CB = {
  blue:   '#f8faff',
  purple: '#faf8ff',
  teal:   '#f5faf8',
  amber:  '#fffbf5',
  pink:   '#fdf5fa',
  slate:  '#f8f9fb',
  red:    '#fdf6f6',
  green:  '#f5faf8',
} as const;

function cs(icon: string, bgColor: string, textColor: string, g1: string, g2: string, cardBg: string = '#fafafa'): CategoryStyle {
  return { icon, bgColor, textColor, badgeBg: bgColor, badgeText: textColor, gradientColors: [g1, g2], barColor: g1, cardBg };
}

const CATEGORY_MAP: Record<string, CategoryStyle> = {
  // ─── Technology ───
  cybersecurity:            cs('shield-checkmark', '#E6F1FB', '#185FA5', '#3b82f6', '#1d4ed8', CB.blue),
  'cloud computing':        cs('cloud',            '#E0F2FE', '#0369A1', '#0ea5e9', '#0284c7', CB.blue),
  cloud_computing:          cs('cloud',            '#E0F2FE', '#0369A1', '#0ea5e9', '#0284c7', CB.blue),
  networking:               cs('globe',            '#FAEEDA', '#854F0B', '#f59e0b', '#d97706', CB.amber),
  'computer science':       cs('code-slash',       '#EEEDFE', '#534AB7', '#8b5cf6', '#6d28d9', CB.purple),
  computer_science:         cs('code-slash',       '#EEEDFE', '#534AB7', '#8b5cf6', '#6d28d9', CB.purple),
  'data science':           cs('bar-chart',        '#E0F2FE', '#0369A1', '#06b6d4', '#0891b2', CB.blue),
  data_science:             cs('bar-chart',        '#E0F2FE', '#0369A1', '#06b6d4', '#0891b2', CB.blue),
  'ai & machine learning':  cs('hardware-chip',    '#EEEDFE', '#534AB7', '#a855f7', '#9333ea', CB.purple),
  'ai_&_machine_learning':  cs('hardware-chip',    '#EEEDFE', '#534AB7', '#a855f7', '#9333ea', CB.purple),
  devops:                   cs('git-branch',       '#FEE2E2', '#991B1B', '#ef4444', '#dc2626', CB.red),

  // ─── Academic ───
  mathematics:              cs('calculator',       '#E1F5EE', '#0F6E56', '#0d9488', '#0f766e', CB.teal),
  physics:                  cs('planet',           '#E6F1FB', '#185FA5', '#6366f1', '#4f46e5', CB.blue),
  chemistry:                cs('flask',            '#FEF3C7', '#92400E', '#f59e0b', '#d97706', CB.amber),
  biology:                  cs('leaf',             '#E1F5EE', '#0F6E56', '#22c55e', '#15803d', CB.green),
  history:                  cs('time',             '#FAEEDA', '#854F0B', '#d97706', '#b45309', CB.amber),
  economics:                cs('trending-up',      '#E1F5EE', '#0F6E56', '#14b8a6', '#0d9488', CB.teal),
  science:                  cs('flask',            '#E6F1FB', '#185FA5', '#0d9488', '#0f766e', CB.blue),

  // ─── Professional ───
  business:                 cs('briefcase',        '#F1F5F9', '#475569', '#64748b', '#475569', CB.slate),
  marketing:                cs('megaphone',        '#FCE7F3', '#9D174D', '#ec4899', '#be185d', CB.pink),
  finance:                  cs('cash',             '#E1F5EE', '#0F6E56', '#10b981', '#059669', CB.green),
  'project management':     cs('clipboard',        '#FAEEDA', '#854F0B', '#f97316', '#ea580c', CB.amber),
  project_management:       cs('clipboard',        '#FAEEDA', '#854F0B', '#f97316', '#ea580c', CB.amber),
  leadership:               cs('people',           '#EDE9FE', '#5B21B6', '#7c3aed', '#6d28d9', CB.purple),

  // ─── Creative ───
  music:                    cs('musical-notes',    '#FCE7F3', '#9D174D', '#ec4899', '#db2777', CB.pink),
  design:                   cs('color-palette',    '#EEEDFE', '#534AB7', '#a855f7', '#7c3aed', CB.purple),
  photography:              cs('camera',           '#F1F5F9', '#475569', '#64748b', '#374151', CB.slate),
  writing:                  cs('pencil',           '#FEF3C7', '#92400E', '#eab308', '#ca8a04', CB.amber),

  // ─── Lifestyle ───
  languages:                cs('language',         '#E0F2FE', '#0369A1', '#0ea5e9', '#0284c7', CB.blue),
  'health & fitness':       cs('fitness',          '#FEE2E2', '#991B1B', '#f43f5e', '#e11d48', CB.red),
  'health_&_fitness':       cs('fitness',          '#FEE2E2', '#991B1B', '#f43f5e', '#e11d48', CB.red),
  cooking:                  cs('restaurant',       '#FEF3C7', '#92400E', '#f59e0b', '#d97706', CB.amber),

  // ─── Legacy aliases ───
  certification:            cs('shield-checkmark', '#E6F1FB', '#185FA5', '#3b82f6', '#1d4ed8', CB.blue),
  security:                 cs('shield-checkmark', '#E6F1FB', '#185FA5', '#3b82f6', '#1d4ed8', CB.blue),
  cloud:                    cs('cloud',            '#E0F2FE', '#0369A1', '#0ea5e9', '#0284c7', CB.blue),
  infrastructure:           cs('cloud',            '#E0F2FE', '#0369A1', '#0ea5e9', '#0284c7', CB.blue),
  coding:                   cs('code-slash',       '#EEEDFE', '#534AB7', '#8b5cf6', '#6d28d9', CB.purple),
  software:                 cs('code-slash',       '#EEEDFE', '#534AB7', '#8b5cf6', '#6d28d9', CB.purple),
  programming:              cs('code-slash',       '#EEEDFE', '#534AB7', '#8b5cf6', '#6d28d9', CB.purple),
  systems:                  cs('code-slash',       '#EEEDFE', '#534AB7', '#8b5cf6', '#6d28d9', CB.purple),
  academic:                 cs('flask',            '#E6F1FB', '#185FA5', '#0d9488', '#0f766e', CB.blue),
  math:                     cs('calculator',       '#E1F5EE', '#0F6E56', '#0d9488', '#0f766e', CB.teal),
  general_knowledge:        cs('book',             '#F1F5F9', '#64748b', '#64748b', '#475569', CB.slate),
  skills:                   cs('book',             '#F1F5F9', '#64748b', '#64748b', '#475569', CB.slate),

  // ─── Catch-all ───
  general:                  cs('book',             '#F1F5F9', '#64748b', '#64748b', '#475569', CB.slate),
};

const DEFAULT_STYLE: CategoryStyle = {
  icon: 'book',
  bgColor: '#F1F5F9',
  textColor: '#64748b',
  badgeBg: '#F1F5F9',
  badgeText: '#64748b',
  gradientColors: ['#64748b', '#475569'],
  barColor: '#64748b',
  cardBg: '#fafafa',
};

export function getCategoryStyle(category: string | undefined | null): CategoryStyle {
  if (!category) return DEFAULT_STYLE;
  const key = category.toLowerCase().replace(/\s+/g, '_');
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  // Also try with spaces (keys like 'cloud computing')
  const spaceKey = category.toLowerCase();
  if (CATEGORY_MAP[spaceKey]) return CATEGORY_MAP[spaceKey];
  // Partial match
  for (const [mapKey, style] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return style;
  }
  return DEFAULT_STYLE;
}

// Curated category list for the home screen icons row
export const CURATED_CATEGORIES = [
  'Cybersecurity',
  'Cloud Computing',
  'Computer Science',
  'AI & Machine Learning',
  'Mathematics',
  'Physics',
  'Business',
  'Marketing',
  'Music',
  'Design',
  'Languages',
  'Cooking',
] as const;

// Full grouped category list for the creator dropdown
export const CATEGORY_GROUPS = [
  {
    label: 'Technology',
    options: [
      { value: 'Cybersecurity', label: 'Cybersecurity' },
      { value: 'Cloud Computing', label: 'Cloud Computing' },
      { value: 'Networking', label: 'Networking' },
      { value: 'Computer Science', label: 'Computer Science' },
      { value: 'Data Science', label: 'Data Science' },
      { value: 'AI & Machine Learning', label: 'AI & Machine Learning' },
      { value: 'DevOps', label: 'DevOps' },
    ],
  },
  {
    label: 'Academic',
    options: [
      { value: 'Mathematics', label: 'Mathematics' },
      { value: 'Physics', label: 'Physics' },
      { value: 'Chemistry', label: 'Chemistry' },
      { value: 'Biology', label: 'Biology' },
      { value: 'History', label: 'History' },
      { value: 'Economics', label: 'Economics' },
      { value: 'Science', label: 'Science' },
    ],
  },
  {
    label: 'Professional',
    options: [
      { value: 'Business', label: 'Business' },
      { value: 'Marketing', label: 'Marketing' },
      { value: 'Finance', label: 'Finance' },
      { value: 'Project Management', label: 'Project Management' },
      { value: 'Leadership', label: 'Leadership' },
    ],
  },
  {
    label: 'Creative',
    options: [
      { value: 'Music', label: 'Music' },
      { value: 'Design', label: 'Design' },
      { value: 'Photography', label: 'Photography' },
      { value: 'Writing', label: 'Writing' },
    ],
  },
  {
    label: 'Lifestyle',
    options: [
      { value: 'Languages', label: 'Languages' },
      { value: 'Health & Fitness', label: 'Health & Fitness' },
      { value: 'Cooking', label: 'Cooking' },
    ],
  },
  {
    label: 'General',
    options: [
      { value: 'General', label: 'General' },
    ],
  },
] as const;

// Format raw category strings for display
const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  general_knowledge: 'General',
  certification: 'Certification',
  academic: 'Academic',
  cloud_computing: 'Cloud Computing',
  computer_science: 'Computer Science',
  data_science: 'Data Science',
  'ai_&_machine_learning': 'AI & ML',
  project_management: 'Project Management',
  'health_&_fitness': 'Health & Fitness',
};

export function formatCategoryName(category: string): string {
  if (!category) return '';
  const key = category.toLowerCase().replace(/\s+/g, '_');
  if (CATEGORY_DISPLAY_MAP[key]) return CATEGORY_DISPLAY_MAP[key];
  // Title case: replace underscores with spaces, capitalize each word
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const FEATURED_GRADIENTS: [string, string][] = [
  ['#3b82f6', '#1d4ed8'],
  ['#8b5cf6', '#6d28d9'],
  ['#0d9488', '#0f766e'],
  ['#f59e0b', '#d97706'],
  ['#ec4899', '#be185d'],
  ['#22c55e', '#15803d'],
];

export function getFeaturedGradient(index: number): [string, string] {
  return FEATURED_GRADIENTS[index % FEATURED_GRADIENTS.length];
}
