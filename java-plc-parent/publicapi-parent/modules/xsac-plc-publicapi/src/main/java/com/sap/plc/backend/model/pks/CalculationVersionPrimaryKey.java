package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import com.sap.plc.backend.model.PrimaryKey;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class CalculationVersionPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8663604862236632687L;

    private Integer calculationVersionId;

    public CalculationVersionPrimaryKey(Integer calculationVersionId) {
        this.calculationVersionId = calculationVersionId;
    }

    public CalculationVersionPrimaryKey() {
    }

    public Integer getCalculationVersionId() {
		return calculationVersionId;
	}

	public void setCalculationVersionId(Integer calculationVersionId) {
		this.calculationVersionId = calculationVersionId;
	}

	@Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CalculationVersionPrimaryKey that = (CalculationVersionPrimaryKey) o;

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

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("calculationVersionId", calculationVersionId)
                .toString();
    }
}
