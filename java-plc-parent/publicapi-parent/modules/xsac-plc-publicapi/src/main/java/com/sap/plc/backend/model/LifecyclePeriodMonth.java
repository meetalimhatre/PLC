package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.LifecyclePeriodMonthsPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.sql.Timestamp;

@IdClass(LifecyclePeriodMonthsPrimaryKey.class)
@Entity
@Table(name = LifecyclePeriodMonth.TABLE_NAME)
public class LifecyclePeriodMonth extends com.sap.plc.backend.model.Entity<LifecyclePeriodMonth,
        LifecyclePeriodMonthsPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_project_monthly_lifecycle_period`";
    private static final long serialVersionUID = -7733047980060558942L;

    @Id
    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Id
    @Column(name = "`YEAR`", nullable = false)
    private Integer year;

    @Id
    @Column(name = "SELECTED_MONTH", nullable = false)
    private Integer selectedMonth;

    @Column(name = "MONTH_DESCRIPTION", length = 100)
    private String monthDescription;

    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", length = 256)
    private String lastModifiedBy;

    public LifecyclePeriodMonth() {
    }

    public LifecyclePeriodMonth(String projectId, Integer year, Integer selectedMonth) {
        this.projectId = projectId;
        this.year = year;
        this.selectedMonth = selectedMonth;
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

    public String getMonthDescription() {
        return monthDescription;
    }

    public void setMonthDescription(String monthDescription) {
        this.monthDescription = monthDescription;
    }

    public Timestamp getLastModifiedOn() {
        return lastModifiedOn;
    }

    public void setLastModifiedOn(Timestamp lastModifiedOn) {
        this.lastModifiedOn = lastModifiedOn;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        LifecyclePeriodMonth that = (LifecyclePeriodMonth) o;

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
}
