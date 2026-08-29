package lk.AccessOne.entry.service;

import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.decision.AccessDecisionStrategy;
import lk.AccessOne.entry.decision.AccessRequest;
import lk.AccessOne.entry.repository.AccessLogRepository;
import lk.AccessOne.entry.web.dto.AccessResult;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.Direction;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Strategy pattern, verified rather than asserted.
 *
 * A genuinely new CredentialType would also need shared/enums/CredentialType
 * and the access_logs.credential_type CHECK constraint updated -- a
 * data-model decision, not a service-code one. What these tests prove is
 * narrower and is the part that actually matters here: evaluate() contains
 * no branch on which concrete strategy runs. Dispatch is entirely
 * List<AccessDecisionStrategy> plus supports(), which is exactly the
 * mechanism that lets Spring add a class to that list -- as the second
 * test's stub does by hand -- with no other change to this service.
 */
class AccessDecisionServiceTest {

    private final AccessLogRepository accessLogs = mock(AccessLogRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final EntryMapper mapper = mock(EntryMapper.class);

    @Test
    void aStrategyAddedToTheListIsUsedWithNoChangeToTheService() {
        when(accessLogs.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Written the way Spring would inject a real, newly-added
        // implementation -- a plain list entry, nothing registered anywhere
        // else. The service does not know this class exists until now.
        AccessDecisionStrategy addedLater = new AccessDecisionStrategy() {
            @Override public boolean supports(CredentialType type) { return type == CredentialType.EMPLOYEE_CARD; }
            @Override public AccessDecisionResult evaluate(AccessRequest request) {
                return AccessDecisionResult.granted(CredentialType.EMPLOYEE_CARD,
                        1L, null, 2L, request.credentialRef(), "Someone", "Lobby");
            }
        };
        AccessDecisionService service = new AccessDecisionService(
                List.of(addedLater), accessLogs, events, mapper);

        AccessResult result = service.evaluate(AccessRequest.now("ACO-2026-000001", "A-LOBBY", Direction.IN));

        assertThat(result.granted()).isTrue();
    }

    /**
     * Phase 12 silently reused unknownCredential() here, which hides a
     * missing strategy behind the same result as a credential that simply
     * does not exist in the database -- two different failures collapsed
     * into one. Failing loudly at startup-adjacent code is better than a
     * mysterious denial at a door.
     */
    @Test
    void aCredentialTypeWithNoRegisteredStrategyFailsLoudlyInsteadOfDenyingSilently() {
        AccessDecisionStrategy onlyHandlesCards = new AccessDecisionStrategy() {
            @Override public boolean supports(CredentialType type) { return type == CredentialType.EMPLOYEE_CARD; }
            @Override public AccessDecisionResult evaluate(AccessRequest request) {
                throw new AssertionError("should not be reached for a visitor pass");
            }
        };
        AccessDecisionService service = new AccessDecisionService(
                List.of(onlyHandlesCards), accessLogs, events, mapper);

        assertThatThrownBy(() ->
                service.evaluate(AccessRequest.now("VP-2026-0001", "A-LOBBY", Direction.IN)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("VISITOR_PASS");
    }
}
