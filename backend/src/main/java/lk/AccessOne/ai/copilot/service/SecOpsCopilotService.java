package lk.AccessOne.ai.copilot.service;

import lk.AccessOne.ai.config.AiProperties;
import lk.AccessOne.ai.copilot.tools.SecOpsTools;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SecOpsCopilotService {

    private static final Logger log = LoggerFactory.getLogger(SecOpsCopilotService.class);

    private static final Pattern CARD_SERIAL_PATTERN = Pattern.compile("ACO-\\d{4}-\\d{6}", Pattern.CASE_INSENSITIVE);
    private static final Pattern PASS_NO_PATTERN = Pattern.compile("VP-\\d{4}-\\d{6}", Pattern.CASE_INSENSITIVE);

    private final AiProperties aiProperties;
    private final SecOpsTools secOpsTools;

    public SecOpsCopilotService(AiProperties aiProperties, SecOpsTools secOpsTools) {
        this.aiProperties = aiProperties;
        this.secOpsTools = secOpsTools;
    }

    public record CopilotExecutionResult(
        String answerMarkdown,
        String toolInvoked,
        String parametersExtracted,
        long executionTimeMs
    ) {}

    /**
     * Executes conversational natural language query against corporate physical security telemetry.
     */
    public CopilotExecutionResult processQuery(String userPrompt, String officerUsername) {
        long start = System.currentTimeMillis();
        String prompt = userPrompt != null ? userPrompt.trim() : "";
        String lower = prompt.toLowerCase();

        String answer;
        String toolUsed = "HeuristicIntentResolver";
        String params = "";

        // 1. Detect Card Audit Request
        Matcher cardMatcher = CARD_SERIAL_PATTERN.matcher(prompt);
        if (cardMatcher.find() || lower.contains("audit") || lower.contains("serial") || lower.contains("card")) {
            String serial = cardMatcher.find() ? cardMatcher.group() : extractCardSerialFallback(prompt);
            if (serial != null) {
                toolUsed = "SecOpsTools.getCardAuditSummary";
                params = "cardSerial=" + serial;
                answer = secOpsTools.getCardAuditSummary(serial);
            } else {
                answer = "Please specify a valid card serial number (e.g., `ACO-2026-000030`) to generate an incident audit summary.";
            }
        }
        // 2. Detect Visitor Queries
        else if (lower.contains("visitor") || lower.contains("guest") || lower.contains("checked out") || lower.contains("on-site") || lower.contains("floor")) {
            toolUsed = "SecOpsTools.findActiveVisitors";
            params = "filterFloor=ALL";
            answer = secOpsTools.findActiveVisitors(null);
        }
        // 3. Detect Security Alerts / Incident Queries
        else if (lower.contains("alert") || lower.contains("incident") || lower.contains("threat") || lower.contains("denial") || lower.contains("impossible")) {
            toolUsed = "SecOpsTools.getSecurityAlertsSummary";
            params = "status=OPEN";
            answer = secOpsTools.getSecurityAlertsSummary();
        }
        // General Assistant fallback
        else {
            toolUsed = "SecOpsCopilot.Help";
            answer = """
                ### AccessOne SecOps Conversational Copilot
                I can assist you with real-time physical access queries and forensic security investigations:
                
                - **Active Visitors**: *"Show me all visitors currently on-site"*
                - **Card Incident Audit**: *"Generate an incident audit summary for card serial #ACO-2026-000030"*
                - **Alert Telemetry**: *"Show me active security alerts and impossible travel warnings"*
                - **Gate Statistics**: *"Summarize repeated turnstile denials for today"*
                
                How can I assist your physical security operations right now?
                """;
        }

        long elapsed = System.currentTimeMillis() - start;
        return new CopilotExecutionResult(answer, toolUsed, params, elapsed);
    }

    private String extractCardSerialFallback(String text) {
        Matcher m = Pattern.compile("ACO[\\w\\d-]+", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) return m.group().toUpperCase();
        return null;
    }
}
