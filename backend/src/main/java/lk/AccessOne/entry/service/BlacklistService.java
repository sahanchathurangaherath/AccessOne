package lk.AccessOne.entry.service;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.entry.domain.BlacklistEntry;
import lk.AccessOne.entry.repository.BlacklistRepository;
import lk.AccessOne.entry.web.dto.BlacklistDto;
import lk.AccessOne.entry.web.dto.BlacklistRow;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.web.PageResponse;
import lk.AccessOne.visitor.domain.Visitor;
import lk.AccessOne.visitor.repository.VisitorRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlacklistService {

    private final BlacklistRepository blacklist;
    private final IdCardRepository cards;
    private final VisitorRepository visitors;
    private final EntryMapper mapper;
    private final EntityLookup lookup;
    private final UserRepository users;

    public BlacklistService(BlacklistRepository blacklist, IdCardRepository cards, VisitorRepository visitors,
                             EntryMapper mapper, EntityLookup lookup, UserRepository users) {
        this.blacklist = blacklist;
        this.cards = cards;
        this.visitors = visitors;
        this.mapper = mapper;
        this.lookup = lookup;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public PageResponse<BlacklistRow> list(Pageable pageable) {
        return PageResponse.of(blacklist.findAllOrdered(pageable),
                b -> mapper.toRow(b, targetType(b), targetRef(b)));
    }

    @Transactional
    public BlacklistDto blacklistCard(Long cardId, String reason) {
        IdCard card = lookup.require(cards, cardId, "Card");
        BlacklistEntry entry = blacklist.save(BlacklistEntry.forCard(cardId, reason, actingUser()));
        return mapper.toDto(entry, "EMPLOYEE_CARD", card.getCardSerial(), card.getPrintedName());
    }

    @Transactional
    public BlacklistDto blacklistVisitor(Long visitorId, String reason) {
        Visitor visitor = lookup.require(visitors, visitorId, "Visitor");
        BlacklistEntry entry = blacklist.save(BlacklistEntry.forVisitor(visitorId, reason, actingUser()));
        return mapper.toDto(entry, "VISITOR", visitor.getVisitorCode(), visitor.getFullName());
    }

    @Transactional
    public BlacklistDto release(Long id) {
        BlacklistEntry entry = lookup.require(blacklist, id, "Blacklist entry");
        entry.release(actingUser());
        return mapper.toDto(entry, targetType(entry), targetRef(entry), targetName(entry));
    }

    private String targetType(BlacklistEntry e) {
        return e.getCardId() != null ? "EMPLOYEE_CARD" : "VISITOR";
    }

    private String targetRef(BlacklistEntry e) {
        if (e.getCardId() != null) {
            return cards.findById(e.getCardId()).map(IdCard::getCardSerial).orElse("Unknown card");
        }
        return visitors.findById(e.getVisitorId()).map(Visitor::getVisitorCode).orElse("Unknown visitor");
    }

    private String targetName(BlacklistEntry e) {
        if (e.getCardId() != null) {
            return cards.findById(e.getCardId()).map(IdCard::getPrintedName).orElse("Unknown");
        }
        return visitors.findById(e.getVisitorId()).map(Visitor::getFullName).orElse("Unknown");
    }

    private User actingUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AccessOneUserDetails details) {
            return users.getReferenceById(details.getUserId());
        }
        throw new BusinessRuleException("NO_ACTING_USER", "No authenticated user to record this action against.");
    }
}
