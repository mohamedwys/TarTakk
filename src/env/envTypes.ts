export type EnvId = 'b2c_pro' | 'marketplace_c2c';

export type EnvTheme = {
  primary: string;
  primaryDark: string;
  primaryHover: string;
  primarySoft: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  success: string;
  warning: string;
  error: string;
};

export type EnvConfig = {
  id: EnvId;
  labelKey: string;
  fallbackLabelEn: string;
  fallbackLabelFr: string;
  fallbackLabelAr: string;
  iconName: string;
  theme: EnvTheme;
  listingTypeFilter: 'B2B' | 'B2C' | 'C2C';
  hasCart: boolean;
  hasCheckout: boolean;
  publishRole: 'pro_only' | 'open';
  ctaProductLabel: 'add_to_cart' | 'message_seller';
};

export type EnvContextValue = {
  current: EnvId;
  config: EnvConfig;
  allEnvs: readonly EnvConfig[];
  setEnv: (id: EnvId) => Promise<void>;
  isLoading: boolean;
};
