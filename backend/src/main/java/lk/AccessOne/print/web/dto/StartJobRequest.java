package lk.AccessOne.print.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StartJobRequest(@NotBlank @Size(max = 60) String printerName) { }
