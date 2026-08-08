package de.fhaachen.labflow.security;

import java.security.Principal;
import java.util.UUID;

public interface LabFlowPrincipal extends Principal {

    UUID id();

    String username();

    String displayName();

    String labId();

    String labName();

    LabFlowRole role();
}
