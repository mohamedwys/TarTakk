## § 6 — Synthèse & risques de migration multi-env

### Top 5 forces de l'app actuelle
1. **Stack moderne et homogène** — Expo SDK 54, React 19, Expo Router 6 file-based, TypeScript strict, New Architecture activée. Aucune dette de version sur les libs critiques.
2. **Auth déjà cablée sur Supabase** — `lib/supabase.ts` unique point d'init, `AuthProvider` au sommet du tree (`app/_layout.tsx`), session persistée via `expo-secure-store`, redirections gardées côté `(auth)/_layout.tsx` (verify-email / tabs).
3. **Realtime déjà fonctionnel** — `UnreadCountProvider` consomme `supabase.auth.onAuthStateChange` + un canal postgres_changes ; les fondations pour les badges multi-env existent.
4. **Routing structuré par groupes** — `(auth)`, `(tabs)`, `(onboarding)`, `(legal)` sont des silos clairs. Insérer un nouveau groupe `(env-switcher)` ou modifier `_layout.tsx` racine n'oblige pas à toucher l'auth.
5. **Tabs centralisées** — un seul `(tabs)/_layout.tsx` avec 5 onglets pilote toute la nav principale → c'est l'unique endroit à passer env-aware pour faire varier l'icône centrale (Sell vs Cart) ou les badges entre B2C Pro et C2C.

### Top 5 risques pour la migration multi-environnements (B2C Pro + Marketplace C2C)
1. **Aucun store global pour l'environnement actif** — pas de Zustand/Redux/Jotai dans le tree (`contexts/` ne contient qu'`AuthContext` et `UnreadCountContext`). Il faudra créer un `EnvContext` (ou store) tout en haut, avant `AuthProvider` ou en frère, et l'écrire dans `expo-secure-store` pour persister entre sessions.
2. **Branche unique pour les "produits"** — `app/product/[id].tsx`, `app/product/edit/[id].tsx`, `app/(tabs)/create.tsx` assument un seul type de listing. Le schéma DB a déjà `listing_type` (B2B/B2C/C2C) et `account_type`, donc la base est prête, mais l'UI/écrans de création/édition/affichage ne lisent ni n'écrivent ce champ côté formulaire — risque de mélange entre vendeurs C2C et "pros".
3. **Couleurs et labels hardcodés partout** — palette `#4ECDC4 / #FF6B6B / #FFB84D / #2D3436` et chaînes "Sell", "Find Your Perfect Item", "Hello {name} 👋" inlinées dans `(tabs)/_layout.tsx`, `(tabs)/index.tsx`, `index.tsx`. `constants/theme.ts` existe mais n'est utilisé presque nulle part. Refactor lourd pour rendre dynamique selon env.
4. **Pas de panier ni de checkout** — aucun fichier `cart`, `order`, `checkout`, `payment` dans l'arborescence. Le bouton "Sell" tombe direct dans `create.tsx`. Pour B2C Pro façon Noon il faudra concevoir cart + checkout + paiement (CMI/Stripe ?) FROM SCRATCH, en s'assurant que C2C reste sans panier (chat-to-buy).
5. **Pas d'i18n** — l'app est en anglais hardcodé alors que la BDD est FR/AR. Toute migration multi-env qui veut différencier la marque B2C (style premium FR) du marketplace C2C (FR/AR) devra introduire i18n d'abord, sinon les traductions seront dispersées.

### Fichiers qui devront probablement être touchés (ordre d'impact)

