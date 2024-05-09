package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.masterdata.Lock;
import com.sap.plc.backend.model.pks.LockPrimaryKey;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface LockRepository extends PLCRepository<Lock, LockPrimaryKey> {

    @Query(value = "SELECT CASE WHEN count(LOCK_OBJECT) > 0 THEN true ELSE false END FROM \"sap.plc.db::basis.t_lock\" " +
            "AS lock INNER JOIN \"sap.plc.db::basis.t_session\" AS session ON session.USER_ID = lock.user_id " +
            "AND lock.LOCK_OBJECT = :lockObject WHERE SECONDS_BETWEEN(session.LAST_ACTIVITY_TIME, CURRENT_TIMESTAMP ) <= " +
            "( SELECT VALUE_IN_SECONDS FROM \"sap.plc.db::basis.t_application_timeout\" " +
            "WHERE APPLICATION_TIMEOUT_ID = 'SessionTimeout' )", nativeQuery = true)
    boolean existsLockByLockObjectAndNotExpiredSession(String lockObject);

    void deleteByLockObject(String lockObject);
}