package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class UserActivityPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 6347550701599841332L;

    private String userId;
    private Timestamp lastActivityTime;

    public UserActivityPrimaryKey() {
    }

    public UserActivityPrimaryKey(String userId, Timestamp lastActivityTime) {
        this.userId = userId;
        this.lastActivityTime = lastActivityTime;
    }

    public String getUserId() {
        return userId;
    }

    public UserActivityPrimaryKey setUserId(String userId) {
        this.userId = userId;
        return this;
    }

    public Timestamp getLastActivityTime() {
        return lastActivityTime;
    }

    public UserActivityPrimaryKey setLastActivityTime(Timestamp lastActivityTime) {
        this.lastActivityTime = lastActivityTime;
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        UserActivityPrimaryKey that = (UserActivityPrimaryKey) o;

        return new EqualsBuilder()
                .append(userId, that.userId)
                .append(lastActivityTime, that.lastActivityTime)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(userId)
                .append(lastActivityTime)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("userId", userId)
                .append("lastActivityTime", lastActivityTime)
                .toString();
    }
}
