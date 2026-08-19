package lk.AccessOne.visitor.web.dto;

/** areaId is optional -- not every checkpoint is tied to a specific restricted area. */
public record CheckInRequest(Long areaId) { }
