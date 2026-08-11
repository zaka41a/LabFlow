# LabFlow Architektur

| Merkmal | Stand |
| --- | --- |
| Dokument | Technische Architektur und Deployment |
| Version | 1.0 |
| Datum | 11. August 2026 |
| Modul | Large Scale IT and Cloud Computing |
| Projektteam | Zakaria Sabiri, Fihi Saad, Othmane Tayani |

## 1 Zweck und Abgrenzung

Dieses Dokument beschreibt die implementierte Architektur von LabFlow. Es dient als technische Grundlage für Entwicklung, Betrieb, Prüfung und Projektübergabe. Maßgeblich sind die Klassen, Konfigurationen und Automatisierungsschritte im Repository. Fachliche Sollvorstellungen, die nicht implementiert sind, werden nicht als Systembestandteil dargestellt.

LabFlow bildet die Ausleihe von Laborgeräten vom Entwurf bis zur dokumentierten Rückgabe ab. Die Anwendung unterscheidet Borrower, Lab Manager und Technician. Jede geschützte Aktion wird serverseitig anhand von Rolle, Laborzuordnung und bei Borrowern zusätzlich anhand der Eigentümerschaft des Antrags geprüft.

## 2 Systemkontext

```mermaid
flowchart LR
    Borrower[Borrower]
    Manager[Lab Manager]
    Technician[Technician]
    Browser[Browser mit React SPA]
    Web[Nginx Reverse Proxy]
    API[Spring Boot REST API]
    IdP[OpenID Connect Provider]
    Storage[Azure Blob Storage]

    Borrower --> Browser
    Manager --> Browser
    Technician --> Browser
    Browser -->|HTTP und Sitzungscookie| Web
    Web -->|Statische Dateien| Browser
    Web -->|API und OAuth Callback| API
    API <-->|Authorization Code Flow| IdP
    API <-->|JSON Dokumente, Bilder und ETags| Storage
```

Nginx ist der einzige öffentlich erreichbare Anwendungseinstieg. Der Reverse Proxy liefert das gebaute React Frontend aus und leitet API sowie OAuth Callback an Spring Boot weiter. Die API hält die serverseitige Sitzung, führt die Fachlogik aus und greift über Repository Ports auf Azure Blob Storage zu.

## 3 Bausteinsicht

```mermaid
flowchart TB
    subgraph Frontend[frontend]
        Pages[features: dashboard, requests, approvals, handover, auth]
        Components[components: AppShell, Tabellen, Formulare, Statusanzeigen]
        Client[lib: API Client, Typen, Navigation, Formatierung]
        Pages --> Components
        Pages --> Client
    end

    subgraph Backend[backend]
        Rest[adapter.rest]
        Application[application]
        Domain[domain]
        StorageAdapter[adapter.storage]
        Security[security]
        WebSupport[web]

        Rest --> Application
        Application --> Domain
        StorageAdapter -. implementiert Ports .-> Application
        Rest --> Security
        Security --> WebSupport
        Rest --> WebSupport
    end

    Client -->|HTTP JSON und Multipart| Rest
    StorageAdapter -->|Azure SDK| Blob[(Blob Container labflow)]
    Security -->|OIDC| Provider[Keycloak lokal oder GitLab in Azure]
```

| Baustein | Verantwortung | Zentrale Implementierung |
| --- | --- | --- |
| React Frontend | Rollenabhängige Arbeitsbereiche, Eingabevalidierung, Ladezustände und API Aufrufe | `frontend/src/features`, `frontend/src/components`, `frontend/src/lib` |
| REST Adapter | HTTP Vertrag, DTO Abbildung, Statuscodes und Problem Details | `backend/src/main/java/de/fhaachen/labflow/adapter/rest` |
| Application | Anwendungsfälle, Rollen und Laborkontext, Transaktionsreihenfolge | `EquipmentService`, `LoanRequestService` |
| Domain | Entitäten, Zustände, Invarianten und erlaubte Übergänge | `backend/src/main/java/de/fhaachen/labflow/domain` |
| Storage Adapter | JSON Serialisierung, Blob Prefixes, ETags und Bilder | `backend/src/main/java/de/fhaachen/labflow/adapter/storage` |
| Security | Lokale Anmeldung, OIDC, Rollenzuordnung, Sitzung und Endpunktschutz | `backend/src/main/java/de/fhaachen/labflow/security` |
| Infrastructure | Azure Ressourcen und VM Basiskonfiguration | `infra` |
| Delivery | Tests, Images, Provisionierung, Deployment und Verifikation | `.gitlab-ci.yml`, `ci` |

