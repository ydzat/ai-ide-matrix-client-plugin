// Theme System
// Defines light and dark themes using design tokens

import { tokens } from './tokens.js';

// Light theme
export const lightTheme = {
  name: 'light',
  colors: {
    // Background colors
    background: {
      primary: tokens.colors.gray[50],
      secondary: tokens.colors.gray[100],
      tertiary: tokens.colors.gray[200],
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },

    // Text colors
    text: {
      primary: tokens.colors.gray[900],
      secondary: tokens.colors.gray[600],
      tertiary: tokens.colors.gray[500],
      inverse: '#ffffff',
      link: tokens.colors.primary[600],
      linkHover: tokens.colors.primary[700]
    },

    // Border colors
    border: {
      primary: tokens.colors.gray[200],
      secondary: tokens.colors.gray[300],
      focus: tokens.colors.primary[500],
      error: tokens.colors.error[500]
    },

    // Interactive colors
    interactive: {
      primary: tokens.colors.primary[600],
      primaryHover: tokens.colors.primary[700],
      primaryActive: tokens.colors.primary[800],
      secondary: tokens.colors.gray[100],
      secondaryHover: tokens.colors.gray[200],
      secondaryActive: tokens.colors.gray[300]
    },

    // Status colors
    status: {
      success: tokens.colors.success[600],
      successBg: tokens.colors.success[50],
      error: tokens.colors.error[600],
      errorBg: tokens.colors.error[50],
      warning: tokens.colors.warning[600],
      warningBg: tokens.colors.warning[50],
      info: tokens.colors.primary[600],
      infoBg: tokens.colors.primary[50]
    },

    // Matrix-specific colors
    matrix: {
      online: tokens.colors.success[500],
      away: tokens.colors.warning[500],
      offline: tokens.colors.gray[400],
      encrypted: tokens.colors.success[600],
      unverified: tokens.colors.warning[600],
      blocked: tokens.colors.error[600]
    }
  }
};

// Dark theme
export const darkTheme = {
  name: 'dark',
  colors: {
    // Background colors
    background: {
      primary: tokens.colors.gray[950],
      secondary: tokens.colors.gray[900],
      tertiary: tokens.colors.gray[800],
      elevated: tokens.colors.gray[800],
      overlay: 'rgba(0, 0, 0, 0.7)'
    },

    // Text colors
    text: {
      primary: tokens.colors.gray[50],
      secondary: tokens.colors.gray[300],
      tertiary: tokens.colors.gray[400],
      inverse: tokens.colors.gray[900],
      link: tokens.colors.primary[400],
      linkHover: tokens.colors.primary[300]
    },

    // Border colors
    border: {
      primary: tokens.colors.gray[700],
      secondary: tokens.colors.gray[600],
      focus: tokens.colors.primary[500],
      error: tokens.colors.error[500]
    },

    // Interactive colors
    interactive: {
      primary: tokens.colors.primary[500],
      primaryHover: tokens.colors.primary[400],
      primaryActive: tokens.colors.primary[600],
      secondary: tokens.colors.gray[700],
      secondaryHover: tokens.colors.gray[600],
      secondaryActive: tokens.colors.gray[500]
    },

    // Status colors
    status: {
      success: tokens.colors.success[400],
      successBg: tokens.colors.success[950],
      error: tokens.colors.error[400],
      errorBg: tokens.colors.error[950],
      warning: tokens.colors.warning[400],
      warningBg: tokens.colors.warning[950],
      info: tokens.colors.primary[400],
      infoBg: tokens.colors.primary[950]
    },

    // Matrix-specific colors
    matrix: {
      online: tokens.colors.success[400],
      away: tokens.colors.warning[400],
      offline: tokens.colors.gray[500],
      encrypted: tokens.colors.success[400],
      unverified: tokens.colors.warning[400],
      blocked: tokens.colors.error[400]
    }
  }
};

// Theme utilities
export const themes = {
  light: lightTheme,
  dark: darkTheme
};

// Get theme by name
export function getTheme(themeName = 'dark') {
  return themes[themeName] || themes.dark;
}

