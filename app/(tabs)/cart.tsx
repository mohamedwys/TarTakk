import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';

export default function CartScreen() {
  const { config } = useEnv();

  return (
    <View style={styles.container}>
      <Ionicons name="cart-outline" size={64} color={config.theme.primary} />
      <Text style={[styles.title, { color: config.theme.textPrimary }]}>
        Your Cart
      </Text>
      <Text style={[styles.subtitle, { color: config.theme.textSecondary }]}>
        Coming soon — Shop Pro checkout will be available here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
