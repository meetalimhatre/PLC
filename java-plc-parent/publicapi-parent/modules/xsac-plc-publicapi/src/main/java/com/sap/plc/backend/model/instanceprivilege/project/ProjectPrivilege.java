package com.sap.plc.backend.model.instanceprivilege.project;

import com.sap.plc.backend.model.instanceprivilege.Privilege;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

public class ProjectPrivilege implements Privilege {

    private String projectId;

    private String privilege;

    public ProjectPrivilege() {
    }

    public ProjectPrivilege(String projectId) {
        this.projectId = projectId;
    }

    public ProjectPrivilege(String projectId, String privilege) {
        this.projectId = projectId;
        this.privilege = privilege;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    @Override
    public String getPrivilege() {
        return privilege;
    }

    public void setPrivilege(String privilege) {
        this.privilege = privilege;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof ProjectPrivilege)) {
            return false;
        }

        ProjectPrivilege that = (ProjectPrivilege) o;

        return new EqualsBuilder()
                .append(projectId, that.projectId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(projectId)
                .toHashCode();
    }
}