// Apply theme to CSS custom properties
export function applyTheme(theme) {
  const root = document.documentElement;

  // Apply background colors
  root.style.setProperty('--bg-primary', theme.colors.background.primary);
  root.style.setProperty('--bg-secondary', theme.colors.background.secondary);
  root.style.setProperty('--bg-tertiary', theme.colors.background.tertiary);
  root.style.setProperty('--bg-elevated', theme.colors.background.elevated);
  root.style.setProperty('--bg-overlay', theme.colors.background.overlay);

  // Apply text colors
  root.style.setProperty('--text-primary', theme.colors.text.primary);
  root.style.setProperty('--text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--text-tertiary', theme.colors.text.tertiary);
  root.style.setProperty('--text-inverse', theme.colors.text.inverse);
  root.style.setProperty('--text-link', theme.colors.text.link);
  root.style.setProperty('--text-link-hover', theme.colors.text.linkHover);

  // Apply border colors
  root.style.setProperty('--border-primary', theme.colors.border.primary);
  root.style.setProperty('--border-secondary', theme.colors.border.secondary);
  root.style.setProperty('--border-focus', theme.colors.border.focus);
  root.style.setProperty('--border-error', theme.colors.border.error);

  // Apply interactive colors
  root.style.setProperty('--interactive-primary', theme.colors.interactive.primary);
  root.style.setProperty('--interactive-primary-hover', theme.colors.interactive.primaryHover);
  root.style.setProperty('--interactive-primary-active', theme.colors.interactive.primaryActive);
  root.style.setProperty('--interactive-secondary', theme.colors.interactive.secondary);
  root.style.setProperty('--interactive-secondary-hover', theme.colors.interactive.secondaryHover);
  root.style.setProperty('--interactive-secondary-active', theme.colors.interactive.secondaryActive);

  // Apply status colors
  root.style.setProperty('--status-success', theme.colors.status.success);
  root.style.setProperty('--status-success-bg', theme.colors.status.successBg);
  root.style.setProperty('--status-error', theme.colors.status.error);
  root.style.setProperty('--status-error-bg', theme.colors.status.errorBg);
  root.style.setProperty('--status-warning', theme.colors.status.warning);
  root.style.setProperty('--status-warning-bg', theme.colors.status.warningBg);
  root.style.setProperty('--status-info', theme.colors.status.info);
  root.style.setProperty('--status-info-bg', theme.colors.status.infoBg);

  // Apply Matrix-specific colors
  root.style.setProperty('--matrix-online', theme.colors.matrix.online);
  root.style.setProperty('--matrix-away', theme.colors.matrix.away);
  root.style.setProperty('--matrix-offline', theme.colors.matrix.offline);
  root.style.setProperty('--matrix-encrypted', theme.colors.matrix.encrypted);
  root.style.setProperty('--matrix-unverified', theme.colors.matrix.unverified);
  root.style.setProperty('--matrix-blocked', theme.colors.matrix.blocked);
}

// Auto-detect system theme preference
export function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default fallback
}

// Theme manager class
export class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.listeners = new Set();

    // Listen for system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    }
  }

  setTheme(themeName) {
    const theme = getTheme(themeName);
    this.currentTheme = themeName;
    applyTheme(theme);

    // Notify listeners
    this.listeners.forEach(listener => listener(themeName, theme));

    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('matrix-client-theme', themeName);
    }
  }

  getTheme() {
    return this.currentTheme;
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  handleSystemThemeChange(event) {
    const systemTheme = event.matches ? 'dark' : 'light';
    this.setTheme(systemTheme);
  }

  initialize() {
    // Load saved theme or use system preference
    let savedTheme = 'dark';

    if (typeof localStorage !== 'undefined') {
      savedTheme = localStorage.getItem('matrix-client-theme') || getSystemTheme();
    }

    this.setTheme(savedTheme);
  }
}

// Global theme manager instance
export const themeManager = new ThemeManager();

export default {
  tokens,
  themes,
  getTheme,
  applyTheme,
  getSystemTheme,
  ThemeManager,
  themeManager
};