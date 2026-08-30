package com.recovery.repository;

import com.recovery.domain.RecoveryCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryCaseRepository extends JpaRepository<RecoveryCase, Long> {
    Optional<RecoveryCase> findByCaseId(String caseId);
    Optional<RecoveryCase> findByPaymentId(String paymentId);
    List<RecoveryCase> findByStatus(String status);
}
