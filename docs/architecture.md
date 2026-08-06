# Architektur

LabFlow verwendet eine klare Trennung zwischen Fachlogik und technischen
Adaptern.

## Backend

- `domain`: Entitäten, Statuswerte und fachliche Invarianten
- `application`: Anwendungsdienste und Repository Ports
- `adapter.rest`: HTTP Endpunkte und DTOs
- `adapter.storage`: zunächst Speicheradapter, später Azure Blob Storage
- `config`: technische Spring Konfiguration und Testdaten

Die Fachobjekte kennen weder Spring noch Azure. Dadurch können die
Geschäftsregeln ohne Infrastruktur getestet werden.

## Frontend

Das Frontend ist eine React Single Page Application. Featuremodule verwenden
TanStack Query für Serverzustand und einen zentralen API Client. Tailwind CSS
stellt Design Tokens und responsive Komponenten bereit.

## Geplante Laufzeitarchitektur

Im Zielzustand laufen API und Weboberfläche in getrennten Containern. Die API
validiert JWT Access Tokens eines OpenID Connect Providers und persistiert
JSON Objekte in Azure Blob Storage. Die Weboberfläche darf Aktionen ausblenden;
die verbindliche Berechtigungsprüfung erfolgt trotzdem immer im Backend.
