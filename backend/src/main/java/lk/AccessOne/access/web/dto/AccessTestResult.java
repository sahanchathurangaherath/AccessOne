package lk.AccessOne.access.web.dto;

public record AccessTestResult(boolean granted, String levelName, String areaName,
                               boolean restrictedArea, String denialReason) { }
