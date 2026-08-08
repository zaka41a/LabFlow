# Manueller Abnahmetest

Dieser Ablauf prüft die Anwendung aus Sicht aller drei Rollen einschließlich
Authentifizierung, Sicherheitsfreigabe, Ausgabe, Rückgabe und Persistenz.

## 1. Umgebung starten

```bash
./div.sh
docker compose ps
```

Alle vier Container müssen `healthy` melden. Die Anwendung ist unter
http://localhost erreichbar; http://localhost:5173 bleibt als alternative URL
verfügbar. Auch ein direktes Neuladen von http://localhost/equipment/ muss die
React Anwendung ohne Verbindungsfehler öffnen.

Beim ersten Start enthält der Katalog neun Geräte aus IT, Elektronik, Werkstatt
und Labor. Es werden keine Ausleihanträge vorab erzeugt. Bereits selbst
angelegte Anträge bleiben im lokalen Azurite Volume erhalten.

## 2. Borrower: Antrag erstellen und einreichen

Anmelden mit:

- E-Mail: `borrower@labflow.local`
- Passwort: `Borrower2026!`

1. `Gerätebestand` öffnen und die Bilder, Statuswerte und Zugangsklassen prüfen.
2. `Meine Anträge` öffnen und `Neuer Antrag` wählen.
3. Als Gerät `Laborzentrifuge 12 × 15 ml` auswählen.
4. Zeitraum und einen Verwendungszweck mit mindestens zehn Zeichen eintragen.
5. Als Nachweis beispielsweise
   `Zentrifugenunterweisung am 03.08.2026 bei Dr. Muster absolviert` eintragen.
6. Den Entwurf speichern.
7. Im neuen Eintrag `Details` und danach `Zur Prüfung einreichen` wählen.

Erwartung: Der Status wechselt von `Entwurf` zu `Eingereicht`. Erst jetzt wird
der Antrag für den Lab Manager sichtbar.

## 3. Lab Manager: Befähigung prüfen und genehmigen

Abmelden und anmelden mit:

- E-Mail: `manager@labflow.local`
- Passwort: `Manager2026!`

1. `Freigaben` öffnen.
2. Beim eingereichten Antrag Gerät, Zeitraum, Verwendungszweck,
   Zugangsvoraussetzung und Nachweis vergleichen.
3. `Genehmigen` wählen und ein Rückgabedatum innerhalb des beantragten
   Zeitraums setzen.
4. Prüfen, dass die Freigabe ohne das Pflichtfeld
   `Zugangsvoraussetzung persönlich geprüft` nicht abgesendet werden kann.
5. Das Pflichtfeld aktivieren und die Freigabe bestätigen.

Erwartung: Der Antrag verlässt die Prüfwarteschlange, das Gerät wird
`Reserviert`, und Prüfer sowie Prüfzeitpunkt werden im Antrag gespeichert.

## 4. Technician: Ausgabe und Rückgabe dokumentieren

Abmelden und anmelden mit:

- E-Mail: `technician@labflow.local`
- Passwort: `Technician2026!`

1. `Ausgabe und Rückgabe` öffnen.
2. Beim genehmigten Antrag die Ausgabe mit Zustand `Einwandfrei` bestätigen.
3. Prüfen, dass der Vorgang nun als Rückgabeaufgabe erscheint.
4. Die Rückgabe mit Zustand `Leichte Gebrauchsspuren` und einer technischen
   Notiz bestätigen.

Erwartung: Der Antrag erreicht `Zurückgegeben`; das Gerät ist wieder
`Verfügbar`. Bei `Prüfung erforderlich` würde es stattdessen auf `Wartung`
gesetzt.

## 5. OpenID Connect und Rollen prüfen

1. Abmelden und auf `Mit LabFlow SSO anmelden` klicken.
2. Im Keycloak Login eines der drei oben genannten Konten verwenden.
3. Nach der Rückleitung prüfen, dass dieselbe Rolle und dasselbe Labor aktiv
   sind.
4. Als Borrower direkt `/approvals` öffnen. Die Oberfläche muss auf eine
   erlaubte Seite zurückführen; die API verweigert den Endpoint zusätzlich mit
   HTTP 403.

## 6. Persistenz prüfen

Einen weiteren Entwurf anlegen und danach ausführen:

```bash
./stop.sh
./div.sh
```

Nach erneuter Anmeldung muss der Entwurf weiterhin vorhanden sein. `stop.sh`
entfernt keine Daten; die JSON Dokumente liegen im benannten Azurite Volume.

## 7. Automatisierte Prüfung

```bash
cd backend
mvn verify
```

```bash
cd frontend
npm run format:check
npm run typecheck
npm test
npm run build
```

Die Backend Suite prüft zusätzlich, dass ein sensibles Gerät ohne Nachweis oder
Managerbestätigung nicht genehmigt werden kann und dass die Prüfung im Audit
Trail erscheint.
