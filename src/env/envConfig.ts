import type { EnvConfig, EnvId, EnvTheme } from './envTypes';

const themeB2C: EnvTheme = {
  primary: '#1F5A3F',
  primaryDark: '#154029',
  primaryHover: '#154029',
  primarySoft: '#E8F0EB',
  accent: '#C9A24B',
  accentDark: '#A38336',
  accentSoft: '#FFF8E5',
  background: '#F8F5EE',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EBE1',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#0F1F14',
  textSecondary: '#4A5A50',
  textTertiary: '#8A9590',
  textInverse: '#FFFFFF',
  border: '#E5DDD0',
  borderStrong: '#C8B89A',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
};

const themeC2C: EnvTheme = {
  primary: '#D63E48',
  primaryDark: '#B83139',
  primaryHover: '#B83139',
  primarySoft: '#FCE8EA',
  accent: '#E5A300',
  accentDark: '#C18800',
  accentSoft: '#FFF4D6',
  background: '#FAF7F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F5EFE3',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#1A0F0A',
  textSecondary: '#6B5747',
  textTertiary: '#A89484',
  textInverse: '#FFFFFF',
  border: '#EBE3D0',
  borderStrong: '#D4C4A8',
  success: '#16A34A',
  warning: '#E5A300',
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
