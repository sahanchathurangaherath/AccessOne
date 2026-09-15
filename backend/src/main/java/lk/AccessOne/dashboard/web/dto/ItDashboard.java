package lk.AccessOne.dashboard.web.dto;

import java.util.List;

public record ItDashboard(
        long activeCards, long revokedCards, long awaitingGeneration, long activeAccessLevels,
        List<DeptCardStatus> byDepartment) {

    /** Sourced from dbo.v_card_status_summary. */
    public record DeptCardStatus(
            String deptCode, String deptName, int totalCards, int activeCards, int revokedCards) { }
}
