package lk.AccessOne.ai.gatekeeper.domain;

/**
 * Inspection report according to ICAO / ISO 19794-5 portrait specifications.
 */
public record PhotoComplianceResult(
    boolean compliant,
    boolean lightingOk,
    boolean plainBackground,
    boolean faceCentered,
    boolean antiSpoofPassed,
    double confidence,
    String summary
) {
    public static PhotoComplianceResult passing(String summary) {
        return new PhotoComplianceResult(true, true, true, true, true, 0.98, summary);
    }

    public static PhotoComplianceResult flagged(boolean lighting, boolean bg, boolean centered, boolean antiSpoof, String summary) {
        boolean ok = lighting && bg && centered && antiSpoof;
        return new PhotoComplianceResult(ok, lighting, bg, centered, antiSpoof, 0.75, summary);
    }
}
