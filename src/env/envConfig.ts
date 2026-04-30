import type { EnvConfig, EnvId, EnvTheme } from './envTypes';

const themeB2C: EnvTheme = {
  primary: '#00875A',
  primaryDark: '#00633F',
  primaryHover: '#00633F',
  primarySoft: '#DAF2E8',
  accent: '#D4A24C',
  accentDark: '#B89348',
  accentSoft: '#FBF1DE',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F4F1',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#0F1419',
  textSecondary: '#4A5560',
  textTertiary: '#8A95A0',
  textInverse: '#FFFFFF',
  border: '#E8EAEC',
  borderStrong: '#C4CBD0',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
};

const themeC2C: EnvTheme = {
  primary: '#FF3B47',
  primaryDark: '#E02030',
  primaryHover: '#E02030',
  primarySoft: '#FFE5E7',
  accent: '#FFB800',
  accentDark: '#E5A300',
  accentSoft: '#FFF4D6',
  background: '#FFFAF5',
  surface: '#FFFFFF',
  surfaceMuted: '#FFF5EB',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1A0E0E',
  textSecondary: '#5C4A4A',
  textTertiary: '#94807F',
  textInverse: '#FFFFFF',
  border: '#FFE5DD',
  borderStrong: '#FFC2B0',
  success: '#16A34A',
  warning: '#FFB800',
  error: '#DC2626',
};

export const ENV_CONFIGS: readonly EnvConfig[] = [
  {
    id: 'b2c_pro',
    labelKey: 'env.b2cPro.label',
    fallbackLabelEn: 'Shop Pro',
    fallbackLabelFr: 'Boutique Pro',
    fallbackLabelAr: 'متجر محترف',
    iconName: 'storefront-outline',
    theme: themeB2C,
    listingTypeFilter: 'B2C',
    hasCart: true,
    hasCheckout: true,
    publishRole: 'pro_only',
    ctaProductLabel: 'add_to_cart',
  },
  {
    id: 'marketplace_c2c',
    labelKey: 'env.marketplace.label',
    fallbackLabelEn: 'Marketplace',
    fallbackLabelFr: 'Marketplace',
    fallbackLabelAr: 'سوق',
    iconName: 'people-outline',
    theme: themeC2C,
    listingTypeFilter: 'C2C',
    hasCart: false,
    hasCheckout: false,
    publishRole: 'open',
    ctaProductLabel: 'message_seller',
  },
] as const;

export const DEFAULT_ENV: EnvId = 'marketplace_c2c';

export function getEnvConfig(id: EnvId): EnvConfig {
  const found = ENV_CONFIGS.find((e) => e.id === id);
  if (!found) {
    throw new Error('Unknown env id: ' + id);
  }
  return found;
}
