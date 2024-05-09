package com.sap.plc.backend.model.masterdata;

import java.sql.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.pks.LockPrimaryKey;

@IdClass(LockPrimaryKey.class)
@jakarta.persistence.Entity
@Table(name = Lock.TABLE_NAME)
public class Lock extends Entity<Lock, LockPrimaryKey> {

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_lock`";
    private static final long serialVersionUID = 2811359801863416405L;

    @Id
    @Column(name = "LOCK_OBJECT", nullable = false, length = 8)
    private String lockObject;

    @Id
    @Column(name = "USER_ID", nullable = false)
    private String userId;

    @Column(name = "LAST_UPDATED_ON", nullable = false)
    private Timestamp lastUpdatedOn;

    public Lock() {
        
    }
    
    public Lock(String lockObject, String userId, Timestamp lastUpdatedOn) {
        super();
        this.lockObject = lockObject;
        this.userId = userId;
        this.lastUpdatedOn = lastUpdatedOn;
    }


    public String getLockObject() {
        return lockObject;
    }


    public void setLockObject(String lockObject) {
        this.lockObject = lockObject;
    }


    public String getUserId() {
        return userId;
    }


    public void setUserId(String userId) {
        this.userId = userId;
    }


    public Timestamp getLastUpdatedOn() {
        return lastUpdatedOn;
    }


    public void setLastUpdatedOn(Timestamp lastUpdatedOn) {
        this.lastUpdatedOn = lastUpdatedOn;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Lock lock = (Lock) o;

        return new EqualsBuilder()
                .append(lockObject, lock.lockObject)
                .append(userId, lock.userId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(lockObject)
                .append(userId)
                .toHashCode();
    }
    
}
