import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEnv } from '@/src/env';
import { spacing, shadow } from '@/src/design/tokens';
import { fontFamily } from '@/src/design/typography';
import { animationConfig } from '@/src/design/animations';

const CENTRAL_TAB_NAMES = ['create', 'cart'];

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { current, config } = useEnv();
  const theme = config.theme;

  const isMarketplace = current === 'marketplace_c2c';
  const isShopPro = current === 'b2c_pro';

  const visibleRoutes = state.routes.filter((route) => {
    if (route.name === 'create' && !isMarketplace) return false;
    if (route.name === 'cart' && !isShopPro) return false;
    return true;
  });

  const centralIndex = visibleRoutes.findIndex((r) => CENTRAL_TAB_NAMES.includes(r.name));

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: theme.surface }]}>
      <View style={styles.tabBar}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.indexOf(route);
          const isCentral = index === centralIndex;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          if (isCentral) {
            return (
              <CentralTab
                key={route.key}
                route={route}
                options={options}
                isFocused={isFocused}
                onPress={onPress}
                theme={theme}
              />
            );
          }

          return (
            <SideTab
              key={route.key}
              route={route}
              options={options}
              isFocused={isFocused}
              onPress={onPress}
              theme={theme}
            />
          );
        })}
      </View>
    </View>
  );
}

function SideTab({ route, options, isFocused, onPress, theme }: any) {
  const [pressed, setPressed] = React.useState(false);

  const TabBarIcon = options.tabBarIcon;
  const iconNode = TabBarIcon
    ? TabBarIcon({
        color: isFocused ? theme.primary : theme.textTertiary,
        size: 22,
        focused: isFocused,
      })
    : null;

  const label = options.tabBarLabel ?? options.title ?? route.name;
  const labelString = typeof label === 'string' ? label : route.name;

  return (
    <MotiView
      animate={{ scale: pressed ? 0.92 : 1 }}
      transition={animationConfig.press}
      style={styles.sideTabWrap}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={labelString}
        style={styles.sideTab}
      >
        <View style={styles.iconWrap}>
          {iconNode}
          {options.tabBarBadge ? (
            <View style={[styles.badge, { backgroundColor: theme.error }]}>
              <Text style={[styles.badgeText, { color: theme.textInverse }]}>
                {options.tabBarBadge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.sideTabLabel,
            {
              color: isFocused ? theme.primary : theme.textTertiary,
              fontFamily: isFocused ? fontFamily.semibold : fontFamily.medium,
            },
          ]}
          numberOfLines={1}
        >
          {labelString}
        </Text>
        {isFocused ? (
          <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
        ) : null}
      </Pressable>
    </MotiView>
  );
}

function CentralTab({ route, options, isFocused, onPress, theme }: any) {
  const [pressed, setPressed] = React.useState(false);
  const TabBarIcon = options.tabBarIcon;
  const iconNode = TabBarIcon
    ? TabBarIcon({ color: theme.textInverse, size: 26, focused: true })
    : null;
  const label = options.tabBarLabel ?? options.title ?? route.name;
  const labelString = typeof label === 'string' ? label : route.name;

  return (
    <View style={styles.centralTabWrap}>
      <MotiView
        animate={{ scale: pressed ? 0.92 : 1, translateY: pressed ? 2 : 0 }}
        transition={animationConfig.press}
      >
        <Pressable
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole="button"
          accessibilityState={{ selected: isFocused }}
          accessibilityLabel={labelString}
          style={[
            styles.centralButton,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
            },
            shadow.lg,
          ]}
        >
          {iconNode}
        </Pressable>
      </MotiView>
      <Text
        style={[
          styles.centralLabel,
          { color: theme.primary, fontFamily: fontFamily.semibold },
        ]}
        numberOfLines={1}
      >
        {labelString}
      </Text>
      {options.tabBarBadge ? (
        <View style={[styles.centralBadge, { backgroundColor: theme.error }]}>
          <Text style={[styles.badgeText, { color: theme.textInverse }]}>
            {options.tabBarBadge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const TAB_BAR_HEIGHT = 88;
const CENTRAL_BUTTON_SIZE = 56;

const styles = StyleSheet.create({
  tabBarContainer: {
    height: TAB_BAR_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: shadow.md,
      android: { elevation: 8 },
    }),
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: spacing.sm,
  },
  sideTabWrap: {
    flex: 1,
    alignItems: 'center',
  },
  sideTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    minHeight: 44,
    width: '100%',
  },
  iconWrap: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sideTabLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  centralTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: TAB_BAR_HEIGHT,
    position: 'relative',
  },
  centralButton: {
    width: CENTRAL_BUTTON_SIZE,
    height: CENTRAL_BUTTON_SIZE,
    borderRadius: CENTRAL_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centralLabel: {
    fontSize: 10,
    marginTop: 4,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  centralBadge: {
    position: 'absolute',
    top: 0,
    right: '30%',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
