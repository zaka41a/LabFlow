<div align="center">
  <h1>LabFlow</h1>
  <p><strong>Sichere, rollenbasierte und nachvollziehbare Ausleihe von Laborgeräten.</strong></p>
  <p>
    <a href="https://github.com/zaka41a/LabFlow/actions/workflows/ci.yml"><img src="https://github.com/zaka41a/LabFlow/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
    <img src="https://img.shields.io/badge/Java-21-007396.svg" alt="Java 21" />
    <img src="https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F.svg" alt="Spring Boot 4.1" />
    <img src="https://img.shields.io/badge/React-19-149ECA.svg" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-7-3178C6.svg" alt="TypeScript 7" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Auth-OpenID%20Connect-3C6E91.svg" alt="OpenID Connect" />
    <img src="https://img.shields.io/badge/Storage-Azure%20Blob-0078D4.svg" alt="Azure Blob Storage" />
    <img src="https://img.shields.io/badge/Containers-Docker-2496ED.svg" alt="Docker" />
    <img src="https://img.shields.io/badge/IaC-OpenTofu-844FBA.svg" alt="OpenTofu" />
    <img src="https://img.shields.io/badge/Delivery-GitLab%20CI-FC6D26.svg" alt="GitLab CI" />
    <img src="https://img.shields.io/badge/Status-in%20development-15803D.svg" alt="Status" />
  </p>
  <p>Large Scale IT &amp; Cloud Computing · FH Aachen · Campus Jülich</p>
</div>

## Überblick

LabFlow digitalisiert den vollständigen Ausleihprozess eines Labors. Eine
ausleihende Person wählt ein verfügbares Gerät und reicht einen Antrag ein. Die
Laborleitung prüft den Zeitraum und trifft eine nachvollziehbare Entscheidung.
Die Labortechnik dokumentiert anschließend Ausgabe, Zustand und Rückgabe.

Das System verbindet eine klassische React Oberfläche mit einer Spring Boot
REST API, serverseitigen Sitzungen, OpenID Connect und einer JSON-basierten
Persistenz in Azure Blob Storage. Rollen-, Benutzer- und Laborgrenzen werden bei
jeder Anfrage im Backend geprüft. Alle fachlich relevanten Aktionen landen in
einem append-only Audit Trail.

- **Vollständiger Prozess.** Antrag, Freigabe, Ausgabe und Rückgabe in einem
  konsistenten Workflow.
- **Drei klar getrennte Rollen.** Borrower, Lab Manager und Technician erhalten
  nur die Funktionen, die sie für ihre Aufgabe benötigen.
- **Echte Authentifizierung.** Lokale Anmeldung für die Entwicklung oder OpenID
  Connect über Authorization Code Flow mit PKCE, beide mit derselben Spring
  Security Session.
- **Risikobasierte Freigabe.** Für sensible Geräte müssen Borrower ihren
  Befähigungsnachweis angeben und Lab Manager die Zugangsvoraussetzung vor der
  Genehmigung verbindlich bestätigen.
- **Nachvollziehbare Daten.** Versionierte JSON-Dokumente, Azure Blob ETags und
  Audit Events schützen vor unbemerkten Überschreibungen.
- **Reproduzierbarer Betrieb.** Docker Compose startet Weboberfläche, API,
  Keycloak und Azurite mit einem Befehl.
- **Cloud Delivery.** OpenTofu beschreibt die Azure Infrastruktur; GitLab CI
  prüft, provisioniert, baut, deployt und verifiziert die Anwendung.

## Funktionen

- responsiver Gerätekatalog mit Bildern und Verfügbarkeitsstatus
- fachliche Zugangsklassen für Standardzugang, Unterweisung und Qualifikation
- Antrag als Entwurf erstellen, einreichen oder vor der Ausgabe stornieren
- Anträge mit verbindlichem Rückgabedatum genehmigen oder begründet ablehnen
- Ausgabe und Rückgabe mit Gerätezustand und technischen Notizen dokumentieren
- Rollenautorisierung sowie zusätzliche Besitzer- und Laborprüfung im Backend
- serverseitige Sitzung mit 30 Minuten Inaktivitätslimit
- BCrypt Passworthashes, Session Fixation Protection und CSRF Schutz
- OpenID Connect SSO mit signierten ID Tokens und fachlichen Rollen Claims
- Azure Blob Storage in der Cloud und Azurite als lokaler Emulator
- optimistische Parallelitätskontrolle über Revisionen und Blob ETags
- einheitliche Problem Details mit `X-Correlation-ID` für API Fehler
- rollenbezogene Dashboards mit Lade-, Leer-, Validierungs- und Fehlerzuständen
- Health Checks für Frontend, Backend, Identity Provider und Storage
- automatisierte Tests für Domainlogik, REST API, Security und React Oberfläche

## Architektur

