# LabFlow

### Rollenbasierte Ausleihe von Laborgeräten als durchgängiger, nachvollziehbarer Prozess

LabFlow bündelt Gerätekatalog, Ausleihantrag, Freigabe, Ausgabe und Rückgabe in
einer Webanwendung. Das System verbindet eine fachlich saubere Java API mit
einer modernen Oberfläche und einer reproduzierbaren Azure Infrastruktur.

`Java 21` `Spring Boot` `React` `TypeScript` `Tailwind CSS` `OIDC` `Azure Blob Storage` `Docker` `Terraform`

Modul Large Scale IT, FH Aachen, Campus Jülich

## Was LabFlow macht

Borrower finden verfügbare Laborgeräte und reichen einen Antrag für einen
bestimmten Zeitraum ein. Der zuständige Lab Manager prüft den Antrag innerhalb
seines Labors und genehmigt oder begründet die Ablehnung. Anschließend
dokumentiert ein Technician die Ausgabe, den Gerätezustand und später die
Rückgabe. Jeder erlaubte Statuswechsel wird zentral geprüft und als Audit Event
nachvollziehbar gespeichert.

Die Anwendung ist mandantenähnlich nach Labor getrennt. Eine Rolle allein reicht
nicht für den Zugriff: Die API berücksichtigt zusätzlich die Laborzuordnung aus
dem authentifizierten Benutzerkontext.

## Kernfunktionen

- Gerätekatalog mit Suche, Laborfilter und aktuellem Verfügbarkeitsstatus
- Vollständiger Workflow von `DRAFT` bis `RETURNED`
- Getrennte Arbeitsbereiche für Borrower, Lab Manager und Technician
- Serverseitige Autorisierung nach Rolle, Benutzer und Labor
- OpenID Connect Login mit Authorization Code Flow und PKCE
- JSON Persistenz in Azure Blob Storage hinter austauschbaren Repository Ports
- Audit Trail für fachlich relevante Aktionen und Statuswechsel
- Responsive Weboberfläche mit klaren Lade, Fehler und Leerzuständen
- Health Checks, strukturierte Logs und automatisierte Tests
- Reproduzierbare Container und Azure Infrastruktur mit Terraform
- Automatisierter Build, Test und Deployment Ablauf

## Architektur

Backend und Frontend sind getrennt deploybar. Die Fachlogik kennt weder Spring
MVC noch Azure und kann deshalb isoliert getestet werden.

```text
┌──────────────────────────────┐
│ React Web Application        │  rollenbezogene Arbeitsbereiche
│ TypeScript + Tailwind CSS    │  Query Cache, Formulare, Fehlerzustände
└──────────────┬───────────────┘
               │ HTTPS / JSON
               ▼
┌──────────────────────────────┐
│ Spring Boot REST API         │  Authentifizierung, Autorisierung,
│ Java 21                      │  Use Cases und fachliche Invarianten
└───────┬──────────────┬───────┘
        │              │
        │ Repository   │ OIDC / JWT
        ▼              ▼
┌──────────────────┐  ┌──────────────────────┐
│ Azure Blob       │  │ OpenID Connect       │
│ JSON Objects     │  │ Identity Provider    │
└──────────────────┘  └──────────────────────┘

        Docker Images
              │
              ▼
┌──────────────────────────────┐
│ Azure Infrastructure         │
│ Terraform + CI/CD Pipeline   │
└──────────────────────────────┘
```

Der fachliche Ausleihprozess:

```text
DRAFT ──> SUBMITTED ──> APPROVED ──> CHECKED_OUT ──> RETURNED
   │            │            │
   └─ CANCELLED ├─ REJECTED  └─ CANCELLED
                └─ CANCELLED
```

## Tech Stack

| Schicht | Technologie |
|---|---|
| Backend | Java 21, Spring Boot, Spring MVC, Bean Validation |
| Security | Spring Security, OAuth 2.0 Resource Server, OpenID Connect |
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Persistenz | Azure Blob Storage, JSON Dokumente |
| Tests | JUnit 5, AssertJ, Spring Boot Test, Vitest, Testing Library |
| Container | Docker, Docker Compose |
| Infrastructure | Azure, Terraform |
| Delivery | Maven, npm, GitLab CI |

## Repository Layout

```text
LabFlow_project/
|-- backend/
|   |-- src/main/java/de/fhaachen/labflow/
|   |   |-- domain/             Fachobjekte, Status und Invarianten
|   |   |-- application/        Use Cases und Repository Ports
|   |   |-- adapter/rest/       REST Endpunkte und API DTOs
|   |   |-- adapter/storage/    In Memory und Azure Blob Adapter
|   |   `-- config/             technische Spring Konfiguration
|   `-- src/test/               Domain und Integrationstests
|-- frontend/
|   |-- src/components/         wiederverwendbare UI Bausteine
|   |-- src/features/           fachliche Seiten nach Arbeitsbereich
|   |-- src/lib/                API Client, Typen und Formatierung
|   `-- src/test/               Testkonfiguration
|-- docs/                       Architektur und Projektdokumentation
|-- infra/                      Terraform Module und Umgebungen
|-- compose.yaml                lokale Laufzeitumgebung
`-- .gitlab-ci.yml              Build, Test, Images und Deployment
```

## Quick Start

### Gesamtes System starten

Voraussetzungen sind Docker Desktop und `curl`. Ein Befehl baut die Images,
startet Spring Boot, die Weboberfläche und den lokalen Azure Storage Emulator
und wartet auf alle Health Checks:

```bash
./div.sh
```

Danach sind folgende Dienste erreichbar:

| Dienst | Adresse |
|---|---|
| Weboberfläche | `http://localhost:5173` |
| REST API | `http://localhost:8080/api` |
| Spring Boot Health Check | `http://localhost:8080/actuator/health` |
| Azurite Blob Endpoint | `http://localhost:10000/devstoreaccount1` |

Alle Container werden mit einem Befehl sauber beendet. Das lokale
Azurite Datenvolume bleibt dabei erhalten:

```bash
./stop.sh
```

### Backend einzeln starten

```bash
cd backend
mvn spring-boot:run
```

Die API läuft unter `http://localhost:8080`. Der Health Check ist unter
`http://localhost:8080/actuator/health` erreichbar.

### Frontend einzeln starten

```bash
cd frontend
npm install
npm run dev
```

Die Weboberfläche läuft unter `http://localhost:5173`. Vite leitet Anfragen an
`/api` in der lokalen Entwicklung an das Backend weiter.

### Qualitätsprüfungen ausführen

```bash
cd backend
mvn test

cd ../frontend
npm test
npm run typecheck
npm run build
```

## Aktueller Stand

Der erste ausführbare Inkrement enthält das fachliche Grundmodell, validierte
Statusübergänge, Repository Ports, einen In Memory Adapter, REST Endpunkte für
Gerätekatalog und Dashboard sowie die responsive Weboberfläche in Blau, Weiß
und Grün. Die Arbeitsbereiche für Anträge, Freigaben und Übergaben sind als
vollständige, interaktive Oberflächen vorbereitet.

Frontend, Backend und Azurite können bereits reproduzierbar als gehärtete
Container gestartet werden. Die folgenden Inkremente verbinden die
Oberflächen mit dem vollständigen Workflow und ergänzen OIDC, den Azure Blob
Adapter, Audit Events, Terraform und die Deployment Pipeline.

## Autoren

Zakaria Sabiri, Fihi Saad und Othmane Tayani

Large Scale IT, FH Aachen, Campus Jülich

Betreuung: Prof. Thomas Eifert und Marius Politze
