export const CATEGORY_COLORS: Record<string, string> = {
  // STEM
  'Mathematics': '#2563EB',
  'Physics': '#DC2626',
  'Chemistry': '#7C3AED',
  'Biology': '#059669',
  'Computer Science': '#0891B2',
  'Engineering': '#D97706',
  'Data Science & Statistics': '#4F46E5',
  'Environmental Science': '#16A34A',
  // Technology
  'Cybersecurity': '#1D4ED8',
  'Cloud Computing': '#0284C7',
  'Software Development': '#6D28D9',
  'Networking & IT': '#0E7490',
  'AI & Machine Learning': '#7C3AED',
  // Business
  'Business & Management': '#1E40AF',
  'Finance & Accounting': '#047857',
  'Marketing': '#DB2777',
  'Project Management': '#4338CA',
  'Entrepreneurship': '#B45309',
  // Humanities
  'History': '#92400E',
  'Philosophy': '#6B21A8',
  'Psychology': '#BE185D',
  'Political Science': '#1E3A5F',
  'Economics': '#065F46',
  'Sociology': '#9333EA',
  // Creative
  'Music': '#E11D48',
  'Visual Arts': '#F59E0B',
  'Film & Media': '#8B5CF6',
  'Writing & Literature': '#6D28D9',
  'Design': '#EC4899',
  // Health
  'Medicine & Health Sciences': '#DC2626',
  'Nursing': '#E11D48',
  'Nutrition & Fitness': '#16A34A',
  'Mental Health': '#7C3AED',
  // Practical
  'Cooking': '#EA580C',
  'Photography': '#4F46E5',
  'Personal Finance': '#059669',
  // Testing
  'Standardized Tests': '#1D4ED8',
  // Default
  'General': '#6B7280',
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#3b82f6'
}
