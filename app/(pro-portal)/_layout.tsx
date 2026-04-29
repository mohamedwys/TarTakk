import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import { BlockMobileWrapper } from '@/src/components/ProPortal/BlockMobile';

export default function ProPortalLayout() {
  return (
    <BlockMobileWrapper>
      <View style={styles.container}>
        <ProPortalHeader />
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          />
        </View>
      </View>
    </BlockMobileWrapper>
  );
}

function ProPortalHeader() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoggedIn = !!user?._id;
  const isProAccount = user?.accountType === 'B2C' || user?.accountType === 'B2B';

  const navItems =
    isLoggedIn && isProAccount
      ? ([
          {
            key: 'dashboard',
            label: t('proPortal.nav.dashboard'),
            path: '/(pro-portal)/dashboard',
            icon: 'speedometer-outline',
          },
          {
            key: 'products',
            label: t('proPortal.nav.products'),
            path: '/(pro-portal)/products',
            icon: 'cube-outline',
          },
          {
            key: 'orders',
            label: t('proPortal.nav.orders'),
            path: '/(pro-portal)/orders',
            icon: 'receipt-outline',
          },
        ] as const)
      : [];

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: config.theme.surface, borderBottomColor: config.theme.border },
      ]}
    >
      <View style={styles.headerLeft}>
        <Text style={[styles.logo, { color: config.theme.primary }]}>Tartakk Pro</Text>
      </View>

      {isLoggedIn && isProAccount ? (
        <View style={styles.headerNav}>
          {navItems.map((item) => {
            const isActive = pathname.includes(item.key);
            return (
              <Pressable
                key={item.key}
                style={[
                  styles.navItem,
                  isActive && { backgroundColor: config.theme.primary + '15' },
                ]}
                onPress={() => router.push(item.path as never)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isActive ? config.theme.primary : config.theme.textSecondary}
                />
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: isActive ? config.theme.primary : config.theme.textSecondary,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.headerRight}>
        {isLoggedIn ? (
          <Pressable
            style={[styles.logoutButton, { borderColor: config.theme.border }]}
            onPress={async () => {
              await logout();
              router.replace('/(pro-portal)/login' as never);
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={config.theme.error} />
            <Text style={[styles.logoutText, { color: config.theme.error }]}>
              {t('proPortal.nav.logout')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  headerLeft: { flex: 0 },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerNav: { flexDirection: 'row', gap: 4, flex: 1, justifyContent: 'center' },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navLabel: { fontSize: 14, fontWeight: '600' },
  headerRight: { flex: 0 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: { fontSize: 13, fontWeight: '600' },
  content: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
});
