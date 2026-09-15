package lk.AccessOne.shared.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Builds the JSON for audit_logs.old_value and new_value.
 *
 * chk_auditlogs_oldjson and chk_auditlogs_newjson reject anything that is
 * not valid JSON, so string concatenation is a bug waiting for a value
 * containing a quote (a rejection reason, a cancellation note). Jackson
 * escapes correctly, every time.
 */
public final class AuditValue {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final Map<String, Object> fields = new LinkedHashMap<>();

    private AuditValue() { }

    public static AuditValue of() {
        return new AuditValue();
    }

    public static String status(Object value) {
        return of().with("status", value).json();
    }

    public AuditValue with(String key, Object value) {
        fields.put(key, value == null ? null : String.valueOf(value));
        return this;
    }

    /** For values that are themselves lists, e.g. the area codes an access level grants. */
    public AuditValue withList(String key, Iterable<?> values) {
        java.util.List<String> asStrings = new java.util.ArrayList<>();
        values.forEach(v -> asStrings.add(String.valueOf(v)));
        fields.put(key, asStrings);
        return this;
    }

    public String json() {
        try {
            return MAPPER.writeValueAsString(fields);
        } catch (JsonProcessingException e) {
            // Never fail a business operation because auditing could not
            // serialise. Record that something went wrong instead.
            return "{\"error\":\"serialisation failed\"}";
        }
    }
}
