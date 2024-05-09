package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class CostCenterTextPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -5599632966800328083L;

    private String costCenterId;
    private String controllingAreaId;
    private String language;
    private Timestamp validFrom;

    public CostCenterTextPrimaryKey() {
    }

    public CostCenterTextPrimaryKey(String costCenterId, String controllingAreaId, String language,
                                    Timestamp validFrom) {
        this.costCenterId = costCenterId;
        this.controllingAreaId = controllingAreaId;
        this.language = language;
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

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
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
                .append(language)
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

        CostCenterTextPrimaryKey that = (CostCenterTextPrimaryKey) o;

        return new EqualsBuilder()
                .append(costCenterId, that.costCenterId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("costCenterId", costCenterId)
                .append("controllingAreaId", controllingAreaId)
                .append("language", language)
                .append("validFrom", validFrom)
                .toString();
    }
}
