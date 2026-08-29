package lk.AccessOne.shared.event;

import java.time.LocalDateTime;

/**
 * Observer pattern.
 *
 * Modules publish facts about what happened; other modules subscribe to
 * the ones they care about. The approval module does not know that a
 * card-generation listener exists, and it was not changed when one was
 * added weeks later.
 *
 * Implemented with Spring's ApplicationEventPublisher rather than a
 * hand-rolled listener registry -- the framework already provides
 * transaction-phase binding (AFTER_COMMIT vs. the same transaction),
 * which a hand-rolled version would not.
 *
 * The timestamp is worth carrying on the event itself: a listener running
 * after commit sometimes needs to know when the thing actually happened,
 * not when it was notified, and those two moments are not the same instant.
 */
public interface DomainEvent {

    LocalDateTime occurredAt();
}
