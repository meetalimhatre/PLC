package com.sap.plc.backend.model.instanceprivilege.calculationversion;

import com.sap.plc.backend.model.instanceprivilege.Privilege;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

public class CalculationVersionPrivilege implements Privilege {

    private Integer calculationVersionId;

    private String privilege;

    public CalculationVersionPrivilege() {
    }

    public CalculationVersionPrivilege(Integer calculationVersionId) {
        this.calculationVersionId = calculationVersionId;
    }

    public CalculationVersionPrivilege(Integer calculationVersionId, String privilege) {
        this.calculationVersionId = calculationVersionId;
        this.privilege = privilege;
    }

    public Integer getCalculationVersionId() {
        return calculationVersionId;
    }

    public void setCalculationVersionId(Integer calculationVersionId) {
        this.calculationVersionId = calculationVersionId;
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

        if (!(o instanceof CalculationVersionPrivilege)) {
            return false;
        }

        CalculationVersionPrivilege that = (CalculationVersionPrivilege) o;

        return new EqualsBuilder()
                .append(calculationVersionId, that.calculationVersionId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(calculationVersionId)
                .toHashCode();
    }
}
