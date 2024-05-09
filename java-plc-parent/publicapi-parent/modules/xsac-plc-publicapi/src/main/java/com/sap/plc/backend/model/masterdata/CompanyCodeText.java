package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.CompanyCodeTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.sql.Timestamp;

@IdClass(CompanyCodeTextPrimaryKey.class)
@Entity
@Table(name = CompanyCodeText.TABLE_NAME)
public class CompanyCodeText extends com.sap.plc.backend.model.Entity<CompanyCodeText, CompanyCodeTextPrimaryKey> {

    private static final long serialVersionUID = -271437842990493891L;
    static final String TABLE_NAME = "`sap.plc.db::basis.t_company_code__text`";

    @Id
    @Column(name = "COMPANY_CODE_ID")
    @Size(max = 4)
    @NotNull
    private String companyCodeId;

    @Id
    @Column(name = "LANGUAGE")
    @Size(max = 11)
    @NotNull
    private String language;

    @Column(name = "COMPANY_CODE_DESCRIPTION")
    @Size(max = 250)
    private String description;

    @Id
    @Column(name = "_VALID_FROM")
    @NotNull
    private Timestamp validFrom;

    @Column(name = "_VALID_TO")
    private Timestamp validTo;

    @Column(name = "_SOURCE", length = 3)
    private Integer source;

    @Column(name = "_CREATED_BY")
    @Size(max = 256)
    private String createdBy;

    public String getCompanyCodeId() {
        return companyCodeId;
    }

    public void setCompanyCodeId(String companyCodeId) {
        this.companyCodeId = companyCodeId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    public Timestamp getValidTo() {
        return validTo;
    }

    public void setValidTo(Timestamp validTo) {
        this.validTo = validTo;
    }

    public Integer getSource() {
        return source;
    }

    public void setSource(Integer source) {
        this.source = source;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public CompanyCodeText() {
    }

    public CompanyCodeText(@Size(max = 4) @NotNull String companyCodeId, @Size(max = 11) @NotNull String language, @Size(max = 250) String description, @NotNull Timestamp validFrom) {
        this.companyCodeId = companyCodeId;
        this.language = language;
        this.description = description;
        this.validFrom = validFrom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;

        CompanyCodeText that = (CompanyCodeText) o;

        return new EqualsBuilder()
                .append(companyCodeId, that.companyCodeId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(companyCodeId)
                .append(language)
                .append(validFrom)
                .toHashCode();
    }
}
