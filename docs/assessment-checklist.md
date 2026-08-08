# Abgleich mit der Aufgabenstellung

Diese Matrix ordnet die geforderten Abgabeinhalte direkt den umgesetzten
Artefakten zu. Sie dient zugleich als letzte Kontrolle vor dem Upload in ILIAS
und in das RWTH GitLab Projekt.

| Anforderung                      | Umsetzung und Nachweis                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| IT gestützter Geschäftsprozess   | vollständige Geräteausleihe in `LoanRequestService`, Statusmodell in `domain/LoanRequest.java`                        |
| Mindestens zwei Rollen           | Borrower, Lab Manager und Technician; serverseitige Regeln in `security/SecurityConfiguration.java`                   |
| REST API                         | Controller unter `adapter/rest`, Methodenübersicht im README und Lastenheft                                           |
| Abhängigkeiten über `pom.xml`    | Spring Web MVC, Security, OAuth2 Client, Validation, Actuator und Azure Blob SDK                                      |
| Implementierung der Entities     | Equipment mit Zugangspolicy, LoanRequest mit Qualifikationsprüfung, CheckoutRecord und AuditEvent im Domain Package   |
| Persistentes Repository          | Azure Blob Adapter mit JSON Serialisierung, Labor Prefixes, Revisionen und ETags                                      |
| SSO via OpenID Connect           | Authorization Code Flow mit PKCE, JWT/JWKS Prüfung und Claim Mapping; lokaler Keycloak Realm für den Integrationstest |
| Rollenbasierte Autorisierung     | URL Regeln plus Besitzer- und Laborprüfung im Application Service                                                     |
| Dockerfiles                      | getrennte Multi Stage Images für Backend und Frontend, nicht privilegierte Backend Laufzeit                           |
| Infrastructure as Code           | Resource Group, Storage, ACR, Netzwerk, NSG, VM, Managed Identity und Cloud Init unter `infra/`                       |
| GitLab Automatisierung           | `.gitlab-ci.yml`: Test, Plan, Provision, Image, Deploy, Verify und manueller Destroy                                  |
| Präsentationsdatei               | vorhandene Projektpräsentation wird zusammen mit der Abgabe hochgeladen                                               |
| Lastenheft Geschäftsprozess      | Prozess, Rollen, Entitäten und Zustandsregeln im Lastenheft                                                           |
| Ablaufdiagramm mit API und Rolle | Sequenzdiagramm im Lastenheft; kein Activity Diagram                                                                  |
| Persistenzbeschreibung           | Prefixes, JSON Form, Repositories, ETags und Audit Events im Lastenheft                                               |
| Architektur und Deployment       | Container, Azure Komponenten und Automatisierung im Lastenheft sowie `docs/architecture.md`                           |
| Individuelle Beiträge            | eigener Abschnitt für Zakaria Sabiri, Fihi Saad und Othmane Tayani im Lastenheft                                      |

## Vor der finalen Abgabe

1. Das Repository zusätzlich in die Gruppe
   `https://git-ce.rwth-aachen.de/lsit-2026/students` pushen.
2. Geschützte GitLab Variablen eintragen und die Pipeline bis zum Health Check
   ausführen; kostenpflichtige Ressourcen danach über `azure:destroy` entfernen.
3. Präsentation und finales Lastenheft PDF in ILIAS hochladen.
