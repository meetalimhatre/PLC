package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class CostCenterPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -6462539464311292551L;

    private String costCenterId;
    private String controllingAreaId;
    private Timestamp validFrom;

    public CostCenterPrimaryKey() {
    }

    public CostCenterPrimaryKey(String costCenterId, String controllingAreaId, Timestamp validFrom) {
        this.costCenterId = costCenterId;
        this.controllingAreaId = controllingAreaId;
        this.validFrom = validFrom;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getCostCenterId() {
        return costCenterId;
    }

    public void setCostCenterId(String costCenterId) {
        this.costCenterId = costCenterId;
    }

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(costCenterId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CostCenterPrimaryKey that = (CostCenterPrimaryKey) o;

        return new EqualsBuilder()
                .append(costCenterId, that.costCenterId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("costCenterId", costCenterId)
                .append("controllingAreaId", controllingAreaId)
                .append("validFrom", validFrom)
                .toString();
    }
}