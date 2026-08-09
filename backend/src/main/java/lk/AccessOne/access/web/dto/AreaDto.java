package lk.AccessOne.access.web.dto;

public record AreaDto(Long id, String areaCode, String areaName, String building,
                      String floorNo, boolean restricted, boolean active,
                      String description, int levelCount) { }
