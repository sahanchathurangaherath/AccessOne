package lk.AccessOne.entry.decision;

import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.DenialReason;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AccessDecisionResultTest {

    @Test
    void unknownCredentialStillCarriesLoggableValues() {
        AccessDecisionResult decision = AccessDecisionResult.unknownCredential(
                CredentialType.EMPLOYEE_CARD, "BOGUS-1", null, "Lobby");

        // access_logs.holder_name is NOT NULL, even for an unknown credential
        assertThat(decision.holderName()).isNotBlank();
        assertThat(decision.granted()).isFalse();
        assertThat(decision.denialReason()).isEqualTo(DenialReason.UNKNOWN_CREDENTIAL);
        assertThat(decision.areaName()).isEqualTo("Lobby");
    }

    @Test
    void grantedCarriesNoDenialReason() {
        AccessDecisionResult decision = AccessDecisionResult.granted(
                CredentialType.EMPLOYEE_CARD, 1L, null, 2L, "ACO-2026-000001", "Nimal Perera", "Lobby");

        assertThat(decision.granted()).isTrue();
        assertThat(decision.denialReason()).isNull();
    }
}
