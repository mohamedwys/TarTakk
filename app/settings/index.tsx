import { authAPI } from "@/lib/api";
import { useEnv } from "@/src/env";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const [expandedSections, setExpandedSections] = useState({
    account: true,
    notifications: false,
    privacy: false,
    support: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

const handleLogout = async () => {
  Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmMessage'), [
    { text: t('common.cancel'), style: "cancel" },
    {
      text: t('settings.logout'),
      style: "destructive",
      onPress: async () => {
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');

          try {
            await authAPI.logout();
          } catch (error) {
            console.log('Logout API failed (non-blocking):', error);
          }

          Toast.show({
            type: "success",
            text1: t('settings.logoutSuccess'),
          });

          router.replace("/(auth)/login");
        } catch (error: any) {
          console.error('Logout error:', error);
          Toast.show({
            type: "error",
            text1: t('settings.logoutFailed'),
            text2: error.message || t('settings.tryAgain'),
          });
        }
      },
    },
  ]);
};

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: t('settings.allFieldsRequired'),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: t('settings.passwordsMismatch'),
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: t('settings.passwordTooShort'),
      });
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword(currentPassword, newPassword);

      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Toast.show({
        type: "success",
        text1: t('settings.passwordChanged'),
      });
    } catch (error: any) {
      console.error("Change password error:", error);
      Toast.show({
        type: "error",
        text1: error.message || t('settings.passwordChangeFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSectionHeader = (
    title: string,
    section: keyof typeof expandedSections,
    icon: string,
    color: string
  ) => (
    <TouchableOpacity
      style={[styles.sectionHeader, { borderBottomColor: theme.border }]}
      onPress={() => toggleSection(section)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color={theme.textInverse} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      </View>
      <Animated.View
        style={{
          transform: [
            {
              rotate: expandedSections[section] ? "90deg" : "0deg",
            },
          ],
        }}
      >
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          {renderSectionHeader(
            t('settings.account'),
            "account",
            "person-outline",
            theme.primary
          )}

          {expandedSections.account && (
            <View style={[styles.sectionContent, { borderBottomColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: theme.border }]}
                onPress={() => router.push("/profile/edit")}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="person-outline" size={22} color={theme.primary} />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.editProfile')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: theme.border }]}
                onPress={() => setPasswordModalVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={22}
                      color={theme.warning}
                    />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.changePassword')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Language Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.warning }]}>
                <Ionicons name="language-outline" size={20} color={theme.textInverse} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('settings.language')}
              </Text>
            </View>
          </View>
          <View style={styles.languageOptions}>
            <Pressable
              style={[
                styles.langButton,
                { backgroundColor: theme.background, borderColor: "transparent" },
                currentLang === "fr" && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primaryDark,
                },
              ]}
              onPress={() => handleLanguageChange("fr")}
            >
              <Text
                style={[
                  styles.langButtonText,
                  { color: theme.textPrimary },
                  currentLang === "fr" && { color: theme.textInverse },
                ]}
              >
                🇫🇷 Français
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.langButton,
                { backgroundColor: theme.background, borderColor: "transparent" },
                currentLang === "ar" && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primaryDark,
                },
              ]}
              onPress={() => handleLanguageChange("ar")}
            >
              <Text
                style={[
                  styles.langButtonText,
                  { color: theme.textPrimary },
                  currentLang === "ar" && { color: theme.textInverse },
                ]}
              >
                🇲🇦 العربية
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.langButton,
                { backgroundColor: theme.background, borderColor: "transparent" },
                currentLang === "en" && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primaryDark,
                },
              ]}
              onPress={() => handleLanguageChange("en")}
            >
              <Text
                style={[
                  styles.langButtonText,
                  { color: theme.textPrimary },
                  currentLang === "en" && { color: theme.textInverse },
                ]}
              >
                🇬🇧 English
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          {renderSectionHeader(
            t('settings.notifications'),
            "notifications",
            "notifications-outline",
            theme.accent
          )}

          {expandedSections.notifications && (
            <View style={[styles.sectionContent, { borderBottomColor: theme.border }]}>
              <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={22}
                      color={theme.accent}
                    />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.pushNotifications')}</Text>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={theme.textInverse}
                />
              </View>

              <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="mail-outline" size={22} color={theme.primary} />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.emailNotifications')}</Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={theme.textInverse}
                />
              </View>

              <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={22}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.messageNotifications')}</Text>
                </View>
                <Switch
                  value={messageNotifications}
                  onValueChange={setMessageNotifications}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={theme.textInverse}
                />
              </View>
            </View>
          )}
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          {renderSectionHeader(
            t('settings.privacy'),
            "privacy",
            "shield-checkmark-outline",
            theme.primaryDark
          )}

          {expandedSections.privacy && (
            <View style={[styles.sectionContent, { borderBottomColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: theme.border }]}
                onPress={() => router.push("/(legal)/privacy")}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={22}
                      color={theme.primaryDark}
                    />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.privacyPolicy')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: theme.border }]}
                onPress={() => router.push("/(legal)/terms")}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.termsOfService')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          {renderSectionHeader(
            t('settings.support'),
            "support",
            "help-circle-outline",
            theme.primary
          )}

          {expandedSections.support && (
            <View style={[styles.sectionContent, { borderBottomColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: theme.border }]}
                onPress={() => router.push("/help")}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={22}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.helpCenter')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: theme.border }]}
                onPress={() => router.push("/contact-us")}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="mail-outline" size={22} color={theme.primaryDark} />
                  </View>
                  <Text style={[styles.settingText, { color: theme.textPrimary }]}>{t('settings.contactUs')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: theme.background }]}
              >
                <Ionicons name="log-out-outline" size={22} color={theme.error} />
              </View>
              <Text style={[styles.settingText, { color: theme.error }]}>{t('settings.logout')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Change Password Modal */}
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
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('settings.changePassword')}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>{t('settings.currentPassword')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('settings.currentPasswordPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>{t('settings.newPassword')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('settings.newPasswordPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>{t('settings.confirmPassword')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.changePasswordButton,
                { backgroundColor: theme.primary },
                isLoading && { backgroundColor: theme.textSecondary },
              ]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              <Text style={[styles.changePasswordButtonText, { color: theme.textInverse }]}>
                {isLoading ? t('settings.changing') : t('settings.changePassword')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  langButton: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  langButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  changePasswordButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
