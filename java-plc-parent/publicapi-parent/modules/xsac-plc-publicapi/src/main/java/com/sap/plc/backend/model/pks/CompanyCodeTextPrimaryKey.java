package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class CompanyCodeTextPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -802676877553488507L;
    private String companyCodeId;
    private String language;
    private Timestamp validFrom;

    public CompanyCodeTextPrimaryKey() {
    }

    public CompanyCodeTextPrimaryKey(String companyCodeId, String language, Timestamp validFrom) {
        this.companyCodeId = companyCodeId;
        this.language = language;
        this.validFrom = validFrom;
    }

    public String getCompanyCodeId() {
        return companyCodeId;
    }

    public CompanyCodeTextPrimaryKey setCompanyCodeId(String companyCodeId) {
        this.companyCodeId = companyCodeId;
        return this;
    }

    public String getLanguage() {
        return language;
    }

    public CompanyCodeTextPrimaryKey setLanguage(String language) {
        this.language = language;
        return this;
    }

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public CompanyCodeTextPrimaryKey setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CompanyCodeTextPrimaryKey that = (CompanyCodeTextPrimaryKey) o;
        return new EqualsBuilder()
                .append(companyCodeId, that.companyCodeId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder()
                .append(companyCodeId)
                .append(language)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("companyCodeId", companyCodeId)
                .append("language", language)
                .append("validFrom", validFrom)
                .toString();
    }
}
