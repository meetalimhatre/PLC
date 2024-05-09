package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class LifecyclePeriodPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 5885555126137632540L;

    private String projectId;
    private Integer year;

    public LifecyclePeriodPrimaryKey(String projectId, Integer year) {
        this.projectId = projectId;
        this.year = year;
    }

    public LifecyclePeriodPrimaryKey() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        LifecyclePeriodPrimaryKey that = (LifecyclePeriodPrimaryKey) o;

        return new EqualsBuilder()
                .append(projectId, that.projectId)
                .append(year, that.year)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(projectId)
                .append(year)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("projectId", projectId)
                .append("year", year)
                .toString();
    }
}
