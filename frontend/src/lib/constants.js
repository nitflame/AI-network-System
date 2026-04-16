export const ZONES = ['Hostel', 'Library', 'Cafeteria', 'Academic_Block', 'Stadium'];

export const ZONE_INFO = {
  Hostel: { label: 'Hostel', icon: 'Building2', color: '#8B5CF6', factor: 1.2 },
  Library: { label: 'Library', icon: 'BookOpen', color: '#06B6D4', factor: 0.8 },
  Cafeteria: { label: 'Cafeteria', icon: 'Coffee', color: '#F59E0B', factor: 1.0 },
  Academic_Block: { label: 'Academic Block', icon: 'GraduationCap', color: '#3B82F6', factor: 0.9 },
  Stadium: { label: 'Stadium', icon: 'Trophy', color: '#EF4444', factor: 1.5 },
};

export const CONGESTION_COLORS = {
  HIGH: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' },
  MEDIUM: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' },
  LOW: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' },
};

export const PRIORITY_COLORS = {
  HIGH: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', label: 'Critical' },
  MEDIUM: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', label: 'Standard' },
  LOW: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', label: 'Best Effort' },
};
