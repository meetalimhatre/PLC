package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.LifecycleQuantityPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.LifecycleQuantity.TABLE_NAME;

@IdClass(LifecycleQuantityPrimaryKey.class)
@jakarta.persistence.Entity
@Table(name = TABLE_NAME)
public class LifecycleQuantity extends Entity<LifecycleQuantity, LifecycleQuantityPrimaryKey> {

    private static final long serialVersionUID = 3116163342990265000L;
    public static final String TABLE_NAME = "`sap.plc.db::basis.t_project_lifecycle_period_quantity_value`";

    public LifecycleQuantity() {
    }

    public LifecycleQuantity(Integer calculationId, String projectId, Integer lifecyclePeriodFrom) {
        this.calculationId = calculationId;
        this.projectId = projectId;
        this.lifecyclePeriodFrom = lifecyclePeriodFrom;
    }

    @Id
    @Fk(Calculation.class)
    @Column(name = "CALCULATION_ID", nullable = false)
    private Integer calculationId;

    @Id
    @Fk(Project.class)
    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Id
    @Column(name = "LIFECYCLE_PERIOD_FROM", nullable = false)
    private Integer lifecyclePeriodFrom;

    @Column(name = "`VALUE`", nullable = false, length = 28, precision = 7)
    private BigDecimal value;

    @Column(name = "LAST_MODIFIED_ON", nullable = false)
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", nullable = false, length = 256)
    private String lastModifiedBy;

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

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
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

        if (!(o instanceof LifecycleQuantity)) {
            return false;
        }

        LifecycleQuantity that = (LifecycleQuantity) o;

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
}
