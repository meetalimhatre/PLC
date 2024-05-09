package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class MaterialTextPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -5599632966800328083L;

    private String materialId;
    private String language;
    private Timestamp validFrom;

    public MaterialTextPrimaryKey() {
    }

    public MaterialTextPrimaryKey(String materialId, Timestamp validFrom, String language) {
        this.materialId = materialId;
        this.language = language;
        this.validFrom = validFrom;
    }

    public String getMaterialId() {
        return materialId;
    }

    public void setMaterialId(String materialId) {
        this.materialId = materialId;
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
                .append(materialId)
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

        MaterialTextPrimaryKey that = (MaterialTextPrimaryKey) o;

        return new EqualsBuilder()
                .append(materialId, that.materialId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("materialId", materialId)
                .append("language", language)
                .append("validFrom", validFrom)
                .toString();
    }
}