Die Abhängigkeitsrichtung verläuft von technischen Adaptern zur Anwendung und zur Domäne. Domain Klassen importieren weder Spring noch das Azure SDK. Repository Interfaces liegen in der Application Schicht. Dadurch lassen sich In Memory und Azure Implementierungen gegeneinander austauschen.

## 4 Fachliches Klassenmodell

```mermaid
classDiagram
    class Equipment {
        +UUID id
        +String labId
        +String name
        +EquipmentType type
        +String serialNumber
        +EquipmentStatus status
        +EquipmentAccessPolicy accessPolicy
        +String requiredQualification
        +String imageUrl
        +long revision
        +isAvailable() boolean
        +requiresAccessVerification() boolean
        +withStatus(EquipmentStatus) Equipment
    }

    class LoanRequest {
        +UUID id
        +String reference
        +UUID equipmentId
        +UUID borrowerId
        +String borrowerName
        +String labId
        +String purpose
        +LoanStatus status
        +LocalDate requestedFrom
        +LocalDate requestedUntil
        +LocalDate dueDate
        +String qualificationEvidence
        +long revision
        +submit(Instant) LoanRequest
        +approve(LocalDate, AccessVerification, Instant) LoanRequest
        +reject(String, Instant) LoanRequest
        +cancel(Instant) LoanRequest
        +checkout(Instant) LoanRequest
        +returnEquipment(Instant) LoanRequest
    }

    class CheckoutRecord {
        +UUID id
        +UUID loanRequestId
        +String labId
        +UUID checkedOutBy
        +EquipmentCondition checkoutCondition
        +Instant checkedOutAt
        +UUID returnedBy
        +EquipmentCondition returnCondition
        +Instant returnedAt
        +long revision
        +completeReturn(...) CheckoutRecord
    }

    class AuditEvent {
        +UUID id
        +String labId
        +UUID loanRequestId
        +AuditAction action
        +UUID actorId
        +String actorName
        +String actorRole
        +String details
        +Instant occurredAt
    }

    class AccessVerification {
        +UUID verifiedBy
        +String verifiedByName
        +Instant verifiedAt
    }

    class AuthenticatedActor {
        +UUID id
        +String username
        +String displayName
        +String labId
        +String role
    }

    class EquipmentStatus {
        <<enumeration>>
        AVAILABLE
        RESERVED
        CHECKED_OUT
        MAINTENANCE
    }

    class LoanStatus {
        <<enumeration>>
        DRAFT
        SUBMITTED
        APPROVED
        REJECTED
        CANCELLED
        CHECKED_OUT
        RETURNED
    }

    class EquipmentAccessPolicy {
        <<enumeration>>
        OPEN
        INSTRUCTION_REQUIRED
        QUALIFICATION_REQUIRED
    }

    class EquipmentCondition {
        <<enumeration>>
        FAULTLESS
        MINOR_WEAR
        REVIEW_REQUIRED
    }

    Equipment "1" <-- "0..*" LoanRequest : equipmentId
    LoanRequest "1" <-- "0..1" CheckoutRecord : loanRequestId
    LoanRequest "1" <-- "0..*" AuditEvent : loanRequestId
    LoanRequest "1" o-- "0..1" AccessVerification
    AuthenticatedActor ..> LoanRequest : führt Aktion aus
    Equipment --> EquipmentStatus
    Equipment --> EquipmentAccessPolicy
    LoanRequest --> LoanStatus
    CheckoutRecord --> EquipmentCondition
```

`Equipment`, `LoanRequest` und `CheckoutRecord` sind versionierte Dokumente. Jede fachliche Änderung erzeugt eine neue unveränderliche Record Instanz mit erhöhter Revision. `AuditEvent` ist append only und wird nie aktualisiert. `AuthenticatedActor` ist keine lokale Benutzerentität, sondern die für einen Anwendungsfall benötigte Sicht auf die authentifizierte Identität.

## 5 Geschäftsprozess

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Borrower erstellt Antrag
    DRAFT --> SUBMITTED: Borrower reicht ein
    SUBMITTED --> APPROVED: Lab Manager genehmigt
    SUBMITTED --> REJECTED: Lab Manager lehnt ab
    DRAFT --> CANCELLED: Borrower storniert
    SUBMITTED --> CANCELLED: Borrower storniert
    APPROVED --> CANCELLED: Borrower storniert
    APPROVED --> CHECKED_OUT: Technician dokumentiert Ausgabe
    CHECKED_OUT --> RETURNED: Technician dokumentiert Rückgabe
    REJECTED --> [*]
    CANCELLED --> [*]
    RETURNED --> [*]
