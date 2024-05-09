package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class PriceComponentPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -6020426641593007527L;

    private String priceId;
    private Timestamp validFrom;
    private String accountId;
    private String controllingAreaId;

    public PriceComponentPrimaryKey() {
    }

    public PriceComponentPrimaryKey(String priceId, Timestamp validFrom, String accountId, String controllingAreaId) {
        this.priceId = priceId;
        this.validFrom = validFrom;
        this.accountId = accountId;
        this.controllingAreaId = controllingAreaId;
    }

    public String getPriceId() {
        return priceId;
    }

    public void setPriceId(String priceId) {
        this.priceId = priceId;
    }

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceComponentPrimaryKey that = (PriceComponentPrimaryKey) o;

        return new EqualsBuilder()
                .append(priceId, that.priceId)
                .append(validFrom, that.validFrom)
                .append(accountId, that.accountId)
                .append(controllingAreaId, that.controllingAreaId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceId)
                .append(validFrom)
                .append(accountId)
                .append(controllingAreaId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceId", priceId)
                .append("validFrom", validFrom)
                .append("accountId", accountId)
                .append("controllingAreaId", controllingAreaId)
                .toString();
    }
}
