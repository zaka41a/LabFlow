package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.AuthenticatedActor;
import de.fhaachen.labflow.security.LabFlowPrincipal;

final class RestActorMapper {

    private RestActorMapper() {
    }

    static AuthenticatedActor from(LabFlowPrincipal principal) {
        return new AuthenticatedActor(
                principal.id(),
                principal.username(),
                principal.displayName(),
                principal.labId(),
                principal.role().name()
        );
    }
}
