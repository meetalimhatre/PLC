package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.MaterialTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.sql.Timestamp;

@IdClass(MaterialTextPrimaryKey.class)
@Entity
@Table(name = MaterialText.MATERIAL_TEXT_TABLE_NAME)
public class MaterialText extends com.sap.plc.backend.model.Entity<MaterialText, MaterialTextPrimaryKey> {

    private static final long serialVersionUID = -4395607158713388322L;
    public static final String MATERIAL_TEXT_TABLE_NAME = "`sap.plc.db::basis.t_material__text`";

    @Id
    @Column(name = "MATERIAL_ID", nullable = false, length = 40)
    private String materialId;

    @Id
    @Column(name = "LANGUAGE", nullable = false, length = 11)
    private String language;

    @Id
    @Column(name = "_VALID_FROM", nullable = false)
    private Timestamp validFrom;

    @Column(name = "MATERIAL_DESCRIPTION", length = 250)
    private String description;

    @Column(name = "_VALID_TO")
    private Timestamp validTo;

    @Column(name = "_SOURCE", length = 3)
    private Integer source;

    @Column(name = "_CREATED_BY", length = 256)
    private String createdBy;

    public MaterialText() {
    }

    public MaterialText(String materialId, String description) {
        this.materialId = materialId;
        this.description = description;
    }

    public MaterialText(String materialId, String language, String description) {
        this.materialId = materialId;
        this.language = language;
        this.description = description;
    }

    public MaterialText(String materialId, String language, Timestamp validFrom) {
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getId() {
        return this.getMaterialId()
                .replace("#", "%23");
    }

    public String getUniqueQuery() {
        StringBuilder sb = new StringBuilder("validFrom=");
        return sb.append(this.getValidFrom())
                .append(" and language=")
                .append(this.getLanguage())
                .toString();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        MaterialText that = (MaterialText) o;

        return new EqualsBuilder()
                .append(materialId, that.materialId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(materialId)
                .append(language)
                .append(validFrom)
                .toHashCode();
    }
}