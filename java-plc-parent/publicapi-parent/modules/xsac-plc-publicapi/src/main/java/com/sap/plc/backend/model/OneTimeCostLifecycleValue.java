package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.OneTimeCostLifecycleValuePrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

import static com.sap.plc.backend.model.OneTimeCostLifecycleValue.TABLE_NAME;

@IdClass(OneTimeCostLifecycleValuePrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class OneTimeCostLifecycleValue
        extends com.sap.plc.backend.model.Entity<OneTimeCostLifecycleValue, OneTimeCostLifecycleValuePrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_one_time_cost_lifecycle_value`";
    private static final long serialVersionUID = 2134193367130903680L;

    @Id
    @Fk(value = OneTimeProductCost.class)
    @Column(name = "ONE_TIME_COST_ID", nullable = false)
    @NotNull
    @Positive
    private Integer oneTimeCostId;

    @Id
    @Fk(value = OneTimeProductCost.class)
    @Column(name = "CALCULATION_ID", nullable = false)
    @NotNull
    @Positive
    private Integer calculationId;

    @Id
    @Column(name = "LIFECYCLE_PERIOD_FROM", nullable = false)
    @NotNull
    @Positive
    private Integer lifecyclePeriodFrom;

    @Column(name = "`VALUE`", nullable = false, length = 28)
    private BigDecimal value;

    public OneTimeCostLifecycleValue() {
    }

    public OneTimeCostLifecycleValue(@NotNull @Positive Integer oneTimeCostId, @NotNull @Positive Integer calculationId,
                                     @NotNull @Positive Integer lifecyclePeriodFrom, BigDecimal value) {
        this.oneTimeCostId = oneTimeCostId;
        this.calculationId = calculationId;
        this.lifecyclePeriodFrom = lifecyclePeriodFrom;
        this.value = value;
    }

    public Integer getOneTimeCostId() {
        return oneTimeCostId;
    }

    public void setOneTimeCostId(Integer oneTimeCostId) {
        this.oneTimeCostId = oneTimeCostId;
    }

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
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

    @Override
    public int hashCode() {
        return new HashCodeBuilder(23, 53)
                .append(oneTimeCostId)
                .append(calculationId)
                .append(lifecyclePeriodFrom)
                .toHashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }

        OneTimeCostLifecycleValue otclv = (OneTimeCostLifecycleValue) obj;

        return new EqualsBuilder()
                .append(oneTimeCostId, otclv.oneTimeCostId)
                .append(calculationId, otclv.calculationId)
                .append(lifecyclePeriodFrom, otclv.lifecyclePeriodFrom)
                .isEquals();
    }
}
