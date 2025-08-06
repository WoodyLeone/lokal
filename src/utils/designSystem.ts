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

// Enhanced Typography with better hierarchy
export const TypographyEnhanced = {
  ...Typography,
  display: {
    large: 48,
    medium: 36,
    small: 24,
  },
  body: {
    large: 18,
    medium: 16,
    small: 14,
  },
  caption: {
    large: 12,
    small: 10,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 6,
  md: 8,
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
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 18,
  },
} as const;

// Enhanced animations for better user feedback
export const Animations = {
  fadeIn: {
    opacity: [0, 1],
    duration: 300,
    easing: 'ease-out',
  },
  slideUp: {
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 400,
    easing: 'ease-out',
  },
  slideDown: {
    translateY: [-20, 0],
    opacity: [0, 1],
    duration: 400,
    easing: 'ease-out',
  },
  scale: {
    scale: [0.95, 1],
    duration: 200,
    easing: 'ease-out',
  },
  pulse: {
    scale: [1, 1.05, 1],
    duration: 1000,
    easing: 'ease-in-out',
  },
  bounce: {
    scale: [1, 1.1, 0.9, 1],
    duration: 600,
    easing: 'ease-in-out',
  },
  shake: {
    translateX: [0, -10, 10, -10, 10, 0],
    duration: 500,
    easing: 'ease-in-out',
  },
} as const;

// Gradient support for enhanced visual appeal
export const Gradients = {
  primary: ['#6366f1', '#8b5cf6'],
  success: ['#10b981', '#059669'],
  warning: ['#f59e0b', '#d97706'],
  error: ['#ef4444', '#dc2626'],
  background: ['#0f172a', '#1e293b'],
  surface: ['#1e293b', '#334155'],
  overlay: ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)'],
} as const;

// Loading skeleton styles for better perceived performance
export const SkeletonLoader = {
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    height: 120,
    marginBottom: Spacing.md,
  },
  text: {
    backgroundColor: Colors.surfaceLight,
    height: 16,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  button: {
    backgroundColor: Colors.surfaceLight,
    height: 48,
    borderRadius: BorderRadius.lg,
  },
  image: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    aspectRatio: 1,
  },
} as const;

// Icon system for consistency
export const Icons = {
  sizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  colors: {
    primary: Colors.primary,
    secondary: Colors.textSecondary,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    info: Colors.info,
  },
} as const;

// Touch targets for mobile optimization
export const TouchTargets = {
  minimum: 44,
  comfortable: 48,
  large: 56,
  spacing: 8, // Minimum spacing between touch targets
} as const;

// Safe areas for different devices
export const SafeAreas = {
  top: 44, // Status bar + navigation
  bottom: 34, // Home indicator
  left: 0,
  right: 0,
} as const;

// Breakpoint system for responsive design
export const Breakpoints = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
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
  
  // Enhanced Product Card Styles
  productCard: {
    container: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      marginBottom: Spacing.md,
      ...Shadows.md,
    },
    imageContainer: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: BorderRadius.lg,
    },
    priceBadge: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: Colors.success,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      ...Shadows.sm,
    },
    shoppableBadge: {
      position: 'absolute',
      top: Spacing.sm,
      left: Spacing.sm,
      backgroundColor: Colors.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      ...Shadows.sm,
    },
  },
  
  // Navigation Styles
  navigation: {
    container: {
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingBottom: SafeAreas.bottom,
      ...Shadows.lg,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      minHeight: TouchTargets.comfortable,
    },
    activeTab: {
      backgroundColor: Colors.primary + '20',
      borderRadius: BorderRadius.md,
    },
  },
  
  // Search Styles
  search: {
    container: {
      backgroundColor: Colors.surfaceLight,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      ...Shadows.sm,
    },
    input: {
      flex: 1,
      color: Colors.textPrimary,
      fontSize: Typography.base,
      marginLeft: Spacing.sm,
    },
    suggestions: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.xs,
      ...Shadows.md,
    },
  },
} as const;

// Theme-aware color functions
export const getThemeColor = (isDark: boolean = true) => ({
  background: isDark ? Colors.background : Colors.iosBackground,
  surface: isDark ? Colors.surface : Colors.iosSurface,
  text: isDark ? Colors.textPrimary : Colors.iosText,
  textSecondary: isDark ? Colors.textSecondary : Colors.iosTextSecondary,
  border: isDark ? Colors.border : Colors.iosBorder,
});

// Utility functions for responsive design
export const isMobile = (width: number) => width < Breakpoints.tablet;
export const isTablet = (width: number) => width >= Breakpoints.tablet && width < Breakpoints.desktop;
export const isDesktop = (width: number) => width >= Breakpoints.desktop;

// Animation utility functions
export const createAnimation = (type: keyof typeof Animations, delay: number = 0) => ({
  ...Animations[type],
  delay,
});

export const createStaggeredAnimation = (type: keyof typeof Animations, items: number, staggerDelay: number = 100) => {
  return Array.from({ length: items }, (_, index) => ({
    ...Animations[type],
    delay: index * staggerDelay,
  }));
};

// Gradient utility functions
export const getGradientColors = (type: keyof typeof Gradients) => Gradients[type];

// Skeleton loading utility
export const createSkeletonArray = (count: number, type: keyof typeof SkeletonLoader) => {
  return Array.from({ length: count }, () => SkeletonLoader[type]);
}; 