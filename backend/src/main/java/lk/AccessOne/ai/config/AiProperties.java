package lk.AccessOne.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "accessone.ai")
public class AiProperties {

    /** Master toggle for the optional AI Gatekeeper, Sentinel, and Copilot subsystem. */
    private boolean enabled = true;

    /** Optional LLM / Vision API key (e.g. OpenAI or Gemini OpenAI-compatible). */
    private String apiKey = "";

    /** Model identifier for text and multimodal vision evaluations. */
    private String model = "gpt-4o-mini";

    /** Base URL for AI API (defaults to OpenAI compatible endpoint). */
    private String baseUrl = "https://api.openai.com/v1";

    /** Sentinel spatio-temporal velocity configuration. */
    private Sentinel sentinel = new Sentinel();

    public static class Sentinel {
        /** Maximum realistic walking / transit speed in km/h before flagging impossible travel. */
        private double maxSpeedKmh = 15.0;

        /** Window in seconds to evaluate consecutive scans for impossible travel. */
        private int evaluationWindowSeconds = 300;

        public double getMaxSpeedKmh() { return maxSpeedKmh; }
        public void setMaxSpeedKmh(double maxSpeedKmh) { this.maxSpeedKmh = maxSpeedKmh; }

        public int getEvaluationWindowSeconds() { return evaluationWindowSeconds; }
        public void setEvaluationWindowSeconds(int evaluationWindowSeconds) { this.evaluationWindowSeconds = evaluationWindowSeconds; }
    }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public Sentinel getSentinel() { return sentinel; }
    public void setSentinel(Sentinel sentinel) { this.sentinel = sentinel; }
}
