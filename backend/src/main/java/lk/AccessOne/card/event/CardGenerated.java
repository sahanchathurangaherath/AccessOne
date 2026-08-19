package lk.AccessOne.card.event;

/** Nobody subscribes yet -- Module 6 will, once print jobs exist. */
public record CardGenerated(Long cardId, Long employeeId, String cardSerial) { }
