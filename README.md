<div align="center">
  <h1>LabFlow</h1>
  <p><strong>Rollenbasierte Verwaltung und Ausleihe von Laborgeräten.</strong></p>
  <p>
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
  </p>
  <p>Large Scale IT &amp; Cloud Computing · FH Aachen · Campus Jülich</p>
</div>

## Überblick

LabFlow bildet den Ausleihprozess eines Labors vollständig ab. Borrower wählen
ein Gerät und reichen einen Antrag ein. Lab Manager prüfen Zeitraum,
Verwendungszweck und gegebenenfalls den Qualifikationsnachweis. Technicians
dokumentieren Ausgabe, Zustand und Rückgabe.

Die Anwendung besteht aus einer React Oberfläche und einer Spring Boot REST API.
Spring Security verwaltet Anmeldung, OpenID Connect, serverseitige Sitzungen,
CSRF Schutz und Rollen. Fachliche Daten werden als JSON Dokumente in Azure Blob
Storage gespeichert; lokal wird Azurite verwendet.

## Funktionen

- drei getrennte Arbeitsbereiche für Borrower, Lab Manager und Technician
- Gerätekatalog mit Bildern, Status und Zugangsvoraussetzungen
- Bestandserfassung mit Bild Upload ausschließlich durch Technicians
- Anträge erstellen, einreichen und vor der Ausgabe stornieren
- Anträge genehmigen oder begründet ablehnen
- Unterweisungen und Qualifikationen vor der Freigabe prüfen
- Ausgabe und Rückgabe mit Gerätezustand dokumentieren
- Rollen-, Benutzer- und Laborprüfung im Backend
- serverseitige Sitzung mit 30 Minuten Inaktivitätslimit
- OpenID Connect Authorization Code Flow; lokal mit PKCE, in Azure über GitLab
- Audit Events und optimistische Parallelitätskontrolle über Blob ETags

## Geschäftsprozess und Rollen

```text
DRAFT -> SUBMITTED -> APPROVED -> CHECKED_OUT -> RETURNED
            |
            +--------> REJECTED

DRAFT oder SUBMITTED -> CANCELLED
```

| Rolle       | Aufgaben                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| Borrower    | Geräte ansehen; eigene Anträge erstellen, einreichen und stornieren      |
| Lab Manager | Zeitraum, Zweck und Nachweise prüfen; genehmigen oder ablehnen           |
| Technician  | Geräte erfassen; Ausgabe, Rückgabe und technischen Zustand dokumentieren |

Ein eingeschränktes Gerät verlangt einen Nachweis im Antrag und eine
Bestätigung durch den Lab Manager. Eine Rückgabe mit Prüfbedarf setzt das Gerät
automatisch auf `MAINTENANCE`.

## Architektur

```text
Browser
  |
  | HTTP, Session Cookie, CSRF
  v
Nginx / React
  |
  | /api und OAuth Callback
  v
Spring Boot REST API <------> OpenID Connect Provider
  |
  | Repository Ports, JSON, ETags
  v
Azure Blob Storage
```

Nginx liefert die Single Page Application aus und leitet API- sowie OAuth
Callback-Routen an Spring Boot weiter. Domain und Application Services kennen
weder HTTP noch Azure; REST und Blob Storage sind Adapter.

Die [technische Architekturdokumentation](docs/architecture.md) beschreibt
Bausteine, Klassenmodell, Prozessablauf, Persistenz, Sicherheit und Azure
Deployment im Detail.

## Tech Stack

| Bereich    | Technologie                                                      |
| ---------- | ---------------------------------------------------------------- |
| Backend    | Java 21, Spring Boot 4.1, Spring MVC, Bean Validation            |
| Security   | Spring Security, OpenID Connect, PKCE, Session, BCrypt, CSRF     |
| Frontend   | React 19, TypeScript 7, Vite, Tailwind CSS, TanStack Query       |
| Persistenz | Azure Blob Storage SDK, JSON, ETags, Azurite                     |
| Tests      | JUnit, AssertJ, MockMvc, Vitest, Testing Library                 |
| Betrieb    | Docker, Docker Compose, Nginx                                    |
| Cloud      | Azure VM, Container Registry, Blob Storage, OpenTofu             |
| Delivery   | GitLab CI, GitLab Remote State, Azure CLI oder Workload Identity |

## Quick Start

Voraussetzungen: Docker Desktop und `curl`.

```bash
git clone git@git-ce.rwth-aachen.de:lsit-2026/projects/labflow.git LabFlow
cd LabFlow
./div.sh
```

