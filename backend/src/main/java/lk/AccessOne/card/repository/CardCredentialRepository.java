package lk.AccessOne.card.repository;

import lk.AccessOne.card.domain.CardCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CardCredentialRepository extends JpaRepository<CardCredential, Long> {

    Optional<CardCredential> findByCardId(Long cardId);
}