```

```mermaid
sequenceDiagram
    actor B as Borrower
    actor M as Lab Manager
    actor T as Technician
    participant UI as React Frontend
    participant API as Spring Boot API
    participant S as LoanRequestService
    participant R as Repository Ports
    participant Blob as Azure Blob Storage

    B->>UI: Gerät und Zeitraum auswählen
    UI->>API: POST /api/loan-requests
    API->>S: createDraft(..., actor)
    S->>R: Antrag und AuditEvent speichern
    R->>Blob: JSON mit Schreibbedingung
    UI->>API: POST /api/loan-requests/{id}/submit
    API->>S: submit(id, actor)

    M->>UI: Offene Freigaben öffnen
    UI->>API: POST /api/approvals/{id}/approve
    API->>S: approve(id, dueDate, verification, actor)
    S->>R: Antrag APPROVED und Gerät RESERVED

    T->>UI: Ausgabe dokumentieren
    UI->>API: POST /api/handover/{id}/checkout
    API->>S: checkout(id, condition, notes, actor)
    S->>R: Antrag, Gerät, CheckoutRecord und AuditEvent

    T->>UI: Rückgabe dokumentieren
    UI->>API: POST /api/handover/{id}/return
    API->>S: returnEquipment(id, condition, notes, actor)
    S->>R: RETURNED und AVAILABLE oder MAINTENANCE
```

Die Genehmigung reserviert das Gerät. Vor Genehmigung und Ausgabe wird die Verfügbarkeit erneut geprüft. Eingeschränkte Geräte verlangen einen Nachweis im Antrag und eine explizite Bestätigung durch den Lab Manager. Eine Rückgabe mit `REVIEW_REQUIRED` versetzt das Gerät in `MAINTENANCE`.

## 6 Rollen und Autorisierung

| Funktion | Borrower | Lab Manager | Technician |
| --- | :---: | :---: | :---: |
| Geräte im eigenen Labor lesen | Ja | Ja | Ja |
| Eigenen Antrag erstellen, einreichen oder stornieren | Ja | Nein | Nein |
| Eingereichte Anträge des eigenen Labors entscheiden | Nein | Ja | Nein |
| Zugangsvoraussetzung bestätigen | Nein | Ja | Nein |
| Gerät mit Bild erfassen | Nein | Nein | Ja |
| Ausgabe und Rückgabe dokumentieren | Nein | Nein | Ja |
| Auditereignisse des eigenen Labors lesen | Nein | Ja | Ja |

Spring Security schützt die URL Bereiche zuerst nach Rolle. `LoanRequestService` prüft anschließend den Laborkontext. Bei Borrowern wird zusätzlich `borrowerId` mit der authentifizierten Identität verglichen. Die Navigation im Frontend spiegelt diese Regeln wider, ersetzt aber keine serverseitige Prüfung.

## 7 Authentifizierung und Sitzung

```mermaid
sequenceDiagram
    actor U as Benutzer
    participant B as Browser
    participant API as Spring Security
    participant IdP as OpenID Connect Provider

    U->>B: Mit LabFlow SSO anmelden
    B->>API: GET /oauth2/authorization/labflow
    API-->>B: Weiterleitung zum Provider
    B->>IdP: Anmeldung und Zustimmung
    IdP-->>B: Authorization Code
    B->>API: GET /login/oauth2/code/labflow
    API->>IdP: Code gegen Token tauschen
    API->>API: Issuer und Identität prüfen, genau eine Rolle zuordnen
    API-->>B: LABFLOW_SESSION und Weiterleitung
    B->>API: Geschützte Anfrage mit Sitzung und CSRF Token
