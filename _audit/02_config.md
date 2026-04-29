## § 2 — Configuration Expo

### app.json / app.config
- name : Tartakk
- slug : tartakk
- scheme : tartakk
- version : 1.0.0
- ios.bundleIdentifier : com.tartakk.app
- android.package : com.tartakk.app
- plugins (liste) :
  - expo-router
  - expo-secure-store
- extra (liste des CLÉS uniquement, pas les valeurs) :
  - router
  - eas
  - eas.projectId

### Variables d'environnement
Aucun fichier `.env.example` trouvé à la racine.

Clés `EXPO_PUBLIC_*` référencées dans le code (pour info, non lues ici) :
- non listées (lecture limitée à `app.json` et `.env.example` pour cette étape)
