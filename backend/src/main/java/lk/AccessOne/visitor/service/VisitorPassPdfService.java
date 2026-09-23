package lk.AccessOne.visitor.service;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lk.AccessOne.card.service.QrCodeService;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.visitor.domain.VisitorPass;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
public class VisitorPassPdfService {

    private static final String LATIN_FONT_FAMILY = "Noto Sans";
    private static final String SINHALA_FONT_FAMILY = "Noto Sans Sinhala";
    private static final String TAMIL_FONT_FAMILY = "Noto Sans Tamil";
    private static final String MONO_FONT_FILE = "NotoSansMono-Regular.ttf";

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TemplateEngine templateEngine;
    private final QrCodeService qrCodes;

    public VisitorPassPdfService(TemplateEngine templateEngine, QrCodeService qrCodes) {
        this.templateEngine = templateEngine;
        this.qrCodes = qrCodes;
    }

    public record VisitorPassModel(
            String visitorName,
            String company,
            String idDocType,
            String idDocNo,
            String hostName,
            String purpose,
            String passNo,
            String validFrom,
            String validUntil,
            String clearanceLevel
    ) {}

    public byte[] render(VisitorPass pass) {
        Context context = new Context();
        context.setVariable("pass", new VisitorPassModel(
                pass.getVisitor().getFullName(),
                pass.getVisitor().getCompany() != null ? pass.getVisitor().getCompany() : "",
                pass.getVisitor().getIdDocumentType() != null ? pass.getVisitor().getIdDocumentType().name() : "ID",
                pass.getVisitor().getIdDocumentNo(),
                pass.getHostEmployee().getFullName(),
                pass.getPurpose(),
                pass.getPassNo(),
                pass.getValidFrom().format(DATE_TIME_FORMATTER),
                pass.getValidUntil().format(DATE_TIME_FORMATTER),
                pass.getAccessLevel() != null ? pass.getAccessLevel().getLevelName() : "General"
        ));
        context.setVariable("qrDataUri", dataUri("image/png", qrCodes.png(pass.getQrPayload(), 400)));

        String html = templateEngine.process("visitor-pass-layout", context);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();

            registerFamily(builder, "NotoSans-Regular.ttf", LATIN_FONT_FAMILY);
            registerFamily(builder, "NotoSansSinhala-Regular.ttf", SINHALA_FONT_FAMILY);
            registerFamily(builder, "NotoSansTamil-Regular.ttf", TAMIL_FONT_FAMILY);
            builder.useFont(() -> fontStream(MONO_FONT_FILE), "Noto Sans Mono", 400, FontStyle.NORMAL, true);

            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (IOException e) {
            throw new BusinessRuleException("PDF_FAILED", "The visitor pass PDF could not be generated.");
        }
    }

    private void registerFamily(PdfRendererBuilder builder, String fontFile, String family) {
        builder.useFont(() -> fontStream(fontFile), family, 400, FontStyle.NORMAL, true);
        builder.useFont(() -> fontStream(fontFile), family, 600, FontStyle.NORMAL, true);
        builder.useFont(() -> fontStream(fontFile), family, 700, FontStyle.NORMAL, true);
    }

    private InputStream fontStream(String fileName) {
        InputStream in = getClass().getResourceAsStream("/fonts/" + fileName);
        if (in == null) {
            throw new IllegalStateException(
                    "Font not bundled: src/main/resources/fonts/" + fileName
                            + " -- download the Noto fonts before generating a PDF.");
        }
        return in;
    }

    private String dataUri(String mime, byte[] bytes) {
        return "data:%s;base64,%s".formatted(mime, Base64.getEncoder().encodeToString(bytes));
    }
}
