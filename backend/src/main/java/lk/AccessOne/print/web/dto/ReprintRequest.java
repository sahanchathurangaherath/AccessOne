package lk.AccessOne.print.web.dto;

import jakarta.validation.constraints.Size;

/** Optional -- the QC failure notes already say what was wrong; this is just extra context for the audit trail. */
public record ReprintRequest(@Size(max = 255) String reason) { }
