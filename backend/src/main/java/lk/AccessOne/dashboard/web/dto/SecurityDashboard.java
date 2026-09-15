package lk.AccessOne.dashboard.web.dto;

public record SecurityDashboard(
        long onSiteNow, long openAlerts, long deniedToday, long expiringWithinHour) { }
