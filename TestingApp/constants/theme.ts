/**
 * App color palette. Use these constants instead of hardcoded hex/rgba.
 * Access via: Colors[colorScheme ?? 'light'] or Colors.dark
 * EduSky approved palette: Primary Blue, Sky Cyan, Emerald, Warm Orange, Bright Orange, Deep Navy.
 */

import { Platform } from 'react-native';

/** EduSky approved palette */
const PrimaryBlue = '#1A73E8';
const SkyCyan = '#00B4D8';
const EmeraldGreen = '#10B981';
const WarmOrange = '#F6A500';
const BrightOrange = '#FF6F00';
const DeepNavy = '#0D2C54';

const tintColorLight = PrimaryBlue;
const tintColorDark = SkyCyan;

/** Semantic colors shared across light/dark (no theme variant) */
export const SemanticColors = {
  /** Success / correct (Emerald Green – growth, success) */
  success: EmeraldGreen,
  successDark: '#0d9668',
  successLight: '#d1fae5',
  /** Error / wrong (red) */
  error: '#f44336',
  errorDark: '#d32f2f',
  errorLight: '#ffebee',
  errorText: '#c62828',
  /** Urgent / warning / motivation (Warm Orange) */
  warning: WarmOrange,
  /** CTA and primary action buttons (Bright Orange) */
  cta: BrightOrange,
  /** Accent – education, modernity (Sky Cyan) */
  accent: SkyCyan,
  /** Text on tint/primary buttons */
  onTint: '#fff',
  /** Shadow color */
  shadow: '#000',
  shadowRgba10: 'rgba(0, 0, 0, 0.1)',
  /** Overlay (modals, backdrops) */
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayStrong: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  /** Leaderboard ranks */
  rankGold: '#FFD700',
  rankSilver: '#C0C0C0',
  rankBronze: '#CD7F32',
  /** Social (optional) */
  socialFacebook: '#1877F2',
  socialTwitter: '#1DA1F2',
  /** Modal header border */
  borderModal: 'rgba(128, 128, 128, 0.2)',
  /** Error with alpha (e.g. backgrounds) */
  errorAlpha20: '#f4433620',
  errorShadowRgba: 'rgba(244, 67, 54, 0.1)',
  /** Success with alpha */
  successAlpha20: '#10B98120',
  /** White with alpha (e.g. on tint) */
  onTintAlpha20: 'rgba(255, 255, 255, 0.2)',
  onTintAlpha70: 'rgba(255, 255, 255, 0.7)',
};

export const Colors = {
  light: {
    text: DeepNavy,
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    /** Card/surface background */
    card: '#ffffff',
    /** Input, secondary surface */
    input: '#f5f5f5',
    /** Slightly darker surface (e.g. modals) */
    surface: '#f8f9fa',
    /** Border subtle */
    border: 'rgba(0, 0, 0, 0.1)',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    /** Tab bar */
    tabBar: '#fff',
    /** Error banner bg */
    errorBg: '#fff5f5',
    errorBorder: '#f4433620',
    /** Strong border (e.g. header) */
    borderStrong: '#E5E5E5',
    /** Other user message bubble */
    bubbleOther: '#FFFFFF',
    surfaceDarker: '#F8F9FA',
    ...SemanticColors,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1a1a1a',
    input: '#2a2a2a',
    surface: '#1a1a1a',
    /** Darker surface (e.g. chat container) */
    surfaceDarker: '#0F0F0F',
    border: 'rgba(255, 255, 255, 0.1)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    tabBar: '#151718',
    errorBg: '#2a1a1a',
    errorBorder: '#f4433620',
    borderStrong: '#2A2A2A',
    bubbleOther: '#1F1F1F',
    ...SemanticColors,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
