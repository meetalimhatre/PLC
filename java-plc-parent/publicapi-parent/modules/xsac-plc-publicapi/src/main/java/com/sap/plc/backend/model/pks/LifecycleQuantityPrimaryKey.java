package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class LifecycleQuantityPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 7983939122408238599L;

    private Integer calculationId;

    private String projectId;

    private Integer lifecyclePeriodFrom;

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Integer getLifecyclePeriodFrom() {
        return lifecyclePeriodFrom;
    }

    public void setLifecyclePeriodFrom(Integer lifecyclePeriodFrom) {
        this.lifecyclePeriodFrom = lifecyclePeriodFrom;
    }

    public LifecycleQuantityPrimaryKey() {
    }

    public LifecycleQuantityPrimaryKey(Integer calculationId, String projectId, Integer lifecyclePeriodFrom) {
        this.calculationId = calculationId;
        this.projectId = projectId;
        this.lifecyclePeriodFrom = lifecyclePeriodFrom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof LifecycleQuantityPrimaryKey)) {
            return false;
        }

        LifecycleQuantityPrimaryKey that = (LifecycleQuantityPrimaryKey) o;

        return new EqualsBuilder()
                .append(calculationId, that.calculationId)
                .append(projectId, that.projectId)
                .append(lifecyclePeriodFrom, that.lifecyclePeriodFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(calculationId)
                .append(projectId)
                .append(lifecyclePeriodFrom)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("calculationId", calculationId)
                .append("projectId", projectId)
                .append("lifecyclePeriodFrom", lifecyclePeriodFrom)
                .toString();
    }
}
