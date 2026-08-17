package lk.AccessOne.print.event;

/** Published at handover -- the moment the card becomes usable. A candidate subscriber is employee notification. */
public record CardActivated(Long cardId, String cardSerial, Long receiverId) { }
