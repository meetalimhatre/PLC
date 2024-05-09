package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.PlantPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.List;
import java.util.Map;

@IdClass(PlantPrimaryKey.class)
@Entity
@Table(name = Plant.TABLE_NAME)
public class Plant extends Masterdata<Plant, PlantPrimaryKey> {

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_plant`";
    private static final String METADATA_BUSINESS_OBJECT_AND_PATH = "Plant";
    private static final long serialVersionUID = 4971931135505088836L;

    //region Properties
    @Id
    @Column(name = "PLANT_ID", nullable = false, length = 8)
    private String plantId;

    @Column(name = "COMPANY_CODE_ID", nullable = false)
    @Fk(CompanyCode.class)
    private String companyCodeId;

    @Column(name = "COUNTRY")
    private String country;

    @Column(name = "POSTAL_CODE")
    private String postalCode;

    @Column(name = "REGION")
    private String region;

    @Column(name = "CITY")
    private String city;

    @Column(name = "STREET_NUMBER_OR_PO_BOX")
    private String streetNoOrPOBox;

    @Transient
    private List<PlantText> texts;

    //endregion

    //region Constructors

    public Plant() {
    }

    public Plant(String plantId, String companyCodeId, List<PlantText> texts) {
        this.plantId = plantId;
        this.companyCodeId = companyCodeId;
        this.texts = texts;
    }

    //endregion

    //region Masterdata Overrides

    @Override
    public String getEntityId() {
        return plantId;
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

        Plant plant = (Plant) o;

        return new EqualsBuilder()
                .append(plantId, plant.plantId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return METADATA_BUSINESS_OBJECT_AND_PATH;
    }
    //endregion

    //region Getters & Setters

    public String getPlantId() {
        return plantId;
    }

    public void setPlantId(String plantId) {
        this.plantId = plantId;
    }

    public String getCompanyCodeId() {
        return companyCodeId;
    }

    public void setCompanyCodeId(String companyCodeId) {
        this.companyCodeId = companyCodeId;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStreetNoOrPOBox() {
        return streetNoOrPOBox;
    }

    public void setStreetNoOrPOBox(String streetNoOrPOBox) {
        this.streetNoOrPOBox = streetNoOrPOBox;
    }

    public List<PlantText> getTexts() {
        return texts;
    }

    public void setTexts(List<PlantText> texts) {
        this.texts = texts;
    }
    //endregion

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Plant plant = (Plant) o;

        return new EqualsBuilder()
                .append(plantId, plant.plantId)
                .append(companyCodeId, plant.companyCodeId)
                .append(validFrom, plant.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(plantId)
                .append(companyCodeId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("plantId", plantId)
                .append("validFrom", validFrom)
                .append("validTo", validTo)
                .append("source", source)
                .append("createdBy", createdBy)
                .append("companyCodeId", companyCodeId)
                .append("country", country)
                .append("postalCode", postalCode)
                .append("region", region)
                .append("city", city)
                .append("streetNoOrPOBox", streetNoOrPOBox)
                .append("textsMap", texts)
                .toString();
    }
}
