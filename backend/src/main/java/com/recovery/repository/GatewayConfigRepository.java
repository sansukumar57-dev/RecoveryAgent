package com.recovery.repository;

import com.recovery.domain.GatewayConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GatewayConfigRepository extends JpaRepository<GatewayConfig, String> {
}
