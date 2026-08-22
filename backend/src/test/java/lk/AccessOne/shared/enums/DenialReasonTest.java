package lk.AccessOne.shared.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * access_logs.denial_reason is NVARCHAR(60). A wordy denial reason added
 * later would break the insert at runtime, at a door -- this is the test
 * that catches it at build time instead.
 */
class DenialReasonTest {

    @Test
    void everyDenialReasonFitsTheColumn() {
        for (DenialReason reason : DenialReason.values()) {
            assertThat(reason.text().length()).isLessThanOrEqualTo(60);
        }
    }
}
