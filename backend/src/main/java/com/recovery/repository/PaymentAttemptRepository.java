package com.recovery.repository;

import com.recovery.domain.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    List<PaymentAttempt> findByCaseIdOrderByTimestampAsc(String caseId);
    List<PaymentAttempt> findByPaymentIdOrderByTimestampAsc(String paymentId);
}
