import React from 'react';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEnv } from '@/src/env';

export default function BecomeProSellerScreen() {
  const router = useRouter();
  const { config } = useEnv();

  const handleLearnMore = () => {
    // TODO Prompt 12: ouvrir le Web Pro Portal pour KYC
    Linking.openURL('https://tartakk.app/become-pro');
  };

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: config.theme.accent + '20' }]}>
        <Ionicons name="storefront" size={48} color={config.theme.accent} />
      </View>

      <Text style={[styles.title, { color: config.theme.textPrimary }]}>
        Devenez Vendeur Pro
      </Text>

      <Text style={[styles.subtitle, { color: config.theme.textSecondary }]}>
        Pour publier des produits dans le catalogue Shop Pro, vous devez avoir un compte vérifié de vendeur professionnel.
      </Text>

      <View style={styles.benefitsBox}>
        <BenefitRow icon="checkmark-circle" text="Accès au catalogue Shop Pro premium" />
        <BenefitRow icon="checkmark-circle" text="Stock multiple par produit" />
        <BenefitRow icon="checkmark-circle" text="Outils de vente avancés" />
        <BenefitRow icon="checkmark-circle" text="Tableau de bord vendeur" />
      </View>

      <Pressable
        style={[styles.primaryButton, { backgroundColor: config.theme.accent }]}
        onPress={handleLearnMore}
      >
        <Text style={[styles.primaryButtonText, { color: config.theme.textInverse }]}>
          Soumettre ma candidature
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={[styles.secondaryButtonText, { color: config.theme.textSecondary }]}>
          Plus tard
        </Text>
      </Pressable>
    </View>
  );
}

function BenefitRow({ icon, text }: { icon: string; text: string }) {
  const { config } = useEnv();
  return (
    <View style={styles.benefitRow}>
      <Ionicons name={icon as any} size={20} color={config.theme.success} />
      <Text style={[styles.benefitText, { color: config.theme.textPrimary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  benefitsBox: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
  },
});
