package lk.AccessOne.entry.service;

import lk.AccessOne.entry.decision.AccessDecisionResult;
import lk.AccessOne.entry.decision.AccessDecisionStrategy;
import lk.AccessOne.entry.decision.AccessRequest;
import lk.AccessOne.entry.domain.AccessLog;
import lk.AccessOne.entry.event.AccessEvaluated;
import lk.AccessOne.entry.repository.AccessLogRepository;
import lk.AccessOne.entry.web.dto.AccessLogRow;
import lk.AccessOne.entry.web.dto.AccessResult;
import lk.AccessOne.entry.web.dto.DenialSummary;
import lk.AccessOne.shared.enums.AccessDecision;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * The single decision entry point. Both credential types (Strategy
 * pattern) resolve through this one method, and the caller does no
 * branching at all.
 */
@Service
public class AccessDecisionService {

    private final List<AccessDecisionStrategy> strategies;
    private final AccessLogRepository accessLogs;
    private final ApplicationEventPublisher events;
    private final EntryMapper mapper;

    public AccessDecisionService(List<AccessDecisionStrategy> strategies, AccessLogRepository accessLogs,
                                  ApplicationEventPublisher events, EntryMapper mapper) {
        // Spring injects every implementation. Adding a third credential
        // type later means adding one class and changing nothing here.
        this.strategies = List.copyOf(strategies);
        this.accessLogs = accessLogs;
        this.events = events;
        this.mapper = mapper;
    }

    /**
     * The caller passes a credential reference and an area code; it does
     * not know or care which credential type it is holding.
     */
    @Transactional
    public AccessResult evaluate(AccessRequest request) {

        CredentialType type = inferType(request.credentialRef());

        AccessDecisionResult decision = strategies.stream()
                .filter(s -> s.supports(type))
                .findFirst()
                .map(s -> s.evaluate(request))
                .orElseGet(() -> AccessDecisionResult.unknownCredential(
                        type, request.credentialRef(), null, "Unknown area"));

        AccessLog log = accessLogs.save(AccessLog.from(decision, request));

        // Listeners handle alerting. The engine's job is to decide and
        // record; deciding whether something is suspicious is separate
        // work with its own rules.
        events.publishEvent(new AccessEvaluated(log.getId(), decision, request));

        return new AccessResult(
                decision.granted(),
                decision.granted() ? null : decision.denialReason().text(),
                decision.holderName(), decision.areaName(),
                log.getId(), request.at());
    }

    @Transactional(readOnly = true)
    public PageResponse<AccessLogRow> logs(String credentialRef, Long areaId, AccessDecision decision,
                                            LocalDate from, LocalDate to, Pageable pageable) {
        LocalDateTime fromDt = from == null ? null : from.atStartOfDay();
        LocalDateTime toDt = to == null ? null : to.atTime(LocalTime.MAX);
        return PageResponse.of(
                accessLogs.search(credentialRef, areaId, decision, fromDt, toDt, pageable),
                mapper::toRow);
    }

    @Transactional(readOnly = true)
    public List<DenialSummary> denialsByReason(LocalDate from) {
        LocalDateTime fromDt = from == null ? null : from.atStartOfDay();
        return accessLogs.denialsByReason(fromDt).stream()
                .map(r -> new DenialSummary(r.getDenialReason(), r.getCnt()))
                .toList();
    }

    /**
     * Card serials are ACO-YYYY-NNNNNN (Module 4); visitor pass numbers are
     * VP-YYYY-NNNN (Module 5). A real reader would know which credential
     * it read; this prefix check is the simulator's stated simplification
     * of that fact, not a claim about how real hardware would work.
     */
    private CredentialType inferType(String ref) {
        return ref != null && ref.toUpperCase().startsWith("VP-")
                ? CredentialType.VISITOR_PASS
                : CredentialType.EMPLOYEE_CARD;
    }
}
