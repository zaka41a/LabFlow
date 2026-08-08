package de.fhaachen.labflow.security;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LabFlowOidcRoleMappingPropertiesTest {

    @Test
    void resolvesConfiguredIdentitiesCaseInsensitively() {
        LabFlowOidcRoleMappingProperties mapping = mapping(
                List.of("zaka41a"),
                List.of("SaadFihi"),
                List.of("othmane022-jj")
        );

        assertThat(mapping.roleFor(Set.of("saadfihi", "3992")))
                .isEqualTo(LabFlowRole.LAB_MANAGER);
    }

    @Test
    void rejectsUnknownIdentities() {
        LabFlowOidcRoleMappingProperties mapping = mapping(
                List.of("zaka41a"),
                List.of(),
                List.of()
        );

        assertThatThrownBy(() -> mapping.roleFor(Set.of("unknown-user")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no LabFlow role assignment");
    }

    @Test
    void rejectsAmbiguousRoleAssignments() {
        LabFlowOidcRoleMappingProperties mapping = mapping(
                List.of("zaka41a"),
                List.of("zaka41a"),
                List.of()
        );

        assertThatThrownBy(() -> mapping.roleFor(Set.of("zaka41a")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("multiple LabFlow role assignments");
    }

    private static LabFlowOidcRoleMappingProperties mapping(
            List<String> borrowers,
            List<String> managers,
            List<String> technicians
    ) {
        return new LabFlowOidcRoleMappingProperties(
                borrowers,
                managers,
                technicians,
                "FH_AACHEN",
                "Labor FH Aachen"
        );
    }
}
