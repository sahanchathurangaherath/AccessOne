package lk.AccessOne.ai.sentinel.domain;

public record AreaCoordinate(
    Long areaId,
    String areaCode,
    String areaName,
    String building,
    String floorNo,
    double x,
    double y
) {
    /**
     * Computes 2D Euclidean distance in meters between this area and another.
     */
    public double distanceTo(AreaCoordinate other) {
        if (other == null) return 0.0;
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