```

Lokal steht Keycloak als OpenID Connect Provider bereit. In Azure wird GitLab als Provider verwendet. GitLab Identitäten werden zuerst über konfigurierte Benutzernamen und danach über direkte Gruppenmitgliedschaften genau einer LabFlow Rolle zugeordnet. Eine fehlende oder mehrdeutige Zuordnung beendet die Anmeldung kontrolliert.

Das Sitzungscookie heißt `LABFLOW_SESSION`, ist `HttpOnly`, verwendet `SameSite=Lax` und läuft nach 30 Minuten Inaktivität ab. Schreibende Browseranfragen verwenden einen CSRF Token. Fehler werden als RFC 9457 Problem Details mit fachlichem Code und Korrelationskennung ausgegeben.

## 8 REST Schnittstelle

| Methode und Pfad | Rolle | Zweck |
| --- | --- | --- |
| `GET /api/auth/config` | Öffentlich | Verfügbare Anmeldearten lesen |
| `GET /api/auth/csrf` | Öffentlich | CSRF Token für die Anmeldung beziehen |
| `POST /api/auth/login` | Öffentlich | Lokale Sitzung starten |
| `GET /api/auth/me` | Authentifiziert | Aktuelle Identität und Rolle lesen |
| `POST /api/auth/logout` | Authentifiziert | Lokale und gegebenenfalls OIDC Sitzung beenden |
| `GET /api/dashboard/summary` | Authentifiziert | Bestandskennzahlen des eigenen Labors lesen |
| `GET /api/equipment` | Authentifiziert | Gerätekatalog des eigenen Labors lesen |
| `POST /api/equipment` | Technician | Gerät und Bild erfassen |
| `GET /api/equipment/{id}/image` | Authentifiziert | Geschütztes Gerätebild lesen |
| `GET, POST /api/loan-requests` | Borrower | Eigene Anträge lesen oder Entwurf anlegen |
| `GET /api/loan-requests/{id}` | Borrower | Eigenen Antrag mit Details lesen |
| `POST /api/loan-requests/{id}/submit` | Borrower | Entwurf einreichen |
| `POST /api/loan-requests/{id}/cancel` | Borrower | Antrag vor Ausgabe stornieren |
| `GET /api/approvals/pending` | Lab Manager | Offene Anträge des Labors lesen |
| `POST /api/approvals/{id}/approve` | Lab Manager | Antrag und Zugangsvoraussetzung genehmigen |
| `POST /api/approvals/{id}/reject` | Lab Manager | Antrag begründet ablehnen |
| `GET /api/handover/pending` | Technician | Geplante Ausgaben und Rückgaben lesen |
| `POST /api/handover/{id}/checkout` | Technician | Ausgabe und Zustand dokumentieren |
| `POST /api/handover/{id}/return` | Technician | Rückgabe und Zustand dokumentieren |
| `GET /api/audit-events` | Lab Manager, Technician | Auditereignisse des eigenen Labors lesen |

## 9 Persistenz

| Datenart | Blob Name |
| --- | --- |
| Gerät | `labs/{labId}/equipment/{equipmentId}.json` |
| Gerätebild | `labs/{labId}/equipment-images/{equipmentId}.bin` |
| Antrag | `labs/{labId}/loan-requests/{requestId}.json` |
| Übergabe | `labs/{labId}/checkout-records/{requestId}.json` |
| Auditereignis | `labs/{labId}/audit-events/{epochMillis}-{eventId}.json` |

Fachliche Dokumente werden mit Jackson als JSON serialisiert. Beim ersten Schreiben setzt `AzureBlobJsonStore` die Bedingung `If-None-Match: *`. Bei einer Aktualisierung muss die Revision genau um eins steigen und das bekannte Blob ETag wird mit `If-Match` übermittelt. Azure Antworten 409 und 412 werden als `ConcurrencyConflictException` auf HTTP 409 abgebildet. Auditereignisse und Bilder werden ausschließlich neu angelegt.

Im lokalen Profil stellen In Memory Repositories einen schnellen Testadapter bereit. Docker Compose verwendet dagegen Azurite mit denselben Azure Blob Schnittstellen. Die Azure Umgebung verwendet einen privaten Blob Container mit aktivierter Versionierung und sieben Tagen Löschaufbewahrung.

## 10 Deployment und Infrastruktur

```mermaid
flowchart TB
    Git[GitLab Repository]
    Runner[GitLab Runner]
    State[GitLab Remote State]

    subgraph Azure[Azure Resource Group]
        ACR[Azure Container Registry]
        VNet[Virtual Network und Subnet]
        NSG[Network Security Group]
        IP[Statische Public IP mit DNS]
        VM[Ubuntu VM mit Docker Compose]
        Blob[Storage Account und privater Blob Container]
        Frontend[Nginx und React Container]
        Backend[Spring Boot Container]

        IP --> Frontend
        Frontend --> Backend
        Backend --> Blob
        VM --- Frontend
        VM --- Backend
        VNet --- VM
        NSG --- VM
        ACR --> VM
    end

    Git --> Runner
    Runner -->|OpenTofu| Azure
    Runner --> State
    Runner -->|ACR Build| ACR
    Runner -->|Azure Run Command| VM
    Backend <-->|OIDC| GitLabIdP[GitLab OpenID Connect]
