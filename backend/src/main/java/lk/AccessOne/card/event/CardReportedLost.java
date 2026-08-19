package lk.AccessOne.card.event;

/** A candidate subscriber is a notifications module, to alert security. */
public record CardReportedLost(Long cardId, Long employeeId) { }
