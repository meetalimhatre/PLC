package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.ActiveUsersPerMonthProjection;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Calendar;
import java.util.List;

import static com.sap.plc.backend.config.ConfigConstants.CLOUD_FOUNDRY;
import static com.sap.plc.backend.config.ConfigConstants.XSA;

@Profile({CLOUD_FOUNDRY, XSA})
@Repository
@Lazy
public interface HanaUserActivityRepository extends UserActivityRepository {

    @Override
    @Modifying
    @Query(nativeQuery = true, value =
            "UPSERT \"sap.plc.db::basis.t_user_activity\" (\"USER_ID\", \"LAST_ACTIVITY_TIME\") \n" +
                    "VALUES (:userId, CURRENT_UTCTIMESTAMP) \n" +
                    "WHERE USER_ID = :userId AND LAST_ACTIVITY_TIME BETWEEN \n" +
                    "(ADD_MONTHS(NEXT_DAY(LAST_DAY(CURRENT_UTCTIMESTAMP)), -1)) \n" +
                    "    AND \n" +
                    "    (ADD_NANO100(NEXT_DAY(LAST_DAY(CURRENT_UTCTIMESTAMP)), -1))")
    void trackUserActivity(@Param("userId") String userId);

    @Override
    @Query(nativeQuery = true, value =
            "SELECT \n" +
                    "EXTRACT(YEAR FROM last_activity_time) AS YEAR, \n" +
                    "EXTRACT(MONTH FROM last_activity_time) AS MONTH, \n" +
                    "COUNT(DISTINCT user_id) AS COUNT \n" +
                    "FROM \"sap.plc.db::basis.t_user_activity\" \n" +
                    "WHERE last_activity_time BETWEEN :startCalendar \n" +
                    "AND :endCalendar \n" +
                    "GROUP BY EXTRACT(YEAR FROM last_activity_time),\n" +
                    "EXTRACT(MONTH FROM last_activity_time)")
    List<ActiveUsersPerMonthProjection> findActiveUsersPerMonth(@Param("startCalendar") Calendar startCalendar,
                                                                @Param("endCalendar") Calendar endCalendar);
}
