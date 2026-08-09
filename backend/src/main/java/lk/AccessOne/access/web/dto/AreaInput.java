package lk.AccessOne.access.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AreaInput(
        @NotBlank @Size(max = 15) String areaCode,
        @NotBlank @Size(max = 100) String areaName,
        @Size(max = 60) String building,
        @Size(max = 10) String floorNo,
        boolean restricted,
        @Size(max = 255) String description) { }
