package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class CompanyCodePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8669666209487082101L;
    private String companyCodeId;
    private Timestamp validFrom;

    public String getCompanyCodeId() {
        return companyCodeId;
    }

    public void setCompanyCodeId(String companyCodeId) {
        this.companyCodeId = companyCodeId;
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
                .append(companyCodeId)
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

        CompanyCodePrimaryKey that = (CompanyCodePrimaryKey) o;

        return new EqualsBuilder()
                .append(companyCodeId, that.companyCodeId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("companyCodeId", companyCodeId)
                .append("validFrom", validFrom)
                .toString();
    }
}
