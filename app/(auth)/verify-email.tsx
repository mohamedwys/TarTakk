import AnimatedButton from "@/components/AnimatedButton";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// Magic-link confirmation flow.
// Supabase emails the user a confirmation link; clicking it activates the
// auth user. There is no 6-digit OTP step, so this screen is purely
// informational + a "resend" button.

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [userEmail, setUserEmail] = useState(params?.email ?? "");
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userEmail) return;

    const loadUserEmail = async () => {
      try {
        // Fall back to whatever the register screen wrote before
        // navigating, so the user still sees their address even if the
        // route param wasn't passed.
        const pendingEmail = await AsyncStorage.getItem("pendingEmail");
        if (pendingEmail) {
          setUserEmail(pendingEmail);
          return;
        }

        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const stored = JSON.parse(userData);
          if (stored?.email) setUserEmail(stored.email);
        }
      } catch (err) {
        console.error("Error loading user email:", err);
      }
    };

    loadUserEmail();
  }, [userEmail]);

  const handleResend = async () => {
    if (!userEmail) {
      setError("User email not found. Please try registering again.");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
      });

      if (resendError) throw resendError;

      Toast.show({
        type: "success",
        text1: "Email Sent!",
        text2: "We sent a new confirmation link to your inbox.",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to resend email. Please try again.";
      setError(message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: message,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.decorContainer}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={64} color="#4ECDC4" />
          </View>
        </View>

        {/* Title */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to
          </Text>
          <Text style={styles.emailText}>
            {userEmail || "your email address"}
          </Text>
          <Text style={styles.subtitle}>
            Click the link to activate your account.
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#636E72"
          />
          <Text style={styles.infoText}>
            Didn’t receive it? Check your spam folder.
          </Text>
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <AnimatedButton
            title="Resend email"
            icon="refresh"
            variant="outline"
            onPress={handleResend}
            loading={isResending}
            disabled={isResending}
            fullWidth
            size="large"
          />
        </View>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.loginLinkText}>Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  decorContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: "#E5F9F8",
    top: -100,
    right: -100,
    opacity: 0.5,
  },
  circle2: {
    width: 250,
    height: 250,
    backgroundColor: "#FFE5E5",
    bottom: -50,
    left: -80,
    opacity: 0.5,
  },
  circle3: {
    width: 200,
    height: 200,
    backgroundColor: "#FFF4E5",
    top: "40%",
    right: -60,
    opacity: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#636E72",
    textAlign: "center",
    lineHeight: 24,
  },
  emailText: {
    fontSize: 16,
    color: "#2D3436",
    fontWeight: "600",
    marginVertical: 8,
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FEB2B2",
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#C53030",
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#636E72",
    lineHeight: 20,
  },
  resendContainer: {
    marginBottom: 20,
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 15,
    color: "#2D3436",
    fontWeight: "600",
  },
});
