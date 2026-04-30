// Animations standards pour cohérence dans toute l'app

export const animationDuration = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// Reanimated/Moti compatible easing curves
export const animationConfig = {
  // Pour tap/press (rapide)
  press: {
    type: "spring" as const,
    damping: 15,
    stiffness: 300,
  },
  // Pour entrée d'élément
  enter: {
    type: "timing" as const,
    duration: 300,
  },
  // Pour transition fluide
  smooth: {
    type: "timing" as const,
    duration: 250,
  },
  // Pour bounce gentle
  bounce: {
    type: "spring" as const,
    damping: 10,
    stiffness: 100,
  },
} as const;
