package com.recovery.repository;

import com.recovery.domain.AgentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentAuditLogRepository extends JpaRepository<AgentAuditLog, Long> {
    List<AgentAuditLog> findByCaseIdOrderByTimestampAsc(String caseId);
    List<AgentAuditLog> findAllByOrderByTimestampDesc();
}
