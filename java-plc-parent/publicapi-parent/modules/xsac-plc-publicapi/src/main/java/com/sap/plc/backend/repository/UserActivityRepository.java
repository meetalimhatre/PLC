package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.ActiveUsersPerMonthProjection;
import com.sap.plc.backend.model.UserActivity;
import com.sap.plc.backend.model.pks.UserActivityPrimaryKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.Calendar;
import java.util.List;

@NoRepositoryBean
public interface UserActivityRepository extends JpaRepository<UserActivity, UserActivityPrimaryKey> {

    void trackUserActivity(String userId);

    List<ActiveUsersPerMonthProjection> findActiveUsersPerMonth(Calendar startCalendar, Calendar endCalendar);
}
