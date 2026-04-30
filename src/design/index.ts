export * from "./tokens";
export * from "./typography";
export * from "./animations";

// Convenience export d'un objet design global
import { spacing, radius, fontSize, fontWeight, shadow, duration } from "./tokens";
import { fontFamily, typography } from "./typography";
import { animationConfig, animationDuration } from "./animations";

export const design = {
  spacing,
  radius,
  fontSize,
  fontWeight,
  shadow,
  duration,
  fontFamily,
  typography,
  animationConfig,
  animationDuration,
} as const;
