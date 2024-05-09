package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.PlantTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.masterdata.PlantText.TABLE_NAME;

@IdClass(PlantTextPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class PlantText extends com.sap.plc.backend.model.Entity<PlantText, PlantTextPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_plant__text`";

    @Id
    @Column(name = "PLANT_ID")
    private String plantId;

    @Id
    @Column(name = "LANGUAGE")
    private String language;

    @Column(name = "PLANT_DESCRIPTION")
    private String description;

    @Id
    @Column(name = "_VALID_FROM")
    private Timestamp validFrom;

    @Column(name = "_VALID_TO")
    private Timestamp validTo;

    @Column(name = "_SOURCE", length = 3)
    private Integer source;

    @Column(name = "_CREATED_BY")
    private String createdBy;

    public PlantText() {
    }

    public PlantText(String language, String description) {
        this.language = language;
        this.description = description;
    }

    public PlantText(String language, String description, String plantId, Timestamp validFrom) {
        this.language = language;
        this.description = description;
        this.plantId = plantId;
        this.validFrom = validFrom;
    }

    public String getPlantId() {
        return plantId;
    }

    public void setPlantId(String plantId) {
        this.plantId = plantId;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PlantText that = (PlantText) o;

        return new EqualsBuilder()
                .append(plantId, that.plantId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(plantId)
                .append(language)
                .append(validFrom)
                .toHashCode();
    }
}