`div.sh` baut alle Images, startet die Dienste und wartet auf die Health Checks.

| Dienst                | Adresse                                       |
| --------------------- | --------------------------------------------- |
| Weboberfläche         | http://localhost                              |
| Alternative Web URL   | http://localhost:5173                         |
| REST API              | http://localhost:8080/api                     |
| Backend Health        | http://localhost:8080/actuator/health         |
| OpenID Connect        | http://keycloak.localhost:8180/realms/labflow |
| Azurite Blob Endpoint | http://localhost:10000/devstoreaccount1       |

```bash
./stop.sh
```

Die Datenvolumes von Azurite und Keycloak bleiben beim Stoppen erhalten.

## Testzugänge

| Rolle       | E-Mail                     | Passwort          |
| ----------- | -------------------------- | ----------------- |
| Borrower    | `borrower@labflow.local`   | `Borrower2026!`   |
| Lab Manager | `manager@labflow.local`    | `Manager2026!`    |
| Technician  | `technician@labflow.local` | `Technician2026!` |

Die Konten funktionieren lokal mit der Anmeldung und mit dem Button **Mit
LabFlow SSO anmelden**. **Abmelden** beendet die LabFlow Sitzung und bei einer
Keycloak Anmeldung zusätzlich die Sitzung beim lokalen Provider.

Weitere SSO Benutzer werden in Keycloak unter **Users** angelegt. Das Passwort
wird unter **Credentials** mit `Temporary = Off` gesetzt. Jeder Benutzer
benötigt diese Attribute:

| Attribut       | Beispielwert                                |
| -------------- | ------------------------------------------- |
| `labflow_role` | `BORROWER`, `LAB_MANAGER` oder `TECHNICIAN` |
| `lab_id`       | `FH_AACHEN`                                 |
| `lab_name`     | `Labor FH Aachen`                           |

## Entwicklung und Tests

Backend ohne Docker starten:

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

Alle lokalen Prüfungen:

```bash
mvn -f backend/pom.xml verify

cd frontend
npm run format:check
npm run typecheck
npm test -- --run
npm run build
cd ..

bash ci/test-azure-auth.sh
bash ci/test-azure-preflight.sh

tofu -chdir=infra fmt -check -recursive
tofu -chdir=infra init -backend=false
tofu -chdir=infra validate
```

## Container

| Container  | Aufgabe                                               |
| ---------- | ----------------------------------------------------- |
| `frontend` | React Produktionsbuild und Nginx Reverse Proxy        |
| `backend`  | Spring Boot API, Fachlogik, Sitzung und Autorisierung |
| `keycloak` | lokaler OpenID Connect Provider                       |
| `azurite`  | lokaler Emulator für Azure Blob Storage               |

```bash
docker compose up --build --detach
docker compose ps
docker compose logs --follow backend
docker compose down
```

## Persistenz

Jede Entität wird als separates JSON Dokument gespeichert. Binäre Gerätebilder
liegen in einem eigenen Prefix.

```text
labs/{labId}/equipment/{equipmentId}.json
labs/{labId}/equipment-images/{equipmentId}.bin
labs/{labId}/loan-requests/{requestId}.json
labs/{labId}/checkout-records/{requestId}.json
labs/{labId}/audit-events/{timestamp}-{eventId}.json
```

Änderbare Dokumente besitzen eine `revision`. Der Azure Adapter verwendet
`If-Match` mit dem Blob ETag und `If-None-Match: *` beim ersten Schreiben.
Damit werden parallele Änderungen nicht unbemerkt überschrieben.

## HTTP API

```text
GET    /api/auth/config
GET    /api/auth/csrf
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/dashboard/summary
GET    /api/equipment
POST   /api/equipment                         Technician
GET    /api/equipment/{id}/image

GET    /api/loan-requests                     Borrower
POST   /api/loan-requests                     Borrower
GET    /api/loan-requests/{id}                Borrower
POST   /api/loan-requests/{id}/submit         Borrower
POST   /api/loan-requests/{id}/cancel         Borrower

GET    /api/approvals/pending                 Lab Manager
POST   /api/approvals/{id}/approve            Lab Manager
POST   /api/approvals/{id}/reject             Lab Manager

GET    /api/handover/pending                  Technician
POST   /api/handover/{id}/checkout            Technician
POST   /api/handover/{id}/return              Technician

GET    /api/audit-events                      Lab Manager, Technician
```

## Konfiguration

