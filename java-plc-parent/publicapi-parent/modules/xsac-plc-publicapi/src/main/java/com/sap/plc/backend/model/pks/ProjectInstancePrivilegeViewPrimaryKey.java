package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class ProjectInstancePrivilegeViewPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -1170710929103545690L;

    private String projectId;

    private String userId;

    public ProjectInstancePrivilegeViewPrimaryKey() {
    }

    public ProjectInstancePrivilegeViewPrimaryKey(String projectId, String userId) {
        this.projectId = projectId;
        this.userId = userId;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getUserId() {
        return userId;
    }

    public ProjectInstancePrivilegeViewPrimaryKey setProjectId(String projectId) {
        this.projectId = projectId;
        return this;
    }

    public ProjectInstancePrivilegeViewPrimaryKey setUserId(String userId) {
        this.userId = userId;
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

        ProjectInstancePrivilegeViewPrimaryKey that = (ProjectInstancePrivilegeViewPrimaryKey) o;

        return new EqualsBuilder()
                .append(projectId, that.projectId)
                .append(userId, that.userId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(projectId)
                .append(userId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("projectId", projectId)
                .append("userId", userId)
                .toString();
    }
}
