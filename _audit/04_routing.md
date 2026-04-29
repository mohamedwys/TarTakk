## § 4 — Routing Expo Router

### app/_layout.tsx (stack racine)
- Providers imbriqués (ordre exact, du plus externe au plus interne) :
  1. `AuthProvider` (de `@/contexts/AuthContext`)
  2. `UnreadCountProvider` (de `@/contexts/UnreadCountContext`)
  3. `GestureHandlerRootView` (de `react-native-gesture-handler`)
  4. `Stack` (de `expo-router`)
  - Hors hiérarchie : `Toast` (de `react-native-toast-message`) rendu en frère de `AppContent` à l'intérieur de `UnreadCountProvider`.
- Imports principaux :
  - `ScreenTransitions` depuis `@/constants/transitions`
  - `AuthProvider`, `useAuth` depuis `@/contexts/AuthContext`
  - `UnreadCountProvider` depuis `@/contexts/UnreadCountContext`
  - `toastConfig` depuis `@/lib/toastConfig`
  - `Stack` depuis `expo-router`
  - `StatusBar` depuis `expo-status-bar`
  - `GestureHandlerRootView` depuis `react-native-gesture-handler`
  - `Toast` depuis `react-native-toast-message`
- Hooks utilisés :
  - `useAuth()` (via `AppContent` pour lire `isLoading`)
- Routes déclarées dans le `Stack` :
  - `index` (transition fade)
  - `(auth)` (slideFromRight)
  - `(onboarding)` (fade)
  - `(tabs)` (fade)
  - `search`, `favorites`, `notifications`, `help`, `settings`, `contact-us` (slideFromRight / slideAndFade)
  - Plusieurs entrées commentées : `modal`, `chat/[id]`, `product/[id]`, `user/[id]`

### app/(auth)/_layout.tsx
- Type : `Stack` (de `expo-router`)
- Options principales :
  - `screenOptions={{ headerShown: false, gestureEnabled: true, gestureDirection: 'horizontal' }}`
  - Garde de redirection via `useEffect` :
    - si `isAuthenticated && !isVerified` → `router.replace('/(auth)/verify-email')`
    - si `isAuthenticated && isVerified` → `router.replace('/(tabs)')`
  - Loader plein écran (`ActivityIndicator` couleur `#4ECDC4`) tant que `isLoading`.
- Hooks utilisés : `useAuth()`, `usePathname()`, `useEffect()`
- Écrans déclarés : `register`, `login`, `verify-email`, `forgot-password`, `reset-password`, `complete-profile`

### app/(tabs)/_layout.tsx
- Type : `Tabs` (de `expo-router`) enveloppé dans `GestureHandlerRootView`
- Options principales :
  - `tabBarActiveTintColor: '#4ECDC4'`
  - `tabBarInactiveTintColor: '#B2BEC3'`
  - `headerShown: false`
  - Style de tabBar : fond blanc, hauteur 90, paddingBottom 30, ombre légère
- Hooks utilisés : `useUnreadCount()` (lecture de `totalUnreadCount` pour le badge)
- Liste des tabs (name + title + icon) :
  | name | title | icon (focused / unfocused) |
  |---|---|---|
  | index | Home | home / home-outline |
  | explore | Explore | search / search-outline |
  | create | Sell | add-circle (taille +8) |
  | messages | Messages | chatbubbles / chatbubbles-outline (+ badge `BadgePulse` si `totalUnreadCount > 0`) |
  | profile | Profile | person / person-outline |

### Autres _layout.tsx

#### app/(onboarding)/_layout.tsx
- Type : `Stack`
- Options principales : `screenOptions={{ headerShown: false }}`
- Écrans : `index`

#### app/(legal)/_layout.tsx
- Type : `Stack`
- Options principales : par écran (`headerShown: false`)
- Écrans :
  - `privacy` (title: "Privacy Policy")
  - `terms` (title: "Terms of Service")

#### app/(auth)/_layout.tsx, app/(tabs)/_layout.tsx — voir ci-dessus

#### Autres `_layout.tsx` présents (non lus à cette étape) :
- `app/chat/_layout.tsx`
- `app/contact-us/_layout.tsx`
- `app/favorites/_layout.tsx`
- `app/help/_layout.tsx`
- `app/notifications/_layout.tsx`
- `app/product/_layout.tsx`
- `app/search/_layout.tsx`
- `app/settings/_layout.tsx`
- `app/user/_layout.tsx`
