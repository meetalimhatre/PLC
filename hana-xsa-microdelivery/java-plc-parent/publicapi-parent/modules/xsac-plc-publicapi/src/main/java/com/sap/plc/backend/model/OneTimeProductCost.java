package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.OneTimeProductCostPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.OneTimeProductCost.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME)
@IdClass(OneTimeProductCostPrimaryKey.class)
public class OneTimeProductCost
        extends com.sap.plc.backend.model.Entity<OneTimeProductCost, OneTimeProductCostPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_one_time_product_cost`";
    private static final long serialVersionUID = -4656241029702801265L;

    public OneTimeProductCost() {
    }

    public OneTimeProductCost(Integer oneTimeCostId, Integer calculationId) {
        this.oneTimeCostId = oneTimeCostId;
        this.calculationId = calculationId;
    }

    @Id
    @Fk(value = OneTimeProjectCost.class)
    @Column(name = "ONE_TIME_COST_ID", nullable = false)
    private Integer oneTimeCostId;

    @Id
    @Column(name = "CALCULATION_ID", nullable = false)
    private Integer calculationId;

    @Column(name = "COST_TO_DISTRIBUTE", length = 28, precision = 7)
    private BigDecimal costToDistribute;

    @Column(name = "COST_NOT_DISTRIBUTED", length = 28, precision = 7)
    private BigDecimal costNotDistributed;

    @Column(name = "DISTRIBUTION_TYPE", nullable = false)
    @ColumnDefault(value = "0")
    private Integer distributionType;

    @Column(name = "LAST_MODIFIED_ON", nullable = false)
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", nullable = false, length = 256)
    private String lastModifiedBy;

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

    public BigDecimal getCostToDistribute() {
        return costToDistribute;
    }

    public void setCostToDistribute(BigDecimal costToDistribute) {
        this.costToDistribute = costToDistribute;
    }

    public BigDecimal getCostNotDistributed() { return costNotDistributed; }

    public void setCostNotDistributed(BigDecimal costNotDistributed) { this.costNotDistributed = costNotDistributed; }

    public Integer getDistributionType() {
        return distributionType;
    }

    public void setDistributionType(Integer distributionType) {
        this.distributionType = distributionType;
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

        if (!(o instanceof OneTimeProductCost)) {
            return false;
        }

        OneTimeProductCost that = (OneTimeProductCost) o;

        return new EqualsBuilder()
                .append(oneTimeCostId, that.oneTimeCostId)
                .append(calculationId, that.calculationId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(oneTimeCostId)
                .append(calculationId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return "OneTimeProductCost{" +
                "oneTimeCostId=" + oneTimeCostId +
                ", calculationId=" + calculationId +
                ", costToDistribute=" + costToDistribute +
                ", distributionType=" + distributionType + '\'' +
                '}';
    }
}