Browser und Backend kommunizieren über eine einzige Origin. Nginx liefert die
React Anwendung aus und leitet `/api` sowie die OAuth Callback Route intern an
Spring Boot weiter. Die Fachlogik bleibt durch Ports und Adapter unabhängig von
HTTP, Spring MVC und Azure.

```text
                         +-----------------------------+
                         | Browser                     |
                         | React + TypeScript          |
                         | Session Cookie + CSRF       |
                         +--------------+--------------+
                                        |
                                        | HTTP, same origin
                                        v
                         +-----------------------------+
                         | Nginx                       |
                         | SPA + Reverse Proxy         |
                         +--------------+--------------+
                                        |
                                        | /api
                                        v
+--------------------+    OIDC    +-----------------------------+
| Identity Provider  |<---------->| Spring Boot REST API        |
| Keycloak lokal     |  Code+PKCE | Security + Use Cases        |
| FH IdP integrierbar|            | Domain + Repository Ports   |
+--------------------+            +--------------+--------------+
                                                |
                                                | JSON documents
                                                v
                                 +-----------------------------+
                                 | Azure Blob Storage          |
                                 | Azurite in development      |
                                 +-----------------------------+
```

Der End-to-End-Ablauf lautet: Gerät wählen → Entwurf erstellen → Antrag
einreichen → gegebenenfalls Befähigung prüfen → Entscheidung treffen → Gerät
ausgeben → Rückgabe dokumentieren.

Weitere technische Entscheidungen stehen in
[docs/architecture.md](docs/architecture.md).

## Rollen und Geschäftsprozess

| Rolle       | Verantwortlichkeit                                                       |
| ----------- | ------------------------------------------------------------------------ |
| Borrower    | Geräte ansehen sowie eigene Anträge erstellen, einreichen und stornieren |
| Lab Manager | Zeitraum und Befähigung prüfen, Anträge genehmigen oder ablehnen         |
| Technician  | Genehmigte Geräte ausgeben und Rückgabe samt Zustand dokumentieren       |

```text
DRAFT ──> SUBMITTED ──> APPROVED ──> CHECKED_OUT ──> RETURNED
  │           │             │
  │           └──────────> REJECTED
  └──────────────────────> CANCELLED
```

Ein Zustandswechsel ist ausschließlich über das Domainmodell möglich. Eine
Rückgabe mit `REVIEW_REQUIRED` setzt das Gerät automatisch auf `MAINTENANCE`;
ein ordnungsgemäß zurückgegebenes Gerät wird wieder `AVAILABLE`.
Bei Geräten mit `INSTRUCTION_REQUIRED` oder `QUALIFICATION_REQUIRED` erzwingt
das Backend einen Nachweis im Antrag und eine dokumentierte Bestätigung durch
den Lab Manager. Ohne diese Bestätigung ist weder Genehmigung noch Ausgabe
möglich.

## Tech Stack

| Schicht        | Technologie                                                                |
| -------------- | -------------------------------------------------------------------------- |
| Backend        | Java 21, Spring Boot 4.1, Spring MVC, Bean Validation                      |
| Security       | Spring Security, OpenID Connect, PKCE, serverseitige Session, BCrypt, CSRF |
| Frontend       | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query                   |
| Persistenz     | Azure Blob Storage SDK, JSON, ETags, Azurite                               |
| Tests          | JUnit 5, AssertJ, Spring Boot Test, MockMvc, Vitest, Testing Library       |
| Container      | Docker, Docker Compose, Nginx                                              |
| Infrastructure | Azure VM, ACR, Blob Storage, OpenTofu                                      |
| Delivery       | GitLab CI, GitLab Remote State, Azure Workload Identity                    |

## Quick Start

Benötigt werden Docker Desktop und `curl`.

```bash
git clone git@github.com:zaka41a/LabFlow.git
cd LabFlow
./div.sh
```

`div.sh` baut alle Images, startet die vier Dienste und wartet auf deren Health
Checks. Beim ersten Start kann insbesondere Keycloak etwa eine Minute benötigen.

| Dienst                | Adresse                                       |
| --------------------- | --------------------------------------------- |
| Weboberfläche         | http://localhost                              |
| Alternative Web URL   | http://localhost:5173                         |
| REST API              | http://localhost:8080/api                     |
| Backend Health Check  | http://localhost:8080/actuator/health         |
| OpenID Connect        | http://keycloak.localhost:8180/realms/labflow |
| Azurite Blob Endpoint | http://localhost:10000/devstoreaccount1       |

Alle Dienste stoppen, ohne die gespeicherten Azurite Daten zu löschen:

```bash
./stop.sh
```

## Lokale Testzugänge

| Rolle       | E-Mail                     | Passwort          |
| ----------- | -------------------------- | ----------------- |
| Borrower    | `borrower@labflow.local`   | `Borrower2026!`   |
| Lab Manager | `manager@labflow.local`    | `Manager2026!`    |
| Technician  | `technician@labflow.local` | `Technician2026!` |

