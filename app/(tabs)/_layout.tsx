import AnimatedTabIcon from '@/components/AnimatedTabIcon';
import { BadgePulse } from '@/components/BadgeBounce';
import { useUnreadCount } from '@/contexts/UnreadCountContext';
import { useCart } from '@/src/cart';
import { EnvSwitcher } from '@/src/components/env/EnvSwitcher';
import { CustomTabBar } from '@/src/components/tabs/CustomTabBar';
import { useEnv } from '@/src/env';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { totalUnreadCount } = useUnreadCount();
  const { totalItems } = useCart();
  const { config, current } = useEnv();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (current === 'b2c_pro' && pathname === '/create') {
      router.replace('/(tabs)');
    }
    if (current === 'marketplace_c2c' && pathname === '/cart') {
      router.replace('/(tabs)');
    }
  }, [current, pathname, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
          <EnvSwitcher />
        </SafeAreaView>
        <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: config.theme.primary,
          tabBarInactiveTintColor: '#B2BEC3',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            height: 90,
            paddingBottom: 30,
            paddingTop: 10,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                name={focused ? 'home' : 'home-outline'}
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t('tabs.explore'),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                name={focused ? 'search' : 'search-outline'}
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: t('tabs.sell'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add" size={28} color={color} />
            ),
            tabBarLabel: t('tabs.sell'),
            href: current === 'marketplace_c2c' ? '/(tabs)/create' : null,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: t('tabs.cart'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" size={size} color={color} />
            ),
            href: current === 'b2c_pro' ? '/(tabs)/cart' : null,
            tabBarBadge: totalItems > 0 ? totalItems : undefined,
            tabBarBadgeStyle: {
              backgroundColor: config.theme.error,
              color: '#FFFFFF',
              fontSize: 10,
              minWidth: 18,
              height: 18,
            },
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('tabs.messages'),
            tabBarIcon: ({ color, size, focused }) => (
              <View>
                <AnimatedTabIcon
                  name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                  color={color}
                  size={size}
                  focused={focused}
                />
                {totalUnreadCount > 0 && (
                  <BadgePulse>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </Text>
                    </View>
                  </BadgePulse>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon
                name={focused ? 'person' : 'person-outline'}
                color={color}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});