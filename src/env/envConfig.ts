import type { EnvConfig, EnvId, EnvTheme } from './envTypes';

const themeB2C: EnvTheme = {
  primary: '#1B4332',
  primaryDark: '#0F2A1F',
  accent: '#C9A24B',
  accentDark: '#A38336',
  background: '#F8F5F0',
  surface: '#FFFFFF',
  textPrimary: '#1B2818',
  textSecondary: '#5B6B5F',
  textInverse: '#FFFFFF',
  border: '#E5E0D5',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
};

const themeC2C: EnvTheme = {
  primary: '#E84855',
  primaryDark: '#C53847',
  accent: '#FFB800',
  accentDark: '#D69900',
  background: '#FFF9F0',
  surface: '#FFFFFF',
  textPrimary: '#2A1810',
  textSecondary: '#6B5747',
  textInverse: '#FFFFFF',
  border: '#F2E8D5',
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