Die drei Konten sind sowohl für die lokale Anmeldung als auch im importierten
Keycloak Realm vorhanden. In Spring stehen ausschließlich BCrypt Hashes mit
Cost Factor 12. Der Button **Mit LabFlow SSO anmelden** startet stattdessen den
vollständigen OpenID Connect Flow.

## Entwicklung

Die lokale Entwicklung ohne Docker verwendet standardmäßig In-Memory
Repositories und die drei lokalen Testkonten. OpenID Connect ist in diesem Profil
deaktiviert.

Backend starten:

```bash
cd backend
mvn spring-boot:run
```

Frontend in einem zweiten Terminal starten:

```bash
cd frontend
npm ci
npm run dev
```

Vite öffnet die Oberfläche unter http://localhost:5173 und leitet `/api` an
`http://localhost:8080` weiter.

## Docker

Die vollständige Entwicklungsumgebung besteht aus vier getrennten Containern:

| Container  | Aufgabe                                                         |
| ---------- | --------------------------------------------------------------- |
| `frontend` | Produktionsbuild der React SPA, ausgeliefert durch Nginx        |
| `backend`  | Spring Boot API, Session, Autorisierung und Fachlogik           |
| `keycloak` | lokaler OpenID Connect Identity Provider mit importiertem Realm |
| `azurite`  | lokaler Emulator für die Azure Blob Persistenz                  |

Alternativ zu den Startskripten kann die Umgebung direkt verwaltet werden:

```bash
docker compose up --build --detach
docker compose ps
docker compose logs --follow backend
docker compose down
```

Das benannte Volume `azurite-data` bleibt bei `docker compose down` erhalten.

## Persistenz

Im Modus `azure` serialisieren die Repository Adapter jede Entität als eigenes
JSON-Dokument. Die Labor-ID bildet die oberste fachliche Grenze:

```text
labs/{labId}/equipment/{equipmentId}.json
labs/{labId}/loan-requests/{requestId}.json
labs/{labId}/checkout-records/{requestId}.json
labs/{labId}/audit-events/{timestamp}-{eventId}.json
```

Veränderbare Dokumente besitzen eine monotone `revision`. Der Adapter liest den
aktuellen Blob ETag und schreibt mit `If-Match`; neue Dokumente verwenden
`If-None-Match: *`. Ein veralteter paralleler Schreibversuch überschreibt daher
keine Daten, sondern endet kontrolliert mit HTTP `409 Conflict`.

Zwischen den Modi kann ohne Änderung der Fachlogik gewechselt werden:

```bash
LABFLOW_STORAGE_MODE=memory mvn -f backend/pom.xml spring-boot:run
```

Für `LABFLOW_STORAGE_MODE=azure` werden zusätzlich
`AZURE_STORAGE_CONNECTION_STRING` und optional `AZURE_STORAGE_CONTAINER`
benötigt.

## Konfiguration

Die wichtigsten Laufzeitwerte werden über Umgebungsvariablen gesetzt:

| Variable                           | Standardwert               | Zweck                                         |
| ---------------------------------- | -------------------------- | --------------------------------------------- |
| `SERVER_PORT`                      | `8080`                     | Port der Spring Boot API                      |
| `LABFLOW_FRONTEND_ORIGIN`          | `http://localhost:5173`    | erlaubte Browser Origin und Login Redirect    |
| `LABFLOW_STORAGE_MODE`             | `memory`                   | `memory` oder `azure`                         |
| `AZURE_STORAGE_CONNECTION_STRING`  | nicht gesetzt              | Verbindung zu Azure Blob Storage oder Azurite |
| `AZURE_STORAGE_CONTAINER`          | `labflow`                  | Name des privaten Blob Containers             |
| `LABFLOW_SESSION_SECURE`           | `false`                    | setzt das Session Cookie auf HTTPS-only       |
| `OIDC_CLIENT_ID`                   | `labflow-web`              | öffentliche OIDC Client ID                    |
| `OIDC_PUBLIC_ISSUER_URI`           | lokaler Keycloak Issuer    | erwarteter öffentlicher Token Issuer          |
| `OIDC_AUTHORIZATION_URI`           | lokaler Keycloak Endpoint  | Browser Authorization Endpoint                |
| `OIDC_TOKEN_URI`                   | interner Keycloak Endpoint | serverseitiger Token Endpoint                 |
| `OIDC_JWK_SET_URI`                 | interner Keycloak Endpoint | Schlüssel für die Signaturprüfung             |
| `OIDC_USER_INFO_URI`               | interner Keycloak Endpoint | serverseitiger UserInfo Endpoint              |
| `LABFLOW_BORROWER_PASSWORD_HASH`   | lokaler Standardhash       | austauschbarer BCrypt Hash für Borrower       |
| `LABFLOW_MANAGER_PASSWORD_HASH`    | lokaler Standardhash       | austauschbarer BCrypt Hash für Lab Manager    |
| `LABFLOW_TECHNICIAN_PASSWORD_HASH` | lokaler Standardhash       | austauschbarer BCrypt Hash für Technician     |

