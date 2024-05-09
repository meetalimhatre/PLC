package com.sap.plc.backend.model;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.UserSession.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME)
public class UserSession {
    static final String TABLE_NAME = "`sap.plc.db::basis.t_session`";

    @Column(name = "SESSION_ID", nullable = false)
    @Id
    private String sessionId;

    @Column(name = "USER_ID", nullable = false)
    private String userId;

    @Column(name = "LANGUAGE", nullable = false)
    private String language;

    @Column(name = "LAST_ACTIVITY_TIME", nullable = false)
    private Timestamp lastActivity;

    public UserSession(String sessionId, String userId, String language, Timestamp lastActivity) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.language = language;
        this.lastActivity = lastActivity;
    }

    public UserSession() {
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Timestamp getLastActivity() {
        return lastActivity;
    }

    public void setLastActivity(Timestamp lastActivity) {
        this.lastActivity = lastActivity;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        UserSession that = (UserSession) o;

        return new EqualsBuilder()
                .append(sessionId, that.sessionId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(sessionId)
                .toHashCode();
    }
}
