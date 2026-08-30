package com.recovery.repository;

import com.recovery.domain.RecoveryPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecoveryPolicyRepository extends JpaRepository<RecoveryPolicy, Long> {
    Optional<RecoveryPolicy> findByName(String name);
}
