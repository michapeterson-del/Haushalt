# Haushalt – Punkteplan

Wöchentlicher Aufgaben-Punkteplan für Ben, Sam und Yoshi. 1 Punkt = 1 Minute YouTube-Zeit, ausgewertet samstags. Läuft als ganz normale Webseite über GitHub Pages – kein Login nötig.

## 1. Seite live schalten (einmalig)

1. Im Repo auf **Settings → Pages**.
2. Bei "Build and deployment" → Source: **Deploy from a branch**.
3. Branch: `claude/app-konzept-diskussion-tqyr0z` (oder `main`, sobald der Branch gemerged ist), Ordner: `/ (root)`.
4. Speichern. Nach ein bis zwei Minuten ist die Seite unter `https://michapeterson-del.github.io/Haushalt/` erreichbar – für alle, ohne Anmeldung.

## 2. Live-Sync zwischen allen Geräten aktivieren (optional, ~5 Minuten)

Ohne diesen Schritt funktioniert die Seite trotzdem – jedes Gerät speichert seine Häkchen dann aber nur lokal (Banner "Nur dieses Gerät"). Mit einer kostenlosen Firebase-Datenbank sehen Mama, Papa & Co. die Häkchen sofort auf jedem Gerät:

1. Auf [console.firebase.google.com](https://console.firebase.google.com) mit einem Google-Konto ein neues Projekt anlegen (kostenlos, keine Kreditkarte nötig).
2. Im Projekt links **Build → Firestore Database → Create database** wählen, Modus "Production" ist ok.
3. Im Tab **Rules** den folgenden Text einfügen und veröffentlichen (die Datenbank ist dann offen für alle mit dem Link – für einen privaten Familien-Punkteplan unkritisch):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Auf der Projektübersicht (Zahnrad-Symbol → **Project settings**) unter "Your apps" eine **Web-App** hinzufügen (`</>`-Symbol). Der angezeigte `firebaseConfig`-Block enthält die nötigen Werte.
5. Diese Werte in `index.html` bei `window.FIREBASE_CONFIG` eintragen (Beispiel steht als Kommentar direkt daneben) und den Branch pushen.

Danach zeigt der Status-Badge oben rechts "Live verbunden", und alle Geräte sehen dieselben Häkchen in Echtzeit.
