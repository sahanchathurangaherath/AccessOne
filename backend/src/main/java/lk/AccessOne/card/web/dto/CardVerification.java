package lk.AccessOne.card.web.dto;

public record CardVerification(
        boolean found, Long cardId, String cardSerial, String status, boolean usable,
        String printedName, String empId, String printedDepartment, String accessLevelName) {

    /**
     * Phase 12 must log an unrecognised credential as a denied attempt, not
     * an error, so an unknown serial returns found=false rather than 404.
     */
    public static CardVerification unknown(String serial) {
        return new CardVerification(false, null, serial, null, false, null, null, null, null);
    }
}
