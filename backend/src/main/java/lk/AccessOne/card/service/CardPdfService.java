package lk.AccessOne.card.service;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lk.AccessOne.card.domain.CardCredential;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.storage.FileStorageService;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.Base64;

/**
 * One HTML template serves both the on-screen preview (the frontend renders
 * the same layout at card proportions) and this PDF. Two layouts would
 * drift out of sync with each other.
 */
@Service
public class CardPdfService {

    /**
     * One family per script, not one shared family for all three files.
     * openhtmltopdf's per-character fallback works across the CSS
     * font-family *list* (card-layout.html declares all three, in order) --
     * registering three different physical fonts under one identical family
     * name does not build a fallback chain, it just makes the last useFont()
     * call for that family win, silently dropping the earlier two.
     */
    private static final String LATIN_FONT_FAMILY = "Noto Sans";
    private static final String SINHALA_FONT_FAMILY = "Noto Sans Sinhala";
    private static final String TAMIL_FONT_FAMILY = "Noto Sans Tamil";
    private static final String MONO_FONT_FILE = "NotoSansMono-Regular.ttf";

    private final TemplateEngine templateEngine;
    private final QrCodeService qrCodes;
    private final FileStorageService storage;

    public CardPdfService(TemplateEngine templateEngine, QrCodeService qrCodes,
                           FileStorageService storage) {
        this.templateEngine = templateEngine;
        this.qrCodes = qrCodes;
        this.storage = storage;
    }

    public byte[] render(IdCard card, CardCredential credential) {
        Context context = new Context();
        context.setVariable("card", new CardPrintModel(
                card.getPrintedName(), card.getPrintedDesignation(), card.getPrintedDepartment(),
                card.getEmployee().getEmpId(), card.getCardSerial()));
        context.setVariable("qrDataUri", dataUri("image/png",
                qrCodes.png(credential.getQrPayload(), 400)));
        context.setVariable("photoDataUri", photoDataUri(card));

        String html = templateEngine.process("card-layout", context);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();

            // Without a font that covers the script, Sinhala and Tamil names
            // render as empty boxes in the PDF -- the browser preview looks
            // fine, which makes this trivially easy to miss until the demo.
            // Each script gets its own family (card-layout.html lists all
            // three on the body's font-family, in fallback order); every
            // weight the template actually uses (.name is 600) is registered
            // for every family, since a bold run with no matching weight
            // falls back to a built-in font with no script coverage at all.
            registerFamily(builder, "NotoSans-Regular.ttf", LATIN_FONT_FAMILY);
            registerFamily(builder, "NotoSansSinhala-Regular.ttf", SINHALA_FONT_FAMILY);
            registerFamily(builder, "NotoSansTamil-Regular.ttf", TAMIL_FONT_FAMILY);
            builder.useFont(() -> fontStream(MONO_FONT_FILE), "Noto Sans Mono", 400, FontStyle.NORMAL, true);

            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (IOException e) {
            throw new BusinessRuleException("PDF_FAILED", "The card file could not be produced. Try again.");
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

    private String photoDataUri(IdCard card) {
        if (card.getPhotoPath() == null) return "";
        try {
            byte[] bytes = Files.readAllBytes(storage.resolve(card.getPhotoPath()));
            String mime = card.getPhotoPath().endsWith(".png") ? "image/png" : "image/jpeg";
            return dataUri(mime, bytes);
        } catch (IOException e) {
            return "";
        }
    }

    private String dataUri(String mime, byte[] bytes) {
        return "data:%s;base64,%s".formatted(mime, Base64.getEncoder().encodeToString(bytes));
    }
}
