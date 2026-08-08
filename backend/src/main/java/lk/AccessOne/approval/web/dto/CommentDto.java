package lk.AccessOne.approval.web.dto;

import java.time.LocalDateTime;

public record CommentDto(Long id, String text, String commentedBy, LocalDateTime commentedAt) { }
