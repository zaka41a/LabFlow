package de.fhaachen.labflow.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoanRequestTest {

    private static final Instant CREATED_AT = Instant.parse("2026-08-07T08:00:00Z");

    @Test
    void followsTheRegularLifecycle() {
        LoanRequest draft = draft();

        LoanRequest submitted = draft.submit(CREATED_AT.plusSeconds(60));
        LoanRequest approved = submitted.approve(
                LocalDate.of(2026, 8, 20),
                CREATED_AT.plusSeconds(120)
        );
        LoanRequest checkedOut = approved.checkout(CREATED_AT.plusSeconds(180));
        LoanRequest returned = checkedOut.returnEquipment(CREATED_AT.plusSeconds(240));

        assertThat(submitted.status()).isEqualTo(LoanStatus.SUBMITTED);
        assertThat(approved.status()).isEqualTo(LoanStatus.APPROVED);
        assertThat(approved.dueDate()).isEqualTo(LocalDate.of(2026, 8, 20));
        assertThat(checkedOut.status()).isEqualTo(LoanStatus.CHECKED_OUT);
        assertThat(returned.status()).isEqualTo(LoanStatus.RETURNED);
    }

    @Test
    void rejectsInvalidStatusJump() {
        assertThatThrownBy(() -> draft().checkout(CREATED_AT.plusSeconds(60)))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("DRAFT");
    }

    @Test
    void validatesRequestedPeriod() {
        assertThatThrownBy(() -> LoanRequest.draft(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "borrower-1",
                "LAB_A",
                LocalDate.of(2026, 8, 10),
                LocalDate.of(2026, 8, 9),
                CREATED_AT
        )).isInstanceOf(IllegalArgumentException.class);
    }

    private LoanRequest draft() {
        return LoanRequest.draft(
                UUID.fromString("10000000-0000-0000-0000-000000000001"),
                UUID.fromString("20000000-0000-0000-0000-000000000001"),
                "borrower-1",
                "LAB_A",
                LocalDate.of(2026, 8, 10),
                LocalDate.of(2026, 8, 19),
                CREATED_AT
        );
    }
}
