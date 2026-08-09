package lk.AccessOne.access.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AssignmentDto(Long id, Long cardId, String levelCode, String levelName,
                            String assignedBy, LocalDate validFrom,
                            LocalDateTime revokedAt, boolean current, String remarks) { }