| Fichier | Impact | Raison |
|---|---|---|
| `app/_layout.tsx` | 🔴 | Ajouter `EnvProvider` au-dessus / autour des autres Providers, brancher le switcher horizontal en header global. |
| `app/(tabs)/_layout.tsx` | 🔴 | Tabs doivent varier selon env (Cart vs Sell ; Messages partagé ; Home avec contenus différents). Couleurs `#4ECDC4` à thématiser. |
| `app/(tabs)/index.tsx` | 🔴 | "Featured Products" et "Categories" hardcodés en anglais ; doit filtrer `listing_type` selon env. |
| `app/(tabs)/explore.tsx` | 🔴 | Liste produits — doit propager `listing_type_filter` selon env actif. |
| `app/(tabs)/create.tsx` | 🔴 | Si l'utilisateur est en env B2C Pro non validé, doit bloquer ou rediriger vers KYC. Sinon écrire `listing_type=C2C` ou `B2C` selon contexte. |
| `app/product/[id].tsx` | 🟡 | UI doit afficher différemment B2C (CTA "Add to Cart") vs C2C (CTA "Message Seller"). |
| `app/(tabs)/profile.tsx` | 🟡 | Profil doit exposer le switch de rôle / KYC pour devenir vendeur Pro. |
| `lib/api.ts` | 🟡 | Toutes les méthodes `getProducts` doivent accepter `listing_type` par défaut depuis l'env actif. |
| `contexts/AuthContext.tsx` | 🟡 | Étendre le type `User` avec `accountType`, `role`, `companyName` déjà en BDD mais ignorés ici. |
| `constants/theme.ts` | 🟡 | Devenir un thème par env (B2C palette premium / C2C palette friendly). |
| `app/index.tsx` | 🟢 | Welcome screen — doit choisir/proposer un env par défaut. |
| `app/(onboarding)/index.tsx` | 🟢 | Onboarding peut introduire le concept des deux environnements. |
| `app/search/index.tsx` | 🟢 | Filtrer par env actif (dérivé de `listing_type`). |
| `app/favorites/index.tsx` | 🟢 | Soit favoris partagés, soit séparés selon env (à décider). |
| `app/chat/[id].tsx`, `(tabs)/messages.tsx` | 🟢 | Probablement partagé entre env (un seul inbox). À confirmer. |
| `app/notifications/index.tsx` | 🟢 | Idem, probablement partagé. |
| `supabase/migrations/*.sql` | 🟡 | Schéma a déjà `listing_type` et `account_type` ; il faudra peut-être ajouter `cart_items`, `orders`, `pro_kyc` tables, ainsi que des RLS différenciées. |

### 8 questions ouvertes pour Nordine avant de commencer le Prompt 1
1. **Panier** — un seul panier global, ou un panier par environnement (un pour B2C Pro, aucun pour C2C qui reste chat-to-buy) ?
2. **Identité visuelle** — un thème de couleurs distinct par env (palette premium pour B2C Pro vs palette actuelle teal/orange pour C2C) ou même thème avec juste un badge ?
3. **Switcher horizontal** — toujours visible (header collant en haut de chaque tab) ou seulement sur l'écran d'accueil ? Persistant entre sessions (expo-secure-store) ou reset à chaque ouverture ?
4. **KYC vendeur Pro** — validation manuelle admin obligatoire avant de pouvoir publier en B2C, ou self-service avec doc upload + vérification asynchrone ?
5. **Création de produit** — un utilisateur Pro peut-il aussi publier en C2C, ou la création est strictement liée à l'env actif ? Inversement, un utilisateur C2C voit-il l'onglet B2C en lecture seule ?
6. **Messages, notifications, favoris** — partagés entre les deux env ou silotés ?
7. **Onboarding** — faut-il introduire les deux env dès l'onboarding (slide "choisis ton mode") ou laisser l'utilisateur découvrir le switcher en post-login ?
8. **Paiement B2C Pro** — quel PSP (CMI Maroc, Stripe, autre) ? Et est-ce qu'on livre la migration sans paiement (CTA "Coming soon") pour ne pas bloquer le Prompt 1 ?

### Recommandation de branche & commit
- Nom de branche : `feature/multi-env-switcher`
- Commande commit de snapshot :
  ```
  git add . && git commit -m "chore: snapshot before multi-env migration"
  ```
