// Design System for Lokal UGC App
// Centralized design tokens for consistent UI/UX

export const Colors = {
  // Primary Colors
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Secondary Colors
  secondary: '#007AFF',
  secondaryLight: '#5ac8fa',
  secondaryDark: '#0056cc',
  
  // Background Colors
  background: '#0f172a',
  surface: '#1e293b',
  surfaceLight: '#334155',
  surfaceDark: '#0f172a',
  
  // Text Colors
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#000000',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Interactive Colors
  interactive: '#6366f1',
  interactivePressed: '#4f46e5',
  interactiveDisabled: '#374151',
  
  // Border Colors
  border: '#334155',
  borderLight: '#475569',
  borderDark: '#1e293b',
  
  // Overlay Colors
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.3)',
  
  // iOS System Colors
  iosBackground: '#ffffff',
  iosSurface: '#f2f2f7',
  iosBorder: '#c6c6c8',
  iosText: '#000000',
  iosTextSecondary: '#8e8e93',
} as const;

export const Typography = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Font Weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  
  // Line Heights
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const Animation = {
  // Duration
  fast: 150,
  normal: 300,
  slow: 500,
  
  // Easing
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;

// Component-specific styles
export const ComponentStyles = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.xl,
      ...Shadows.base,
    },
    secondary: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.xl,
    },
    disabled: {
      backgroundColor: Colors.interactiveDisabled,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.xl,
    },
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.base,
  },
  
  // Input Styles
  input: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  
  // Modal Styles
  modal: {
    overlay: {
      backgroundColor: Colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      margin: Spacing.lg,
      maxWidth: '90%',
      ...Shadows.xl,
    },
  },
} as const;

// Helper functions
export const createStyleSheet = (styles: any) => styles;

export const getResponsiveValue = (mobile: number, tablet: number, desktop: number) => {
  // This would be implemented with actual responsive logic
  return mobile;
};

// Theme-aware color functions
export const getThemeColor = (isDark: boolean = true) => ({
  background: isDark ? Colors.background : Colors.iosBackground,
  surface: isDark ? Colors.surface : Colors.iosSurface,
  text: isDark ? Colors.textPrimary : Colors.iosText,
  textSecondary: isDark ? Colors.textSecondary : Colors.iosTextSecondary,
  border: isDark ? Colors.border : Colors.iosBorder,
}); 