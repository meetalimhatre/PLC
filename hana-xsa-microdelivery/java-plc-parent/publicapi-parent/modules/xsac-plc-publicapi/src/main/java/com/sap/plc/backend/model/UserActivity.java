package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.UserActivityPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.UserActivity.TABLE_NAME;

@IdClass(UserActivityPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class UserActivity {
    static final String TABLE_NAME = "`sap.plc.db::basis.t_user_activity`";

    @Column(name = "USER_ID", nullable = false, length = 50)
    @Id
    private String userId;

    @Column(name = "LAST_ACTIVITY_TIME", nullable = false)
    @Id
    private Timestamp lastActivityTime;

    public UserActivity() {
    }

    public UserActivity(String userId, Timestamp lastActivityTime) {
        this.userId = userId;
        this.lastActivityTime = lastActivityTime;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Timestamp getLastActivityTime() {
        return lastActivityTime;
    }

    public void setLastActivityTime(Timestamp lastActivityTime) {
        this.lastActivityTime = lastActivityTime;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        UserActivity that = (UserActivity) o;

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
}
