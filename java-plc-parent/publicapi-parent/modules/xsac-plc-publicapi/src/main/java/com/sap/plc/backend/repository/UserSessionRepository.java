package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.UserSession;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
@Lazy
public interface UserSessionRepository extends JpaRepository<UserSession, String> {

    UserSession findByUserId(String userId);
}
