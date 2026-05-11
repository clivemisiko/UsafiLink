/**
 * Global Theme Utilities - UsafiLink Design System
 * Centralized color and styling constants for consistent theming across the app
 */

export const theme = {
  // Primary Colors
  colors: {
    ink: '#1a1a18',
    parchment: '#f5f0e8',
    cream: '#faf7f2',
    white: '#ffffff',
    
    // Accent Colors
    sage: '#4a7c59',
    sageLighter: '#6a9e79',
    sageMuted: '#d4e6da',
    sand: '#e8d5b0',
    rust: '#c4622d',
    stone: '#8a8475',
  },

  // Semantic Color Usage
  semantic: {
    success: '#4a7c59', // sage
    successLight: '#6a9e79', // sage-light
    successMuted: '#d4e6da', // sage-muted
    warning: '#e8d5b0', // sand
    error: '#c4622d', // rust
    info: '#6a9e79', // sage-light
    
    textPrimary: '#1a1a18', // ink
    textSecondary: '#8a8475', // stone
    textMuted: 'rgba(26, 26, 24, 0.6)',
    
    bgPrimary: '#f5f0e8', // parchment
    bgSecondary: '#faf7f2', // cream
    bgTertiary: '#ffffff', // white
    
    borderLight: 'rgba(26, 26, 24, 0.08)',
    borderLighter: 'rgba(26, 26, 24, 0.05)',
  },

  // Gradients
  gradients: {
    sageGradient: 'linear-gradient(135deg, #4a7c59 0%, #3a6347 100%)',
    warmGradient: 'linear-gradient(135deg, #c4622d 0%, #a84d1f 100%)',
    coolGradient: 'radial-gradient(ellipse 80% 60% at 10% 0%, rgba(74,124,89,0.07) 0%, transparent 60%)',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(26, 26, 24, 0.05)',
    md: '0 4px 6px -1px rgba(26, 26, 24, 0.08)',
    lg: '0 10px 15px -3px rgba(26, 26, 24, 0.1)',
    xl: '0 20px 25px -5px rgba(26, 26, 24, 0.12)',
  },

  // Border Radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  // Typography
  fonts: {
    sans: "'DM Sans', 'Inter', sans-serif",
    serif: "'Playfair Display', Georgia, serif",
  },

  // Spacing (in rem)
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '2.5rem',
    xxl: '3rem',
  },
};

/**
 * Style helper functions
 */
export const styleHelpers = {
  // Get CSS variable string
  getVar: (colorKey) => `var(--${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()})`,

  // Create a button style object
  buttonStyle: (variant = 'primary') => {
    const styles = {
      primary: {
        backgroundColor: theme.colors.sage,
        color: theme.colors.white,
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem 1rem',
        borderRadius: theme.radius.md,
        fontWeight: '600',
        fontSize: '0.875rem',
        transition: 'all 0.2s ease',
      },
      secondary: {
        backgroundColor: theme.colors.cream,
        color: theme.colors.ink,
        border: `1px solid ${theme.semantic.borderLight}`,
        cursor: 'pointer',
        padding: '0.5rem 1rem',
        borderRadius: theme.radius.md,
        fontWeight: '600',
        fontSize: '0.875rem',
        transition: 'all 0.2s ease',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: theme.colors.sage,
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem 1rem',
        borderRadius: theme.radius.md,
        fontWeight: '600',
        fontSize: '0.875rem',
        transition: 'all 0.2s ease',
      },
    };
    return styles[variant] || styles.primary;
  },

  // Create a card style object
  cardStyle: (elevated = false) => ({
    backgroundColor: theme.colors.white,
    border: `1px solid ${theme.semantic.borderLight}`,
    borderRadius: theme.radius.lg,
    boxShadow: elevated ? theme.shadows.md : theme.shadows.sm,
    padding: '1.5rem',
  }),

  // Create a badge style object
  badgeStyle: (type = 'success') => {
    const styles = {
      success: {
        backgroundColor: theme.colors.sageMuted,
        color: theme.colors.sage,
        padding: '0.25rem 0.75rem',
        borderRadius: theme.radius.full,
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      },
      warning: {
        backgroundColor: 'rgba(232, 213, 176, 0.3)',
        color: theme.colors.sand,
        padding: '0.25rem 0.75rem',
        borderRadius: theme.radius.full,
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      },
      error: {
        backgroundColor: 'rgba(196, 98, 45, 0.1)',
        color: theme.colors.rust,
        padding: '0.25rem 0.75rem',
        borderRadius: theme.radius.full,
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      },
    };
    return styles[type] || styles.success;
  },
};

export default theme;
