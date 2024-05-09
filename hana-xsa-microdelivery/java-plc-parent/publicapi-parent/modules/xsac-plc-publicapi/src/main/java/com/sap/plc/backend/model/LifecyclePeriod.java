package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.LifecyclePeriodPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.sql.Timestamp;
import java.util.List;

@IdClass(LifecyclePeriodPrimaryKey.class)
@Entity
@Table(name = LifecyclePeriod.TABLE_NAME)
public class LifecyclePeriod extends com.sap.plc.backend.model.Entity<LifecyclePeriod,
        LifecyclePeriodPrimaryKey>{

    static final String TABLE_NAME = "`sap.plc.db::basis.t_project_lifecycle_period_type`";
    private static final long serialVersionUID = -1335940365054721533L;

    @Id
    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Id
    @Column(name = "`YEAR`", nullable = false)
    private Integer year;

    @Column(name = "PERIOD_TYPE", nullable = false, length = 20)
    private String periodType; //Yearly/Monthly/Quarterly/Custom

    @Column(name = "IS_YEAR_SELECTED")
    private Integer isYearSelected;

    @Column(name = "LAST_MODIFIED_ON", nullable = false)
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", nullable = false, length = 256)
    private String lastModifiedBy;

    @Transient
    public List<LifecyclePeriodMonth> lifecyclePeriodMonths;

    public LifecyclePeriod() {
    }

    public LifecyclePeriod(String projectId, Integer year) {
        this.projectId = projectId;
        this.year = year;
    }

    public Integer getIsYearSelected() {
        return isYearSelected;
    }

    public void setIsYearSelected(Integer isYearSelected) {
        this.isYearSelected = isYearSelected;
    }

    public List<LifecyclePeriodMonth> getLifecyclePeriodMonths() {
        return lifecyclePeriodMonths;
    }

    public void setLifecyclePeriodMonths(List<LifecyclePeriodMonth> lifecyclePeriodMonths) {
        this.lifecyclePeriodMonths = lifecyclePeriodMonths;
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

    public String getPeriodType() {
        return periodType;
    }

    public void setPeriodType(String periodType) {
        this.periodType = periodType;
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

        LifecyclePeriod that = (LifecyclePeriod) o;

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
}
