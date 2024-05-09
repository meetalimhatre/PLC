package com.sap.plc.backend.model.instanceprivilege.calculation;

import com.sap.plc.backend.model.instanceprivilege.Privilege;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

public class CalculationPrivilege implements Privilege {

    private Integer calculationId;

    private String privilege;

    public CalculationPrivilege() {
    }

    public CalculationPrivilege(Integer calculationId) {
        this.calculationId = calculationId;
    }

    public CalculationPrivilege(Integer calculationId, String privilege) {
        this.calculationId = calculationId;
        this.privilege = privilege;
    }

    public Integer getCalculationId() {
        return calculationId;
    }

    public void setCalculationId(Integer calculationId) {
        this.calculationId = calculationId;
    }

    @Override
    public String getPrivilege() {
        return privilege;
    }

    public void setPrivilege(String privilege) {
        this.privilege = privilege;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof CalculationPrivilege)) {
            return false;
        }

        CalculationPrivilege that = (CalculationPrivilege) o;

        return new EqualsBuilder()
                .append(calculationId, that.calculationId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(calculationId)
                .toHashCode();
    }
}
