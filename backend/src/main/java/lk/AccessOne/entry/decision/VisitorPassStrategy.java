package lk.AccessOne.entry.decision;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.entry.repository.BlacklistRepository;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.DenialReason;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class VisitorPassStrategy implements AccessDecisionStrategy {

    private final VisitorPassRepository passes;
    private final AreaRepository areas;
    private final BlacklistRepository blacklist;

    public VisitorPassStrategy(VisitorPassRepository passes, AreaRepository areas, BlacklistRepository blacklist) {
        this.passes = passes;
        this.areas = areas;
        this.blacklist = blacklist;
    }

    @Override
    public boolean supports(CredentialType type) {
        return type == CredentialType.VISITOR_PASS;
    }

    @Override
    @Transactional(readOnly = true)
    public AccessDecisionResult evaluate(AccessRequest request) {

        Optional<Area> maybeArea = areas.findByAreaCode(request.areaCode());

        // Module 5's fetch-joined query -- level AND its permitted areas.
        Optional<VisitorPass> maybePass = passes.findByPassNoForDecision(request.credentialRef());

        if (maybePass.isEmpty()) {
            return AccessDecisionResult.unknownCredential(
                    CredentialType.VISITOR_PASS,
                    request.credentialRef(),
                    maybeArea.map(Area::getId).orElse(null),
                    maybeArea.map(Area::getAreaName).orElse("Unknown area"));
        }

        VisitorPass pass = maybePass.get();
        String holder = pass.getVisitor().getFullName();

        if (maybeArea.isEmpty()) {
            return AccessDecisionResult.denied(DenialReason.UNKNOWN_AREA,
                    CredentialType.VISITOR_PASS, null, pass.getId(), null,
                    pass.getPassNo(), holder, request.areaCode());
        }
        Area area = maybeArea.get();

        if (blacklist.isVisitorBlacklisted(pass.getVisitor().getId())) {
            return deny(DenialReason.VISITOR_BLACKLISTED, pass, area);
        }

        /*
         * The window is checked here, not read from the stored status. The
         * Module 5 sweep keeps the status tidy for reporting; if security
         * depended on that job having run, a stopped scheduler would keep
         * granting access on expired passes.
         */
        if (!pass.isUsableAt(request.at())) {
            return deny(mapPassDenial(pass, request.at()), pass, area);
        }

        if (!area.isReachable()) {
            return deny(DenialReason.AREA_INACTIVE, pass, area);
        }

        if (!pass.permits(area)) {
            return deny(DenialReason.AREA_NOT_PERMITTED, pass, area);
        }

        return AccessDecisionResult.granted(CredentialType.VISITOR_PASS,
                null, pass.getId(), area.getId(),
                pass.getPassNo(), holder, area.getAreaName());
    }

    private AccessDecisionResult deny(DenialReason reason, VisitorPass pass, Area area) {
        return AccessDecisionResult.denied(reason, CredentialType.VISITOR_PASS,
                null, pass.getId(), area.getId(),
                pass.getPassNo(), pass.getVisitor().getFullName(), area.getAreaName());
    }

    private DenialReason mapPassDenial(VisitorPass pass, LocalDateTime at) {
        if (at.isBefore(pass.getValidFrom())) return DenialReason.PASS_NOT_YET_VALID;
        if (at.isAfter(pass.getValidUntil())) return DenialReason.PASS_EXPIRED;
        return DenialReason.PASS_NOT_ACTIVE;
    }
}
