import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Status = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

type Props = {
  status: Status;
  variant?: 'mini' | 'full';
};

const STEPS: Status[] = ['pending', 'paid', 'shipped', 'delivered'];

export function OrderTimeline({ status, variant = 'full' }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;

  if (status === 'cancelled' || status === 'refunded') {
    return (
      <View style={styles.cancelledWrap}>
        <Ionicons
          name="close-circle"
          size={variant === 'mini' ? 16 : 20}
          color={theme.error}
        />
        <Text
          style={[
            variant === 'mini' ? typography.caption : typography.body,
            { color: theme.error, fontFamily: fontFamily.semibold },
          ]}
        >
          {t(`orders.status.${status}`)}
        </Text>
      </View>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  if (variant === 'mini') {
    return (
      <View style={styles.miniContainer}>
        {STEPS.map((step, idx) => (
          <React.Fragment key={step}>
            <View
              style={[
                styles.miniDot,
                {
                  backgroundColor: idx <= currentIndex ? theme.primary : theme.border,
                },
              ]}
            />
            {idx < STEPS.length - 1 && (
              <View
                style={[
                  styles.miniLine,
                  { backgroundColor: idx < currentIndex ? theme.primary : theme.border },
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={styles.fullRow}>
        {STEPS.map((step, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <React.Fragment key={step}>
              <View style={styles.fullStepWrap}>
                <MotiView
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  style={[
                    styles.fullDot,
                    {
                      backgroundColor: isActive ? theme.primary : theme.surfaceMuted,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {isActive && (
                    <Ionicons
                      name={isCurrent && idx < STEPS.length - 1 ? 'ellipse' : 'checkmark'}
                      size={isCurrent ? 8 : 14}
                      color={theme.textInverse}
                    />
                  )}
                </MotiView>
                <Text
                  style={[
                    styles.fullLabel,
                    typography.caption,
                    {
                      color: isActive ? theme.textPrimary : theme.textTertiary,
                      fontFamily: isActive ? fontFamily.semibold : fontFamily.medium,
                    },
                  ]}
                >
                  {t(`orders.timeline.${step}`)}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.fullLine,
                    { backgroundColor: idx < currentIndex ? theme.primary : theme.border },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  miniDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  miniLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
  },
  fullContainer: {
    paddingVertical: spacing.sm,
    width: '100%',
  },
  fullRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fullStepWrap: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 60,
  },
  fullDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullLabel: {
    textAlign: 'center',
    fontSize: 11,
  },
  fullLine: {
    flex: 1,
    height: 2,
    marginTop: 13,
    marginHorizontal: -8,
  },
  cancelledWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
