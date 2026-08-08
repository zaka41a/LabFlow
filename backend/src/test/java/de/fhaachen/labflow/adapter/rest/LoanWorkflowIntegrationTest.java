package de.fhaachen.labflow.adapter.rest;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LoanWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void completesTheWorkflowAcrossAllThreeAuthenticatedRoles() throws Exception {
        MockHttpSession borrower = login("borrower@labflow.local", "Borrower2026!");
        MvcResult creation = mockMvc.perform(post("/api/loan-requests")
                        .session(borrower)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "equipmentId": "20000000-0000-0000-0000-000000000006",
                                  "purpose": "Automatisierter Integrationstest des Ausleihprozesses",
                                  "requestedFrom": "2026-08-12",
                                  "requestedUntil": "2026-08-14"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        String requestId = JsonPath.read(creation.getResponse().getContentAsString(), "$.id");
        assertThat(requestId).isNotBlank();

        mockMvc.perform(post("/api/loan-requests/{requestId}/submit", requestId)
                        .session(borrower)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        MockHttpSession manager = login("manager@labflow.local", "Manager2026!");
        mockMvc.perform(post("/api/approvals/{requestId}/approve", requestId)
                        .session(manager)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dueDate\":\"2026-08-14\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        MockHttpSession technician = login("technician@labflow.local", "Technician2026!");
        mockMvc.perform(post("/api/handover/{requestId}/checkout", requestId)
                        .session(technician)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condition\":\"FAULTLESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_OUT"));

        mockMvc.perform(post("/api/handover/{requestId}/return", requestId)
                        .session(technician)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condition\":\"MINOR_WEAR\",\"notes\":\"Leichte Gebrauchsspuren\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"));

        mockMvc.perform(get("/api/loan-requests").session(borrower))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$[?(@.id == '%s' && @.status == 'RETURNED')]",
                        requestId
                ).isNotEmpty());

        mockMvc.perform(get("/api/loan-requests/{requestId}", requestId).session(borrower))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId))
                .andExpect(jsonPath("$.status").value("RETURNED"));

        mockMvc.perform(get("/api/audit-events").session(manager))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.loanRequestId == '%s')]", requestId).isNotEmpty())
                .andExpect(jsonPath(
                        "$[?(@.loanRequestId == '%s' && @.actorRole == 'TECHNICIAN')]",
                        requestId
                ).isNotEmpty());
    }

    @Test
    void requiresManagerVerificationForSafetyRestrictedEquipment() throws Exception {
        MockHttpSession borrower = login("borrower@labflow.local", "Borrower2026!");

        mockMvc.perform(post("/api/loan-requests")
                        .session(borrower)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "equipmentId": "20000000-0000-0000-0000-000000000009",
                                  "purpose": "Aufbereitung von Laborproben für die Versuchsreihe",
                                  "requestedFrom": "2026-08-18",
                                  "requestedUntil": "2026-08-20"
                                }
                                """))
                .andExpect(status().isConflict());

        MvcResult creation = mockMvc.perform(post("/api/loan-requests")
                        .session(borrower)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "equipmentId": "20000000-0000-0000-0000-000000000009",
                                  "purpose": "Aufbereitung von Laborproben für die Versuchsreihe",
                                  "qualificationEvidence": "Zentrifugenunterweisung am 03.08.2026 absolviert",
                                  "requestedFrom": "2026-08-18",
                                  "requestedUntil": "2026-08-20"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessPolicy").value("QUALIFICATION_REQUIRED"))
                .andReturn();
        String requestId = JsonPath.read(creation.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(post("/api/loan-requests/{requestId}/submit", requestId)
                        .session(borrower)
                        .with(csrf()))
                .andExpect(status().isOk());

        MockHttpSession manager = login("manager@labflow.local", "Manager2026!");
        mockMvc.perform(post("/api/approvals/{requestId}/approve", requestId)
                        .session(manager)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dueDate": "2026-08-20",
                                  "accessRequirementVerified": false
                                }
                                """))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/approvals/{requestId}/approve", requestId)
                        .session(manager)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dueDate": "2026-08-20",
                                  "accessRequirementVerified": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.accessRequirementVerified").value(true))
                .andExpect(jsonPath("$.accessVerifiedByName").value("Fihi Saad"));
    }

    private MockHttpSession login(String username, String password) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .param("username", username)
                        .param("password", password))
                .andExpect(status().isNoContent())
                .andReturn();
        return (MockHttpSession) login.getRequest().getSession(false);
    }
}
