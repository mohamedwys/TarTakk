import type { EnvConfig, EnvId, EnvTheme } from './envTypes';

const themeB2C: EnvTheme = {
  primary: '#0B1F3A',
  primaryDark: '#061427',
  accent: '#C9A24B',
  accentDark: '#A38336',
  background: '#FFFFFF',
  surface: '#F5F7FA',
  textPrimary: '#0B1F3A',
  textSecondary: '#5C6B7A',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
};

const themeC2C: EnvTheme = {
  primary: '#4ECDC4',
  primaryDark: '#3BAFA8',
  accent: '#FF6B6B',
  accentDark: '#E55555',
  background: '#FFFFFF',
  surface: '#FFF8F3',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textInverse: '#FFFFFF',
  border: '#FFE0D6',
  success: '#16A34A',
  warning: '#FFB84D',
  error: '#FF6B6B',
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
