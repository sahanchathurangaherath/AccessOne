package lk.AccessOne.card.service;

import lk.AccessOne.card.domain.IdCard;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Factory pattern -- builds the credential payloads for a card.
 *
 * Everything about *what* goes into a QR or an NFC record lives here, so
 * changing the format is one class rather than a search across the
 * codebase.
 */
@Component
public class CredentialPayloadFactory {

    public static final String ALGORITHM = "AES-256-GCM/BASE64";
    private static final int GCM_TAG_BITS = 128;
    private static final int IV_BYTES = 12;

    private final SecretKeySpec key;
    private final String verifyBaseUrl;
    private final SecureRandom random = new SecureRandom();

    public CredentialPayloadFactory(
            @Value("${accessone.credentials.nfc-key}") String base64Key,
            @Value("${accessone.credentials.qr-base-url}") String verifyBaseUrl) {
        this.key = new SecretKeySpec(Base64.getDecoder().decode(base64Key), "AES");
        this.verifyBaseUrl = verifyBaseUrl;
    }

    /**
     * The QR encodes the serial and nothing else.
     *
     * A QR code is readable by anyone with a phone. Encoding a name or an
     * NIC would publish personal data on the front of a badge. The serial
     * is meaningless without the system, which is the point.
     */
    public String qrPayload(IdCard card) {
        return "%s/%s".formatted(verifyBaseUrl, card.getCardSerial());
    }

    /** SHA-256 of the payload, for tamper detection. UNIQUE in the schema. */
    public String qrHash(String payload) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /**
     * NFC payload: AES-256-GCM over a compact record, Base64 encoded.
     *
     * Encrypted rather than plain because an NFC tag can be read by any
     * phone held near it, without the holder noticing -- unlike a QR, which
     * has to be deliberately presented. GCM is authenticated encryption, so
     * a modified payload fails to decrypt rather than decrypting to
     * something wrong.
     *
     * The IV is prepended to the ciphertext -- it is not secret, but it
     * must be unique per encryption, hence SecureRandom per call.
     */
    public String nfcPayload(IdCard card) {
        String record = "%s|%d|%s".formatted(
                card.getCardSerial(), card.getVersionNo(), card.getIssueDate());
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] cipherText = cipher.doFinal(record.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("NFC payload encryption failed", e);
        }
    }

    /** Proves the payload is real, readable, encrypted data -- used in the viva. */
    public String decodeNfc(String base64) {
        try {
            byte[] combined = Base64.getDecoder().decode(base64);
            byte[] iv = Arrays.copyOfRange(combined, 0, IV_BYTES);
            byte[] cipherText = Arrays.copyOfRange(combined, IV_BYTES, combined.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("NFC payload could not be decoded", e);
        }
    }

    public String nfcFormat() { return "NDEF_TEXT"; }
}
