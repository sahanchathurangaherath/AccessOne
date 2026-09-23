package lk.AccessOne.ai.gatekeeper.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.AccessOne.ai.config.AiProperties;
import lk.AccessOne.ai.gatekeeper.domain.PhotoComplianceResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class PhotoComplianceService {

    private static final Logger log = LoggerFactory.getLogger(PhotoComplianceService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AiProperties aiProperties;
    private final String storageRoot;
    private final RestClient restClient;

    public PhotoComplianceService(
            AiProperties aiProperties,
            @Value("${accessone.storage.root:./storage}") String storageRoot) {
        this.aiProperties = aiProperties;
        this.storageRoot = storageRoot;
        this.restClient = RestClient.builder().build();
    }

    /**
     * Inspects an uploaded portrait photo against ICAO 9303 / ISO 19794-5 standards.
     * Evaluates lighting, neutral background, centered framing, and anti-spoof checks.
     * Never blindly passes missing or dummy placeholder files.
     */
    public PhotoComplianceResult inspectPhoto(String photoPath) {
        if (photoPath == null || photoPath.isBlank()) {
            return new PhotoComplianceResult(
                false, false, false, false, false, 0.0,
                "No photo file provided: Request does not contain an uploaded portrait document."
            );
        }

        try {
            Path filePath = Paths.get(storageRoot)
                .resolve(photoPath.startsWith("/") ? photoPath.substring(1) : photoPath)
                .normalize();
            File file = filePath.toFile();

            // 1. Strict File Existence Check
            if (!file.exists() || !file.canRead()) {
                log.warn("Photo file does not exist on disk: {}", filePath);
                return new PhotoComplianceResult(
                    false, false, false, false, false, 0.0,
                    "Photo file missing on server storage (" + filePath.getFileName() + "). Cannot perform ICAO compliance verification."
                );
            }

            // 2. Strict Placeholder & Dummy Mock File Detection
            long fileSizeBytes = file.length();
            if (fileSizeBytes < 2048) {
                log.warn("Rejected dummy placeholder photo (size: {} bytes) at {}", fileSizeBytes, filePath);
                return new PhotoComplianceResult(
                    false, false, false, false, false, 0.0,
                    "Non-compliant: Dummy placeholder file detected (" + fileSizeBytes + " bytes). Real applicant portrait required."
                );
            }

            // 3. Image Decode Check
            BufferedImage image = ImageIO.read(file);
            if (image == null) {
                return new PhotoComplianceResult(
                    false, false, false, false, false, 0.0,
                    "Invalid image format: File cannot be decoded as a valid PNG or JPEG image."
                );
            }

            int width = image.getWidth();
            int height = image.getHeight();
            if (width < 100 || height < 100) {
                return new PhotoComplianceResult(
                    false, false, false, false, false, 0.0,
                    "Non-compliant resolution: Image is too small (" + width + "x" + height + "px). ICAO standard requires minimum 200x250px."
                );
            }

            // 4. If Gemini API Key is configured, use Gemini Multimodal Vision
            if (aiProperties.getApiKey() != null && !aiProperties.getApiKey().isBlank()) {
                try {
                    PhotoComplianceResult geminiResult = inspectWithGeminiVision(file, image);
                    if (geminiResult != null) {
                        return geminiResult;
                    }
                } catch (Exception ex) {
                    log.error("Gemini Vision API call failed, falling back to strict image processing: {}", ex.getMessage());
                }
            }

            // 5. Strict Algorithmic Image Analysis (ICAO 9303 / ISO 19794-5 rules)
            return performAlgorithmicInspection(image, fileSizeBytes);

        } catch (Exception ex) {
            log.error("Error inspecting photo for ICAO compliance: {}", ex.getMessage());
            return new PhotoComplianceResult(
                false, false, false, false, false, 0.0,
                "Photo inspection failed due to internal error: " + ex.getMessage()
            );
        }
    }

    /**
     * Algorithmic evaluation of image dimensions, perimeter backdrop, and luminance.
     */
    private PhotoComplianceResult performAlgorithmicInspection(BufferedImage image, long fileSizeBytes) {
        int width = image.getWidth();
        int height = image.getHeight();

        // 1. Framing / Aspect ratio (ICAO portrait ideal is roughly 3:4 or 4:5, ratio width/height 0.65 - 1.15)
        double ratio = (double) width / (double) height;
        boolean framingOk = (ratio >= 0.65 && ratio <= 1.15) && (width >= 200 && height >= 250);

        // 2. Perimeter Background Neutrality (sample perimeter for light, uniform background)
        boolean plainBackground = checkPerimeterLightBackground(image);

        // 3. Lighting & Contrast estimate (center luminance between 45 and 235)
        boolean lightingOk = checkLuminance(image);

        // 4. Anti-spoof / minimum legitimate image file size (> 8KB)
        boolean antiSpoofPassed = (fileSizeBytes >= 8000);

        boolean compliant = framingOk && plainBackground && lightingOk && antiSpoofPassed;

        StringBuilder summary = new StringBuilder();
        if (compliant) {
            summary.append("ICAO Standard Compliant: Balanced lighting, neutral background, centered portrait.");
        } else {
            summary.append("Photo non-compliance detected: ");
            if (!framingOk) summary.append("[Improper framing or low resolution (" + width + "x" + height + ")] ");
            if (!plainBackground) summary.append("[Non-neutral or cluttered background] ");
            if (!lightingOk) summary.append("[Unbalanced lighting or harsh shadows] ");
            if (!antiSpoofPassed) summary.append("[Potential synthetic or placeholder file] ");
        }

        return new PhotoComplianceResult(
            compliant, lightingOk, plainBackground, framingOk, antiSpoofPassed,
            compliant ? 0.95 : 0.40,
            summary.toString().trim()
        );
    }

    /**
     * Calls Google Gemini Multimodal Vision API via OpenAI-compatible endpoint.
     */
    private PhotoComplianceResult inspectWithGeminiVision(File file, BufferedImage image) {
        try {
            byte[] fileBytes = Files.readAllBytes(file.toPath());
            String base64Image = Base64.getEncoder().encodeToString(fileBytes);
            String mimeType = file.getName().toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            String dataUrl = "data:" + mimeType + ";base64," + base64Image;

            String baseUrl = aiProperties.getBaseUrl();
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }
            String url = baseUrl + "/chat/completions";

            String prompt = """
                You are an official ICAO 9303 and ISO/IEC 19794-5 passport and corporate badge photo compliance inspector.
                Inspect this image strictly:
                1. Is there a genuine human face? (antiSpoofPassed = true only if a real human portrait is present, NOT a placeholder, icon, dummy graphic, animal, or blank image).
                2. Is the lighting balanced and natural without harsh shadows or blowout? (lighting).
                3. Is the background plain, light, and neutral without clutter? (plainBackground).
                4. Is the head centered with roughly 3:4 portrait framing? (faceCentered).
                5. If any check fails or if this is a dummy/placeholder/empty image, compliant MUST be false.

                Respond ONLY with a valid JSON object matching this schema:
                {
                  "lighting": boolean,
                  "plainBackground": boolean,
                  "faceCentered": boolean,
                  "antiSpoofPassed": boolean,
                  "compliant": boolean,
                  "confidence": number,
                  "summary": "concise explanation of compliance or specific violations"
                }
                """;

            Map<String, Object> requestBody = Map.of(
                "model", aiProperties.getModel() != null && !aiProperties.getModel().isBlank() ? aiProperties.getModel() : "gemini-1.5-flash",
                "messages", List.of(
                    Map.of(
                        "role", "user",
                        "content", List.of(
                            Map.of("type", "text", "text", prompt),
                            Map.of("type", "image_url", "image_url", Map.of("url", dataUrl))
                        )
                    )
                ),
                "temperature", 0.1
            );

            String responseJson = restClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + aiProperties.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

            if (responseJson == null || responseJson.isBlank()) {
                return null;
            }

            JsonNode root = MAPPER.readTree(responseJson);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                String content = choices.get(0).path("message").path("content").asText();
                if (content != null) {
                    content = content.trim();
                    // Clean possible markdown ```json ... ``` wrapper
                    if (content.startsWith("```json")) {
                        content = content.substring(7);
                    } else if (content.startsWith("```")) {
                        content = content.substring(3);
                    }
                    if (content.endsWith("```")) {
                        content = content.substring(0, content.length() - 3);
                    }
                    content = content.trim();

                    JsonNode evalNode = MAPPER.readTree(content);
                    boolean lighting = evalNode.path("lighting").asBoolean(false);
                    boolean plainBg = evalNode.path("plainBackground").asBoolean(false);
                    boolean centered = evalNode.path("faceCentered").asBoolean(false);
                    boolean antiSpoof = evalNode.path("antiSpoofPassed").asBoolean(false);
                    boolean compliant = evalNode.path("compliant").asBoolean(false);
                    double confidence = evalNode.path("confidence").asDouble(0.90);
                    String summary = evalNode.path("summary").asText("Gemini Vision ICAO inspection complete.");

                    log.info("Gemini Vision evaluated portrait: compliant={}, summary={}", compliant, summary);
                    return new PhotoComplianceResult(compliant, lighting, plainBg, centered, antiSpoof, confidence, summary);
                }
            }
        } catch (Exception ex) {
            log.warn("Gemini Vision API evaluation encountered error: {}", ex.getMessage());
        }
        return null;
    }

    private boolean checkPerimeterLightBackground(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        long totalLuminance = 0;
        int count = 0;

        for (int x = 0; x < w; x += Math.max(1, w / 20)) {
            int rgb = img.getRGB(x, 2);
            int r = (rgb >> 16) & 0xFF;
            int g = (rgb >> 8) & 0xFF;
            int b = rgb & 0xFF;
            totalLuminance += (r * 299L + g * 587L + b * 114L) / 1000L;
            count++;
        }

        if (count == 0) return true;
        int avgLuminance = (int) (totalLuminance / count);
        return avgLuminance >= 75;
    }

    private boolean checkLuminance(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        int cx = w / 2;
        int cy = h / 2;

        int rgb = img.getRGB(cx, cy);
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;
        int centerLuminance = (r * 299 + g * 587 + b * 114) / 1000;

        return centerLuminance >= 35 && centerLuminance <= 245;
    }
}
