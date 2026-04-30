import { authAPI } from "@/lib/api";
import { useEnv } from "@/src/env";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { Button, Card, Input } from "@/src/components/ui";
import { SectionLabel, SettingsRow, LanguageOption } from "@/src/components/profile";
import { spacing, radius } from "@/src/design/tokens";
import { typography, fontFamily } from "@/src/design/typography";

export default function SettingsScreen() {
  const router = useRouter();
  const { config } = useEnv();
  const theme = config.theme;
  const { t, i18n: i18nInstance } = useTranslation();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>(
    i18nInstance.language || "fr"
  );

  const handleLanguageChange = (lang: "fr" | "ar" | "en") => {
    i18nInstance.changeLanguage(lang);
    setCurrentLang(lang);
  };

  const handleLogout = async () => {
    Alert.alert(t("settings.logoutConfirmTitle"), t("settings.logoutConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");

            try {
              await authAPI.logout();
            } catch (error) {
              console.log("Logout API failed (non-blocking):", error);
            }

            Toast.show({
              type: "success",
              text1: t("settings.logoutSuccess"),
            });

            router.replace("/(auth)/login");
          } catch (error: any) {
            console.error("Logout error:", error);
            Toast.show({
              type: "error",
              text1: t("settings.logoutFailed"),
              text2: error.message || t("settings.tryAgain"),
            });
          }
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: t("settings.allFieldsRequired") });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: t("settings.passwordsMismatch") });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({ type: "error", text1: t("settings.passwordTooShort") });
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Toast.show({ type: "success", text1: t("settings.passwordChanged") });
    } catch (error: any) {
      console.error("Change password error:", error);
      Toast.show({
        type: "error",
        text1: error.message || t("settings.passwordChangeFailed"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: theme.textPrimary, fontFamily: fontFamily.bold }]}>
          {t("settings.title")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel>{t("settings.account")}</SectionLabel>
        <Card elevation="flat" padding="none" style={styles.card}>
          <SettingsRow
            icon="person-outline"
            iconColor={theme.primary}
            label={t("settings.editProfile")}
            onPress={() => router.push("/profile/edit")}
            showChevron
          />
          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="lock-closed-outline"
            iconColor={theme.warning}
            label={t("settings.changePassword")}
            onPress={() => setPasswordModalVisible(true)}
            showChevron
          />
        </Card>

        <SectionLabel>{t("settings.notifications")}</SectionLabel>
        <Card elevation="flat" padding="none" style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            iconColor={theme.accent}
            label={t("settings.pushNotifications")}
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="mail-outline"
            iconColor={theme.primary}
            label={t("settings.emailNotifications")}
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="chatbubble-outline"
            iconColor={theme.primary}
            label={t("settings.messageNotifications")}
            value={messageNotifications}
            onValueChange={setMessageNotifications}
          />
        </Card>

        <SectionLabel>{t("settings.privacy")}</SectionLabel>
        <Card elevation="flat" padding="none" style={styles.card}>
          <SettingsRow
            icon="shield-checkmark-outline"
            iconColor={theme.primaryDark}
            label={t("settings.privacyPolicy")}
            onPress={() => router.push("/(legal)/privacy")}
            showChevron
          />
          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="document-text-outline"
            iconColor={theme.primary}
            label={t("settings.termsOfService")}
            onPress={() => router.push("/(legal)/terms")}
            showChevron
          />
        </Card>

        <SectionLabel>{t("settings.language")}</SectionLabel>
        <Card elevation="flat" padding="none" style={styles.card}>
          <LanguageOption
            flag="🇫🇷"
            label="Français"
            selected={currentLang === "fr"}
            onPress={() => handleLanguageChange("fr")}
          />
          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
          <LanguageOption
            flag="🇲🇦"
            label="العربية"
            selected={currentLang === "ar"}
            onPress={() => handleLanguageChange("ar")}
          />
          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
          <LanguageOption
            flag="🇬🇧"
            label="English"
            selected={currentLang === "en"}
            onPress={() => handleLanguageChange("en")}
          />
        </Card>

        <SectionLabel>{t("settings.support")}</SectionLabel>
        <Card elevation="flat" padding="none" style={styles.card}>
          <SettingsRow
            icon="help-circle-outline"
            iconColor={theme.primary}
            label={t("settings.helpCenter")}
            onPress={() => router.push("/help")}
            showChevron
          />
          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
          <SettingsRow
            icon="mail-outline"
            iconColor={theme.primaryDark}
            label={t("settings.contactUs")}
            onPress={() => router.push("/contact-us")}
            showChevron
          />
        </Card>

        <View style={styles.logoutWrap}>
          <Button
            variant="danger"
            fullWidth
            iconLeft="log-out-outline"
            onPress={handleLogout}
          >
            {t("settings.logout")}
          </Button>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setPasswordModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[typography.h3, { color: theme.textPrimary, fontFamily: fontFamily.bold }]}>
              {t("settings.changePassword")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={{ gap: spacing.md, paddingTop: spacing.md }}>
              <Input
                label={t("settings.currentPassword")}
                placeholder={t("settings.currentPasswordPlaceholder")}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <Input
                label={t("settings.newPassword")}
                placeholder={t("settings.newPasswordPlaceholder")}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <Input
                label={t("settings.confirmPassword")}
                placeholder={t("settings.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                onPress={handleChangePassword}
                style={{ marginTop: spacing.md }}
              >
                {isLoading ? t("settings.changing") : t("settings.changePassword")}
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  card: {
    marginHorizontal: spacing.md,
    overflow: "hidden",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 32 + spacing.md,
  },
  logoutWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  bottomSpacing: { height: 60 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
