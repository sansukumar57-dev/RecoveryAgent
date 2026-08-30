package com.recovery.repository;

import com.recovery.domain.RecoveryAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoveryActionRepository extends JpaRepository<RecoveryAction, Long> {
    List<RecoveryAction> findByCaseIdOrderByTimestampAsc(String caseId);
}
