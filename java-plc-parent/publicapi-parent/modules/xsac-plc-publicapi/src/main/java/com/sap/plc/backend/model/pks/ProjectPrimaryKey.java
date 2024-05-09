package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class ProjectPrimaryKey implements PrimaryKey {


    private static final long serialVersionUID = 1390201791064050511L;

    private String projectId;

    public ProjectPrimaryKey() {
    }

    public ProjectPrimaryKey(String projectId) {
        this.projectId = projectId;
    }

    public String getProjectId() {
        return projectId;
    }

    public ProjectPrimaryKey setProjectId(String projectId) {
        this.projectId = projectId;
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;

        ProjectPrimaryKey that = (ProjectPrimaryKey) o;

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

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("projectId", projectId)
                .toString();
    }
}