Für eine öffentliche Umgebung muss TLS vorgeschaltet und
`LABFLOW_SESSION_SECURE=true` gesetzt werden.

## HTTP API

```text
GET    /actuator/health
GET    /api/auth/config
GET    /api/auth/csrf
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/dashboard/summary
GET    /api/equipment

GET    /api/loan-requests
GET    /api/loan-requests/{id}
POST   /api/loan-requests
POST   /api/loan-requests/{id}/submit
POST   /api/loan-requests/{id}/cancel

GET    /api/approvals/pending
POST   /api/approvals/{id}/approve
POST   /api/approvals/{id}/reject

GET    /api/handover/pending
POST   /api/handover/{id}/checkout
POST   /api/handover/{id}/return

GET    /api/audit-events
```

Schreibende Requests benötigen eine authentifizierte Sitzung und den Token aus
`GET /api/auth/csrf`. Die API antwortet bei Fehlern mit Problem Details und
liefert die zugehörige Korrelationskennung zusätzlich im Header
`X-Correlation-ID`.

## Qualität prüfen

Backend Tests:

```bash
cd backend
mvn verify
```

Frontend Formatierung, Typen, Tests und Produktionsbuild:

```bash
cd frontend
npm ci
npm run format:check
npm run typecheck
npm test
npm run build
```

OpenTofu Konfiguration prüfen:

```bash
cd infra
tofu fmt -check -recursive
tofu init -backend=false
tofu validate
```

Die Test-Suite deckt Domainregeln, Rollen- und Laborgrenzen, OIDC Claim Mapping,
CSRF, Qualifikationsfreigaben, Problem Details, Parallelitätskonflikte und den
vollständigen Prozess bis zur Rückgabe ab. Ein reproduzierbarer Test mit allen
drei Konten steht unter [docs/manual-test.md](docs/manual-test.md).

## GitLab CI und Azure

Die Datei `.gitlab-ci.yml` bildet den Weg vom Commit bis zur laufenden Azure
Umgebung ab:

```text
test ──> plan ──> provision ──> image ──> deploy ──> verify
                      │                              │
                      └──── manuelle Freigabe        └──── Health Checks
```

Die Pipeline führt Maven, Vitest, TypeScript und OpenTofu Prüfungen aus. Danach
erstellt sie nach manueller Freigabe Resource Group, Blob Storage, Azure
Container Registry, Netzwerk und Linux VM. Images werden in ACR gebaut und von
der VM über eine Managed Identity bezogen. Azure Login verwendet GitLab OIDC
Workload Identity; der OpenTofu State liegt mit Locking im GitLab HTTP Backend.

Alle benötigten CI Variablen und Sicherheitshinweise stehen in
[infra/README.md](infra/README.md).

## Projektstruktur

```text
LabFlow/
├── backend/
│   ├── src/main/java/de/fhaachen/labflow/
│   │   ├── domain/             Entitäten, Status und Invarianten
│   │   ├── application/        Use Cases und Repository Ports
│   │   ├── adapter/rest/       REST Controller und API DTOs
│   │   ├── adapter/storage/    In-Memory- und Azure-Blob-Adapter
│   │   ├── security/           Sitzung, OIDC und Rollenregeln
│   │   ├── web/                Problem Details und Correlation IDs
│   │   └── config/             Laufzeitkonfiguration und initialer Gerätekatalog
│   └── src/test/               Unit- und Integrationstests
├── frontend/
│   ├── public/                 FH Aachen Logo und Gerätebilder
│   └── src/
│       ├── components/         wiederverwendbare UI Komponenten
│       ├── features/           Authentifizierung und Rollenbereiche
│       └── lib/                API Client, Navigation und Typen
├── identity/                   lokaler Keycloak Realm und Testidentitäten
├── infra/                      Azure Infrastruktur und Cloud Init
├── docs/                       Architektur und Bewertungsabgleich
├── .gitlab-ci.yml              GitLab Delivery Pipeline
├── .github/workflows/ci.yml    CI für den GitHub Spiegel
├── compose.yaml                vollständige lokale Umgebung
├── div.sh                      alle Dienste bauen und starten
└── stop.sh                     alle Dienste sauber beenden
```

## Autoren

Zakaria Sabiri, Fihi Saad und Othmane Tayani<br />
Large Scale IT & Cloud Computing, FH Aachen, Campus Jülich

Betreuung: Prof. Thomas Eifert und Dr. Marius Politze
