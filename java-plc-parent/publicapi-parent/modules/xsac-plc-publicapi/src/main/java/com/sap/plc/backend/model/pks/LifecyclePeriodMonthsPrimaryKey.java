package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class LifecyclePeriodMonthsPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -6093917956385402318L;

    private String projectId;
    private Integer year;
    private Integer selectedMonth;

    public LifecyclePeriodMonthsPrimaryKey(String projectId, Integer year, Integer selectedMonth) {
        this.projectId = projectId;
        this.year = year;
        this.selectedMonth = selectedMonth;
    }

    public LifecyclePeriodMonthsPrimaryKey() {
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

    public Integer getSelectedMonth() {
        return selectedMonth;
    }

    public void setSelectedMonth(Integer selectedMonth) {
        this.selectedMonth = selectedMonth;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        LifecyclePeriodMonthsPrimaryKey that = (LifecyclePeriodMonthsPrimaryKey) o;

        return new EqualsBuilder()
                .append(projectId, that.projectId)
                .append(year, that.year)
                .append(selectedMonth, that.selectedMonth)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(projectId)
                .append(year)
                .append(selectedMonth)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("projectId", projectId)
                .append("year", year)
                .append("selectedMonth", selectedMonth)
                .toString();
    }
}
