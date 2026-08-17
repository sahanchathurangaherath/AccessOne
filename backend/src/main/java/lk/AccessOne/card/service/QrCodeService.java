package lk.AccessOne.card.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class QrCodeService {

    public byte[] png(String payload, int size) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(
                    payload, BarcodeFormat.QR_CODE, size, size,
                    Map.of(
                        // A printed card gets scratched. Level M recovers from
                        // roughly 15% damage; L would not survive a wallet.
                        EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                        EncodeHintType.MARGIN, 1));

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("QR generation failed", e);
        }
    }
}
