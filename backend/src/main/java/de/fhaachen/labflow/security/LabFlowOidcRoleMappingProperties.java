package de.fhaachen.labflow.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@ConfigurationProperties("labflow.security.oidc.mapping")
public record LabFlowOidcRoleMappingProperties(
        List<String> borrowers,
        List<String> managers,
        List<String> technicians,
        String labId,
        String labName
) {
    public LabFlowOidcRoleMappingProperties {
        borrowers = normalize(borrowers);
        managers = normalize(managers);
        technicians = normalize(technicians);
        labId = defaultIfBlank(labId, "FH_AACHEN");
        labName = defaultIfBlank(labName, "Labor FH Aachen");
    }

    public LabFlowRole roleFor(Set<String> identityClaims) {
        Set<String> normalizedClaims = normalize(identityClaims);
        EnumSet<LabFlowRole> matches = EnumSet.noneOf(LabFlowRole.class);

        if (matchesAny(normalizedClaims, borrowers)) {
            matches.add(LabFlowRole.BORROWER);
        }
        if (matchesAny(normalizedClaims, managers)) {
            matches.add(LabFlowRole.LAB_MANAGER);
        }
        if (matchesAny(normalizedClaims, technicians)) {
            matches.add(LabFlowRole.TECHNICIAN);
        }

        if (matches.size() != 1) {
            throw new IllegalArgumentException(
                    matches.isEmpty()
                            ? "OIDC identity has no LabFlow role assignment"
                            : "OIDC identity has multiple LabFlow role assignments"
            );
        }
        return matches.iterator().next();
    }

    private static boolean matchesAny(Set<String> claims, List<String> configuredIdentities) {
        return configuredIdentities.stream().anyMatch(claims::contains);
    }

    private static List<String> normalize(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .map(LabFlowOidcRoleMappingProperties::normalize)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private static Set<String> normalize(Set<String> values) {
        if (values == null) {
            return Set.of();
        }
        Set<String> normalized = new LinkedHashSet<>();
        values.stream()
                .map(LabFlowOidcRoleMappingProperties::normalize)
                .filter(value -> !value.isBlank())
                .forEach(normalized::add);
        return Set.copyOf(normalized);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
