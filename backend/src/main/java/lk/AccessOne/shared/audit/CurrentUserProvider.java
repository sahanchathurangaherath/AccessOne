package lk.AccessOne.shared.audit;

public interface CurrentUserProvider {
    /** Username of the acting user, or SYSTEM for background work. */
    String currentUsername();

    /** Database id of the acting user, or null when not a logged-in user. */
    Long currentUserId();
}
