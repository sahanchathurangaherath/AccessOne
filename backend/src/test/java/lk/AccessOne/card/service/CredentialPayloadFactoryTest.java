package lk.AccessOne.card.service;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.RequestType;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure unit tests -- no Spring context, no database. Confirms the two
 * design decisions that matter: the QR carries the serial and nothing
 * else, and a tampered NFC payload fails to decode rather than decoding
 * to something wrong (AES-GCM is authenticated).
 */
class CredentialPayloadFactoryTest {

    // 32 zero bytes, base64 -- a valid AES-256 key length, test-only.
    private static final String TEST_KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private final CredentialPayloadFactory factory =
            new CredentialPayloadFactory(TEST_KEY, "https://accessone.local/verify");

    private IdCard card(String serial) {
        Department dept = new Department("FIN", "Finance", null);
        Employee employee = new Employee("EMP001", "Nimal", "Perera", "982345678V",
                "nimal@accessone.lk", null, "Software Engineer", dept, LocalDate.now());
        CardRequest request = CardRequest.draft("REQ-2026-9001", employee, RequestType.NEW,
                null, null, null, null);
        return IdCard.generate(serial, request, employee, null, (short) 1, null);
    }

    @Test
    void qrPayloadCarriesOnlyTheVerifyUrlAndSerial() {
        String payload = factory.qrPayload(card("ACO-2026-000010"));

        // No name, no NIC -- a QR is readable by anyone with a phone.
        assertThat(payload).isEqualTo("https://accessone.local/verify/ACO-2026-000010");
    }

    @Test
    void qrHashIsDeterministicAndChangesWithThePayload() {
        String hashA = factory.qrHash("payload-a");
        String hashB = factory.qrHash("payload-a");
        String hashC = factory.qrHash("payload-b");

        assertThat(hashA).isEqualTo(hashB);
        assertThat(hashA).isNotEqualTo(hashC);
        assertThat(hashA).hasSize(64);   // SHA-256 hex digest, matches NCHAR(64)
    }

    @Test
    void nfcPayloadDecodesBackToTheOriginalRecord() {
        IdCard card = card("ACO-2026-000010");

        String encrypted = factory.nfcPayload(card);
        String decoded = factory.decodeNfc(encrypted);

        assertThat(decoded).isEqualTo("ACO-2026-000010|1|" + card.getIssueDate());
    }

    @Test
    void twoEncryptionsOfTheSameCardProduceDifferentCiphertext() {
        IdCard card = card("ACO-2026-000010");

        // A fresh random IV per call means the ciphertext differs even
        // though the plaintext record is identical.
        assertThat(factory.nfcPayload(card)).isNotEqualTo(factory.nfcPayload(card));
    }

    @Test
    void tamperedNfcPayloadFailsToDecodeRatherThanDecodingWrong() {
        String payload = factory.nfcPayload(card("ACO-2026-000010"));
        byte[] bytes = Base64.getDecoder().decode(payload);
        bytes[bytes.length - 1] ^= 0x01;   // flip one bit in the GCM tag
        String tampered = Base64.getEncoder().encodeToString(bytes);

        assertThatThrownBy(() -> factory.decodeNfc(tampered))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void fiftyGeneratedNfcPayloadsAreAllDistinct() {
        IdCard card = card("ACO-2026-000010");

        Set<String> payloads = new HashSet<>();
        IntStream.range(0, 50).forEach(i -> payloads.add(factory.nfcPayload(card)));

        assertThat(payloads).hasSize(50);
    }
}
