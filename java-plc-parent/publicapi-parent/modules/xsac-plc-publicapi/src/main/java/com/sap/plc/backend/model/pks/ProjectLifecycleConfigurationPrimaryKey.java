package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class ProjectLifecycleConfigurationPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -2020850776181182910L;

    private String projectId;
    private Integer calculationId;

    public ProjectLifecycleConfigurationPrimaryKey(String projectId, Integer calculationId) {
        this.projectId = projectId;
        this.calculationId = calculationId;
    }

    public ProjectLifecycleConfigurationPrimaryKey() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ProjectLifecycleConfigurationPrimaryKey that = (ProjectLifecycleConfigurationPrimaryKey) o;

        return new EqualsBuilder()
                .append(projectId, that.projectId)
                .append(calculationId, that.calculationId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(projectId)
                .append(calculationId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("projectId", projectId)
                .append("calculationId", calculationId)
                .toString();
    }
}
