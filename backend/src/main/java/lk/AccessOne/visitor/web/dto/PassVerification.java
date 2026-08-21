package lk.AccessOne.visitor.web.dto;

public record PassVerification(
        boolean found, Long passId, String passNo, String status, boolean usable,
        String denialReason, String visitorName, String hostName, String accessLevelName) {

    /** Phase 12 must log an unrecognised pass as a denied attempt, not an error. */
    public static PassVerification unknown(String passNo) {
        return new PassVerification(false, null, passNo, null, false,
                "Pass not recognised.", null, null, null);
    }
}
