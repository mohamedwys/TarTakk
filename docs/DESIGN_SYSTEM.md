# Tartakk Design System

## Principes

Système de design centralisé pour cohérence visuelle entre mobile et web.

## Structure

```
src/design/
├── tokens.ts       # Spacing, radius, shadows, durations
├── typography.ts   # Styles typo Manrope avec hiérarchie
├── animations.ts   # Configurations Moti/Reanimated standards
└── index.ts        # Barrel export
```

## Usage

### Spacing

```typescript
import { spacing } from "@/src/design";

<View style={{ padding: spacing.md, gap: spacing.sm }} />
```

### Typography

```typescript
import { typography } from "@/src/design";

<Text style={typography.h2}>Titre</Text>
<Text style={typography.body}>Corps de texte</Text>
```

### Shadows

```typescript
import { shadow } from "@/src/design";

<View style={[styles.card, shadow.md]} />
```

## Hiérarchie typographique

| Style       | Usage                                    |
|-------------|------------------------------------------|
| display     | Titres marketing (Welcome screen)        |
| h1          | Titres de page                           |
| h2          | Sections principales                     |
| h3          | Sous-sections                            |
| h4          | Titres mineurs                           |
| bodyLarge   | Body text important                      |
| body        | Body text standard                       |
| bodySmall   | Texte secondaire                         |
| label       | Labels de form                           |
| caption     | Notes/timestamps                         |
| button      | Texte de boutons                         |
| overline    | Petits labels uppercase (catégories)     |

## Couleurs

Les couleurs sont gérées dans `src/env/envConfig.ts` (theme par environnement).
Voir D2 pour la palette "Spices of Morocco".

## Animations

```typescript
import { animationConfig } from "@/src/design";
import { MotiView } from "moti";

<MotiView
  from={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={animationConfig.enter}
/>
```

## Évolutions

- D2: Color palette modernisée (Spices of Morocco)
- D3: UI Primitives (Button, Card, Badge, Input)
- D4: Skeleton & Empty states
