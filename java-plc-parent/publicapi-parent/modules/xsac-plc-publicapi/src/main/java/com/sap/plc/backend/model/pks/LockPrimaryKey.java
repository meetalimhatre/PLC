package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import com.sap.plc.backend.model.PrimaryKey;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class LockPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 4903834364692125171L;

    private String lockObject;
    private String userId;

    public LockPrimaryKey() {
    }

    public LockPrimaryKey(String lockObject, String userId) {
        super();
        this.lockObject = lockObject;
        this.userId = userId;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        LockPrimaryKey lockPK = (LockPrimaryKey) o;

        return new EqualsBuilder()
                .append(lockObject, lockPK.lockObject)
                .append(userId, lockPK.userId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(lockObject)
                .append(userId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("lockObject", lockObject)
                .append("userId", userId)
                .toString();
    }
}