# Architektur

LabFlow folgt einer Ports-and-Adapters-Struktur. Fachliche Regeln liegen im
inneren Kern; HTTP, Spring Security und Azure Blob Storage bleiben technische
Adapter. Dadurch hängt die Geschäftslogik nicht von einem Framework oder einem
Cloudanbieter ab.

## Backend Schichten

```text
REST Adapter ──> Application Services ──> Domain
                         │
                         ▼
                  Repository Ports
                         ▲
                         │
             In Memory / Azure Blob Adapter
```

- `domain` enthält Equipment, Zugangspolicies, LoanRequest, CheckoutRecord,
  AuditEvent sowie erlaubte Zustandsübergänge.
- `application` orchestriert Use Cases, prüft Besitzer und Laborgrenzen und
  definiert Repository Ports.
- `adapter.rest` übersetzt HTTP Requests in Commands und Domänenantworten.
- `adapter.storage` implementiert dieselben Ports im Speicher oder als
  versionierte JSON-Dokumente in Azure Blob Storage.
- `security` validiert OIDC ID Tokens und Claims, verwaltet lokale Testkonten,
  Sitzungen und rollenbasierte Endpoint Regeln.
- `web` vergibt Korrelationskennungen und erzeugt einheitliche Problem Details.

## Konsistenz des Workflows

Statusänderungen werden ausschließlich durch Methoden des Domainmodells
ausgeführt. Der Application Service koordiniert den Antrag, das Equipment, den
Checkout Record und das Audit Event innerhalb eines synchronisierten Commands.
Zusätzlich besitzt jedes mutable JSON-Dokument eine monotone `revision`. Der
Azure Adapter liest den aktuellen ETag und schreibt bedingt mit `If-Match`;
neue Dokumente verwenden `If-None-Match: *`. Ein paralleler oder veralteter
Schreibversuch liefert kontrolliert HTTP 409 statt Daten zu überschreiben.

Für sensible Geräte definiert `EquipmentAccessPolicy`, ob eine Unterweisung
oder eine formale Qualifikation erforderlich ist. Der Borrower dokumentiert
seinen Nachweis im Antrag. `LoanRequestService` verhindert eine Genehmigung,
bis der Lab Manager die Voraussetzung bestätigt hat; Prüfer, Zeitpunkt und
Nachweis werden mit dem Antrag persistiert und im Audit Event festgehalten.
Auch die Ausgabe prüft diese Invariante erneut.

## Storage Layout

```text
labs/{labId}/equipment/{equipmentId}.json
labs/{labId}/loan-requests/{requestId}.json
labs/{labId}/checkout-records/{requestId}.json
labs/{labId}/audit-events/{timestamp}-{eventId}.json
```

Jeder Repository Adapter liest ausschließlich seinen Objekttyp. Die
Laborzuordnung stammt aus der authentifizierten Sitzung und nicht aus einem vom
Client frei wählbaren Query Parameter.

## Sicherheit

Spring Security unterstützt zwei Einstiege in dieselbe serverseitige Sitzung:
die lokale Entwicklungsanmeldung sowie OpenID Connect Authorization Code mit PKCE.
Beim SSO werden Signatur, Issuer, Ablaufzeit und Nonce des ID Tokens validiert.
`sub`, `email`, `name`, `lab_id`, `lab_name` und `labflow_role` werden in ein
internes Principal abgebildet. Das Cookie ist `HttpOnly`, `SameSite=Lax` und
läuft nach 30 Minuten Inaktivität ab. Schreibende Requests benötigen zusätzlich
den von Spring erzeugten CSRF Token.

Die URL Regeln trennen die drei Rollen. Der Application Service prüft darüber
hinaus Besitzer- und Laborgrenzen, damit auch ein korrekt authentifizierter
Benutzer keine fremden Objekte bearbeiten kann. Das Frontend dient nur der
Benutzerführung und ist keine Sicherheitsgrenze.

## Laufzeit

Lokal laufen Nginx, Spring Boot, Keycloak und Azurite als getrennte Container. In Azure
zieht eine Linux VM die beiden Anwendungsimages mit ihrer Managed Identity aus
ACR. Blob Storage ist privat; nur Port 80 und ein auf eine Administrator-IP
begrenzter SSH-Zugriff sind in der Referenzumgebung freigegeben.

Vor einem Produktiveinsatz ist ein HTTPS-Endpunkt vorzuschalten und
`LABFLOW_SESSION_SECURE=true` zu setzen. Sensible Terraform Variablen gehören
in einen geschützten Remote State und nicht in das Repository.