| Variable                          | Zweck                           |
| --------------------------------- | ------------------------------- |
| `LABFLOW_STORAGE_MODE`            | `memory` oder `azure`           |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage oder Azurite |
| `AZURE_STORAGE_CONTAINER`         | privater Blob Container         |
| `LABFLOW_FRONTEND_ORIGIN`         | erlaubte Browser Origin         |
| `LABFLOW_SESSION_SECURE`          | Session Cookie nur über HTTPS   |
| `OIDC_CLIENT_ID`                  | OIDC Client ID                  |
| `OIDC_CLIENT_SECRET`              | Secret eines vertraulichen Clients |
| `OIDC_CLIENT_AUTHENTICATION_METHOD` | `none`, `client_secret_basic` oder `client_secret_post` |
| `OIDC_PUBLIC_ISSUER_URI`          | erwarteter Issuer der ID Tokens |
| `OIDC_AUTHORIZATION_URI`          | Authorization Endpoint          |
| `OIDC_TOKEN_URI`                  | Token Endpoint                  |
| `OIDC_JWK_SET_URI`                | Signaturschlüssel               |
| `OIDC_USER_INFO_URI`              | UserInfo Endpoint               |
| `LABFLOW_OIDC_BORROWER_IDENTITIES` | GitLab Namen der Borrower       |
| `LABFLOW_OIDC_MANAGER_IDENTITIES` | GitLab Namen der Lab Manager    |
| `LABFLOW_OIDC_TECHNICIAN_IDENTITIES` | GitLab Namen der Technicians |

## GitLab CI und Azure

Die Pipeline bildet den Weg vom Commit bis zur laufenden Azure Umgebung ab:

```text
test -> preflight -> plan -> provision -> image -> deploy -> verify
```

Bei jedem Push laufen Backend-, Frontend-, Shell- und OpenTofu-Prüfungen.
`azure:preflight` prüft die Azure Identität und Providerfreigaben, ohne
Ressourcen anzulegen. Die Cloud Jobs werden mit der geschützten Variable
`LABFLOW_AZURE_ENABLED=true` aktiviert. `azure:provision` bleibt manuell,
weil der Job kostenpflichtige Ressourcen erstellt.

OpenTofu verwendet den GitLab HTTP Backend State mit Locking. Die VM lädt die
privaten Images mit einem auf dem Host geschützten Docker Credential aus Azure
Container Registry. Ein persönliches `az login` auf dem Entwicklungsrechner ist
nicht erforderlich.

Für Azure wird GitLab RWTH als OpenID Connect Provider verwendet. Vor dem
ersten Cloud Lauf wird im Team Gruppe `lsit-2026/roles/LabFlow` unter
**Settings > Applications** eine vertrauliche Anwendung `LabFlow Azure` mit
den Scopes `openid`, `profile` und `email` angelegt. Für
`TF_VAR_name_suffix=zaka41a` lautet die Callback URL:

```text
http://labflow-dev-zaka41a.germanywestcentral.cloudapp.azure.com/login/oauth2/code/labflow
```

Application ID und Secret werden ausschließlich als geschützte GitLab CI/CD
Variablen `TF_VAR_oidc_client_id` und `TF_VAR_oidc_client_secret` gespeichert.
Die Rollen werden standardmäßig den GitLab Namen `zaka41a`, `SaadFihi` und
`othmane022-jj` zugeordnet. Zusätzlich unterstützt die Konfiguration die
GitLab Gruppen `lsit-2026/roles/labflow/borrower`, `lab-manager` und
`technician`. Weitere Konten oder Gruppen können über die drei
`TF_VAR_oidc_*_identities` Listen ergänzt werden.

Zusätzlich werden geschützte `TF_VAR_*` Werte für Namenssuffix,
Administratornetz, SSH Schlüssel und Passwort Hashes benötigt. Die Pipeline
verwendet die vorbereitete Identität des Kurs Runners oder alternativ eine
GitLab OIDC Workload Identity.

## Projektstruktur

```text
LabFlow/
├── backend/
│   └── src/
│       ├── main/java/de/fhaachen/labflow/
│       │   ├── domain/
│       │   ├── application/
│       │   ├── adapter/rest/
│       │   ├── adapter/storage/
│       │   ├── security/
│       │   └── config/
│       └── test/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── features/
│       └── lib/
├── identity/
├── infra/
├── ci/
├── .gitlab-ci.yml
├── compose.yaml
├── div.sh
└── stop.sh
```

## Autoren

Zakaria Sabiri, Fihi Saad und Othmane Tayani<br />
Large Scale IT & Cloud Computing, FH Aachen, Campus Jülich

Betreuung: Prof. Thomas Eifert und Dr. Marius Politze
