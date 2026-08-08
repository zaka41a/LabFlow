package de.fhaachen.labflow.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void csrfTokenIsAvailableBeforeAuthentication() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
                .andExpect(jsonPath("$.parameterName").value("_csrf"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void protectedApiRejectsAnonymousRequests() throws Exception {
        mockMvc.perform(get("/api/equipment").header("X-Correlation-ID", "security-test-42"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Authentifizierung erforderlich"))
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"))
                .andExpect(jsonPath("$.correlationId").value("security-test-42"));
    }

    @Test
    void unknownApiRouteReturnsProblemDetailsNotFound() throws Exception {
        mockMvc.perform(get("/api/unknown")
                        .with(user("borrower").roles(LabFlowRole.BORROWER.name())))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void authenticationCapabilitiesAreDiscoverable() throws Exception {
        mockMvc.perform(get("/api/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.localLoginEnabled").value(true))
                .andExpect(jsonPath("$.oidcEnabled").value(false))
                .andExpect(jsonPath("$.oidcLoginUrl").doesNotExist());
    }

    @ParameterizedTest
    @CsvSource({
            "borrower@labflow.local, Borrower2026!, Zakaria Sabiri, BORROWER",
            "manager@labflow.local, Manager2026!, Fihi Saad, LAB_MANAGER",
            "technician@labflow.local, Technician2026!, Othmane Tayani, TECHNICIAN"
    })
    void eachConfiguredAccountCreatesAnAuthenticatedSession(
            String username,
            String password,
            String displayName,
            String role
    ) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .param("username", username)
                        .param("password", password))
                .andExpect(status().isNoContent())
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertThat(session).isNotNull();

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.displayName").value(displayName))
                .andExpect(jsonPath("$.labName").value("Labor FH Aachen"))
                .andExpect(jsonPath("$.roles[0]").value(role))
                .andExpect(jsonPath("$.sessionTimeoutSeconds").value(1800));
    }

    @Test
    void invalidCredentialsDoNotCreateASession() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .param("username", "borrower@labflow.local")
                        .param("password", "incorrect"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Anmeldung fehlgeschlagen"));
    }

    @Test
    void loginRequiresCsrfProtection() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .param("username", "borrower@labflow.local")
                        .param("password", "Borrower2026!"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.title").value("Zugriff verweigert"));
    }

    @Test
    void roleBoundariesAreEnforcedOnTheServer() throws Exception {
        mockMvc.perform(get("/api/approvals/pending")
                        .with(user("borrower").roles(LabFlowRole.BORROWER.name())))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/handover/pending")
                        .with(user("manager").roles(LabFlowRole.LAB_MANAGER.name())))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/loan-requests")
                        .with(user("technician").roles(LabFlowRole.TECHNICIAN.name())))
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyTechniciansCanCreateEquipmentWithAnUploadedImage() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "laborwaage.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
        );
        MockHttpSession borrowerSession = login(
                "borrower@labflow.local",
                "Borrower2026!"
        );

        mockMvc.perform(multipart("/api/equipment")
                        .file(image)
                        .param("name", "Präzisionswaage")
                        .param("type", "LABORATORY_DEVICE")
                        .param("serialNumber", "TST-2026-401")
                        .param("accessPolicy", "QUALIFICATION_REQUIRED")
                        .param("requiredQualification", "Einweisung in die Präzisionswaage")
                        .session(borrowerSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        MockHttpSession technicianSession = login(
                "technician@labflow.local",
                "Technician2026!"
        );
        MvcResult creation = mockMvc.perform(multipart("/api/equipment")
                        .file(image)
                        .param("name", "Präzisionswaage")
                        .param("type", "LABORATORY_DEVICE")
                        .param("serialNumber", "TST-2026-401")
                        .param("accessPolicy", "QUALIFICATION_REQUIRED")
                        .param("requiredQualification", "Einweisung in die Präzisionswaage")
                        .session(technicianSession)
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.labId").value("FH_AACHEN"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.serialNumber").value("TST-2026-401"))
                .andReturn();

        String equipmentId = objectMapper.readTree(creation.getResponse().getContentAsByteArray())
                .get("id")
                .stringValue();
        mockMvc.perform(get("/api/equipment/{equipmentId}/image", equipmentId)
                        .session(technicianSession))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string("Cache-Control", "max-age=2592000, private, immutable"))
                .andExpect(content().bytes(image.getBytes()));
    }

    @Test
    void missingEquipmentImageProducesAControlledValidationError() throws Exception {
        MockHttpSession technicianSession = login(
                "technician@labflow.local",
                "Technician2026!"
        );

        mockMvc.perform(multipart("/api/equipment")
                        .param("name", "Präzisionswaage")
                        .param("type", "LABORATORY_DEVICE")
                        .param("serialNumber", "TST-2026-402")
                        .param("accessPolicy", "OPEN")
                        .session(technicianSession)
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void malformedEquipmentTypeProducesAControlledValidationError() throws Exception {
        MockHttpSession technicianSession = login(
                "technician@labflow.local",
                "Technician2026!"
        );
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "laborwaage.png",
                MediaType.IMAGE_PNG_VALUE,
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
        );

        mockMvc.perform(multipart("/api/equipment")
                        .file(image)
                        .param("name", "Präzisionswaage")
                        .param("type", "UNSUPPORTED_TYPE")
                        .param("serialNumber", "TST-2026-403")
                        .param("accessPolicy", "OPEN")
                        .session(technicianSession)
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void logoutInvalidatesTheAuthenticatedSession() throws Exception {
        MockHttpSession session = login("manager@labflow.local", "Manager2026!");

        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/"));

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    private MockHttpSession login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .param("username", username)
                        .param("password", password))
                .andExpect(status().isNoContent())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }
}
