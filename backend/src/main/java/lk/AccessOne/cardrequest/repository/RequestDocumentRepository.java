package lk.AccessOne.cardrequest.repository;

import lk.AccessOne.cardrequest.domain.RequestDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestDocumentRepository extends JpaRepository<RequestDocument, Long> {
}
