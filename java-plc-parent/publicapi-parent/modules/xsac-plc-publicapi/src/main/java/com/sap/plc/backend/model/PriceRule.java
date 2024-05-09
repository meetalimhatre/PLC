package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.PriceRulePrimaryKey;
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

import static com.sap.plc.backend.model.PriceRule.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME)
@IdClass(PriceRulePrimaryKey.class)
public class PriceRule extends com.sap.plc.backend.model.Entity<PriceRule, PriceRulePrimaryKey> {

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_price_rule`";
    private static final long serialVersionUID = -756315869436450778L;

    @Id
    @Column(name = "RULE_CODE", nullable = false, length = 20)
    private String ruleCode;

    @Id
    @Column(name = "RULE_TYPE_ID", nullable = false)
    @ColumnDefault(value = "1")
    private Integer ruleTypeId;

    @Column(name = "DEFAULT_PRIORITY", nullable = false)
    private Integer defaultPriority;

    public PriceRule() {
    }

    public PriceRule(String ruleCode, Integer ruleTypeId, Integer defaultPriority) {
        this.ruleCode = ruleCode;
        this.ruleTypeId = ruleTypeId;
        this.defaultPriority = defaultPriority;
    }

    public String getRuleCode() {
        return ruleCode;
    }

    public void setRuleCode(String ruleCode) {
        this.ruleCode = ruleCode;
    }

    public Integer getRuleTypeId() {
        return ruleTypeId;
    }

    public void setRuleTypeId(Integer ruleTypeId) {
        this.ruleTypeId = ruleTypeId;
    }

    public Integer getDefaultPriority() {
        return defaultPriority;
    }

    public void setDefaultPriority(Integer defaultPriority) {
        this.defaultPriority = defaultPriority;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceRule priceRule = (PriceRule) o;

        return new EqualsBuilder()
                .append(ruleCode, priceRule.ruleCode)
                .append(ruleTypeId, priceRule.ruleTypeId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(ruleCode)
                .append(ruleTypeId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("ruleCode", ruleCode)
                .append("ruleTypeId", ruleTypeId)
                .append("defaultPriority", defaultPriority)
                .toString();
    }
}
