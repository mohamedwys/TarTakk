import i18n from '@/src/i18n';

const I18N_TO_INTL_LOCALE: Record<string, string> = {
  fr: 'fr-MA',
  ar: 'ar-MA',
  en: 'en-MA',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  MAD: 'MAD',
  EUR: '€',
  USD: '$',
  AED: 'AED',
  GBP: '£',
};

export function formatPrice(amount: number, currency: string = 'MAD'): string {
  const lang = i18n.language || 'fr';
  const intlLocale = I18N_TO_INTL_LOCALE[lang] || 'fr-MA';

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${amount.toLocaleString('fr-MA')} ${symbol}`;
  }
}

export function formatNumber(value: number): string {
  const lang = i18n.language || 'fr';
  const intlLocale = I18N_TO_INTL_LOCALE[lang] || 'fr-MA';
  return new Intl.NumberFormat(intlLocale).format(value);
}
