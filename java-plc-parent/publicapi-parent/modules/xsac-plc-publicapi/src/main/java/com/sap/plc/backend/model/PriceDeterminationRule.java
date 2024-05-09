package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.PriceDeterminationRulePrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.PriceDeterminationRule.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME)
@IdClass(PriceDeterminationRulePrimaryKey.class)
public class PriceDeterminationRule extends
        com.sap.plc.backend.model.Entity<PriceDeterminationRule, PriceDeterminationRulePrimaryKey> {

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_price_determination_strategy_rule`";
    private static final long serialVersionUID = 4005920669250487860L;

    public PriceDeterminationRule() {
    }

    public PriceDeterminationRule(String priceDeterminationStrategyId,
                                  Integer priceDeterminationStrategyTypeId, String ruleCode,
                                  Integer priority) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
        this.ruleCode = ruleCode;
        this.priority = priority;
    }

    @Id
    @Column(name = "PRICE_DETERMINATION_STRATEGY_ID", nullable = false, length = 20)
    private String priceDeterminationStrategyId;

    @Id
    @Column(name = "PRICE_DETERMINATION_STRATEGY_TYPE_ID", nullable = false)
    @ColumnDefault(value = "1")
    private Integer priceDeterminationStrategyTypeId;

    @Id
    @Column(name = "RULE_CODE", nullable = false, length = 20)
    private String ruleCode;

    @Column(name = "PRIORITY", nullable = false)
    private Integer priority;

    public String getPriceDeterminationStrategyId() {
        return priceDeterminationStrategyId;
    }

    public void setPriceDeterminationStrategyId(String priceDeterminationStrategyId) {
        this.priceDeterminationStrategyId = priceDeterminationStrategyId;
    }

    public Integer getPriceDeterminationStrategyTypeId() {
        return priceDeterminationStrategyTypeId;
    }

    public void setPriceDeterminationStrategyTypeId(Integer priceDeterminationStrategyTypeId) {
        this.priceDeterminationStrategyTypeId = priceDeterminationStrategyTypeId;
    }

    public String getRuleCode() {
        return ruleCode;
    }

    public void setRuleCode(String ruleCode) {
        this.ruleCode = ruleCode;
    }

    public Integer getPriority() {
        return priority;
    }

    public void setPriority(Integer priority) {
        this.priority = priority;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceDeterminationRule that = (PriceDeterminationRule) o;

        return new EqualsBuilder()
                .append(priceDeterminationStrategyTypeId, that.priceDeterminationStrategyTypeId)
                .append(priceDeterminationStrategyId, that.priceDeterminationStrategyId)
                .append(ruleCode, that.ruleCode)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceDeterminationStrategyTypeId)
                .append(priceDeterminationStrategyId)
                .append(ruleCode)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceDeterminationStrategyTypeId", priceDeterminationStrategyTypeId)
                .append("priceDeterminationStrategyId", priceDeterminationStrategyId)
                .append("priority", priority)
                .append("ruleCode", ruleCode)
                .toString();
    }
}
