package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.CompanyCodePrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.List;
import java.util.Map;

import static com.sap.plc.backend.model.masterdata.CompanyCode.TABLE_NAME;

@IdClass(CompanyCodePrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class CompanyCode extends Masterdata<CompanyCode, CompanyCodePrimaryKey> {

    private static final long serialVersionUID = 672993892748171378L;
    static final String TABLE_NAME = "`sap.plc.db::basis.t_company_code`";
    private static final String METADATA_BUSINESS_OBJECT_AND_PATH = "Company_Code";

    @Id
    @Column(name = "COMPANY_CODE_ID", nullable = false, length = 4)
    private String companyCodeId;

    @Fk(value = ControllingArea.class)
    @Column(name = "CONTROLLING_AREA_ID", length = 4)
    private String controllingAreaId;

    @Column(name = "COMPANY_CODE_CURRENCY_ID", length = 3)
    private String companyCodeCurrencyId;

    @Transient
    private List<CompanyCodeText> texts;

    public CompanyCode() {
    }

    public CompanyCode(String companyCodeId, String controllingAreaId, List<CompanyCodeText> texts) {
        this.companyCodeId = companyCodeId;
        this.controllingAreaId = controllingAreaId;
        this.texts = texts;
    }

    public String getCompanyCodeId() {
        return companyCodeId;
    }

    public void setCompanyCodeId(String companyCodeId) {
        this.companyCodeId = companyCodeId;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getCompanyCodeCurrencyId() {
        return companyCodeCurrencyId;
    }

    public void setCompanyCodeCurrencyId(String companyCodeCurrencyId) {
        this.companyCodeCurrencyId = companyCodeCurrencyId;
    }

    public List<CompanyCodeText> getTexts() {
        return texts;
    }

    public void setTexts(List<CompanyCodeText> texts) {
        this.texts = texts;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CompanyCode that = (CompanyCode) o;

        return new EqualsBuilder()
                .append(companyCodeId, that.companyCodeId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(companyCodeId)
                .append(controllingAreaId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String getEntityId() {
        return this.companyCodeId;
    }

    @Override
    public String getUniqueQuery() {
        return "validFrom=" + this.validFrom;
    }

    @Override
    public Map getTextsMap() {
        return null;
    }

    @Override
    public void setTextsMap(Map<String, Object> textsMap) {

    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        CompanyCode that = (CompanyCode) o;

        return new EqualsBuilder()
                .append(companyCodeId, that.companyCodeId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return METADATA_BUSINESS_OBJECT_AND_PATH;
    }
}
