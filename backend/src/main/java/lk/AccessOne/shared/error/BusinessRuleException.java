package lk.AccessOne.shared.error;

/** A rule of the domain was broken. Maps to 409 Conflict. */
public class BusinessRuleException extends RuntimeException {
    private final String code;

    public BusinessRuleException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() { return code; }
}
