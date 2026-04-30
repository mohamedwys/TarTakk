import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useEnv } from '@/src/env';
import { Button } from '@/src/components/ui';
import { spacing, radius, shadow } from '@/src/design/tokens';
import { fontFamily } from '@/src/design/typography';

type NavItem = {
  key: string;
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function ProHeader() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = config.theme;

  const isLoggedIn = !!user?._id;
  const isProAccount = user?.accountType === 'B2C' || user?.accountType === 'B2B';

  const navItems: NavItem[] =
    isLoggedIn && isProAccount
      ? [
          {
            key: 'dashboard',
            label: t('proPortal.nav.dashboard'),
            path: '/pro-portal/dashboard',
            icon: 'speedometer-outline',
          },
          {
            key: 'products',
            label: t('proPortal.nav.products'),
            path: '/pro-portal/products',
            icon: 'cube-outline',
          },
          {
            key: 'orders',
            label: t('proPortal.nav.orders'),
            path: '/pro-portal/orders',
            icon: 'receipt-outline',
          },
        ]
      : [];

  const handleLogout = async () => {
    await logout();
    router.replace({ pathname: '/pro-portal/login' } as any);
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
        shadow.sm,
      ]}
    >
      <View style={styles.headerInner}>
        <Pressable
          onPress={() => router.push({ pathname: '/pro-portal' } as any)}
          style={styles.logoWrap}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.logoText,
              { color: theme.primary, fontFamily: fontFamily.extrabold },
            ]}
          >
            Tartakk Pro
          </Text>
        </Pressable>

        {isLoggedIn && isProAccount && (
          <View style={styles.nav}>
            {navItems.map((item) => {
              const isActive = pathname.includes(item.key);
              return (
                <Pressable
                  key={item.key}
                  onPress={() => router.push({ pathname: item.path } as any)}
                  style={[
                    styles.navItem,
                    isActive && { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.navLabel,
                      {
                        color: isActive ? theme.primary : theme.textSecondary,
                        fontFamily: fontFamily.semibold,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.rightSide}>
          {isLoggedIn ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft="log-out-outline"
              onPress={handleLogout}
            >
              {t('proPortal.nav.logout')}
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    minHeight: 56,
    gap: spacing.md,
  },
  logoWrap: {
    flexShrink: 0,
  },
  logoText: {
    fontSize: 22,
    letterSpacing: -0.5,
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as any) : null),
  },
  nav: {
    flexDirection: 'row',
    gap: spacing.xxs,
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    minHeight: 36,
  },
  navLabel: {
    fontSize: 14,
  },
  rightSide: {
    flexShrink: 0,
  },
});