```

OpenTofu verwaltet Resource Group, Storage Account, privaten Blob Container, Container Registry, virtuelles Netzwerk, Subnetz, Network Security Group, statische Public IP und Linux VM. Port 80 ist für die Webanwendung freigegeben. SSH ist auf den konfigurierten Administrator CIDR begrenzt. Cloud Init installiert Docker und legt den Systemd Dienst `labflow.service` an.

Die Produktionsumgebung startet zwei Anwendungscontainer. Nginx veröffentlicht Port 80 und erreicht Spring Boot im internen Compose Netzwerk. Spring Boot ist nicht direkt aus dem Internet erreichbar. Keycloak und Azurite gehören nur zum lokalen Entwicklungsverbund.

## 11 CI und CD Ablauf

```mermaid
flowchart LR
    Commit[Commit oder Merge Request]
    Tests[Tests und statische Prüfungen]
    Plan[OpenTofu Plan]
    Provision[Azure Provision]
    Images[ACR Image Build]
    Deploy[Deployment auf VM]
    Verify[Health und Revisionsprüfung]
    Destroy[Manueller Teardown]

    Commit --> Tests --> Plan --> Provision --> Images --> Deploy --> Verify
    Verify -. bei Bedarf .-> Destroy
```

| Stufe | Nachweis |
| --- | --- |
| Test | Maven Verify, JUnit Reports, Frontend Formatierung, TypeScript, Vitest, Produktionsbuild, Shell Tests und OpenTofu Validate |
| Plan | Reproduzierbarer OpenTofu Plan mit GitLab Remote State und Sperre |
| Provision | Anwendung des geprüften Plans auf der Azure Kurs Subscription |
| Image | Serverseitiger Build der Backend und Frontend Images in Azure Container Registry |
| Deploy | Pull der unveränderlichen Commit Images und atomarer Neustart des Compose Verbunds |
| Verify | Health Check, Auth Konfiguration, exakter Frontend Asset Hash und OIDC Callback Verhalten |
| Teardown | Manueller OpenTofu Destroy zum kontrollierten Entfernen kostenpflichtiger Ressourcen |

## 12 Qualität und Betriebsfähigkeit

Backend Tests decken Domain Zustandsübergänge, Services, REST Workflow, Security, OIDC Rollenzuordnung und Storage Verhalten ab. Frontend Tests prüfen Anmeldung, Navigation, Rollenansichten, Formulare und Statusdarstellung. Die CI Skripte werden ebenfalls automatisiert getestet.

`/actuator/health` dient als Backend Readiness Signal. Nginx stellt `/healthz` für den externen Health Check bereit. `CorrelationIdFilter` ordnet jeder Anfrage eine Kennung zu. Fehlerantworten enthalten dieselbe Kennung, sodass ein gemeldeter Fehler einem Log Eintrag zugeordnet werden kann.

## 13 Zuordnung zu den Abnahmekriterien

| Kriterium | Architekturbaustein und Nachweis |
| --- | --- |
| Vollständiger Geschäftsprozess | `LoanRequest`, `LoanRequestService`, rollenbezogene React Features |
| Mindestens zwei Rollen | Drei Rollen in `LabFlowRole` und URL Schutz in `SecurityConfiguration` |
| REST API | Controller unter `adapter.rest` mit einheitlichen Problem Details |
| Persistentes Repository | Azure Repository Adapter und `AzureBlobJsonStore` |
| SSO mit OpenID Connect | Spring OAuth2 Client, Keycloak lokal und GitLab in Azure |
| Kontextbasierte Autorisierung | Rollenfilter, Laborkontext und Borrower Eigentümerschaft im Application Service |
| Infrastructure as Code | OpenTofu Konfiguration unter `infra` mit GitLab Remote State |
| Docker und automatisiertes Azure Deployment | Mehrstufige Dockerfiles, GitLab Pipeline, ACR, VM und Verifikationsstufe |

## 14 Architekturentscheidungen

Die serverseitige Sitzung wurde gewählt, damit Tokens nicht im Browser Storage liegen. Repository Ports halten das Azure SDK aus Domain und Application heraus. JSON Dokumente in Object Storage entsprechen dem Kursfokus und machen Prefix, Serialisierung und Konfliktbehandlung explizit. ETags verhindern verlorene Aktualisierungen ohne relationale Datenbank. Commit spezifische Container Tags stellen sicher, dass die verifizierte Revision der getesteten Revision entspricht.

Die Architektur ist für den Projektumfang bewusst kompakt. Eine einzelne VM vermeidet unnötige Plattformkomplexität, während Containergrenzen, externe Identität, persistenter Object Storage und automatisiertes Deployment vollständig sichtbar bleiben.
