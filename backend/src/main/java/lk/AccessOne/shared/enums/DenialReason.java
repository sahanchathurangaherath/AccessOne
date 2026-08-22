package lk.AccessOne.shared.enums;

/**
 * Fixed denial reasons. access_logs.denial_reason is NVARCHAR(60), and
 * chk_accesslogs_reason requires one on every denial.
 *
 * Fixed phrases rather than runtime-assembled strings: they fit the
 * column, they group cleanly in the "denials by reason" report, and a
 * security officer sees the same wording every time.
 */
public enum DenialReason {

    UNKNOWN_CREDENTIAL  ("Credential not recognised"),
    UNKNOWN_AREA        ("Area not recognised"),
    CARD_NOT_ACTIVE     ("Card is not active"),
    CARD_BLACKLISTED    ("Card is blacklisted"),
    VISITOR_BLACKLISTED ("Visitor is blacklisted"),
    EMPLOYEE_NOT_ACTIVE ("Employee no longer employed"),
    NO_ACCESS_LEVEL     ("No access level assigned"),
    AREA_NOT_PERMITTED  ("Access level does not permit this area"),
    AREA_INACTIVE       ("Area is closed"),
    PASS_NOT_ACTIVE     ("Pass is not active"),
    PASS_NOT_YET_VALID  ("Pass is not valid yet"),
    PASS_EXPIRED        ("Pass has expired"),
    NOT_ON_SITE         ("No open visit for this pass");

    private final String text;

    DenialReason(String text) {
        this.text = text;
        assert text.length() <= 60;
    }

    public String text() { return text; }
}