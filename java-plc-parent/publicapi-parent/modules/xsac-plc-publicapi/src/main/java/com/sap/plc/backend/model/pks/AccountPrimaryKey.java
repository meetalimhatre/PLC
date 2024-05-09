package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class AccountPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8043604862236632687L;

    private String accountId;
    private String controllingAreaId;
    private Timestamp validFrom;

    public AccountPrimaryKey(String accountId, String controllingAreaId, Timestamp validFrom) {
        this.accountId = accountId;
        this.controllingAreaId = controllingAreaId;
        this.validFrom = validFrom;
    }

    public AccountPrimaryKey() {
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

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        AccountPrimaryKey that = (AccountPrimaryKey) o;

        return new EqualsBuilder()
                .append(accountId, that.accountId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(accountId)
                .append(controllingAreaId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("accountId", accountId)
                .append("controllingAreaId", controllingAreaId)
                .append("validFrom", validFrom)
                .toString();
    }
}
