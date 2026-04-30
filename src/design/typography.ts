import { TextStyle } from "react-native";
import { fontSize, fontWeight, lineHeight, letterSpacing } from "./tokens";

// Famille Manrope
export const fontFamily = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold",
} as const;

// Hiérarchie typographique
export const typography = {
  // Display (gros titres marketing)
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.display,
    fontWeight: fontWeight.extrabold,
    lineHeight: fontSize.display * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxxl * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxl * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.snug,
  },
  h4: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.normal,
  },

  // Body
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.relaxed,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
  },

  // UI text
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.snug,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.snug,
    letterSpacing: letterSpacing.wide,
  },

  // Button text
  buttonLarge: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.md * lineHeight.tight,
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * lineHeight.tight,
  },
  buttonSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * lineHeight.tight,
  },

  // Special
  overline: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xs * lineHeight.snug,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
} satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof typography;
