package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.VendorPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.Map;

import static com.sap.plc.backend.model.masterdata.Vendor.TABLE_NAME;

@IdClass(VendorPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class Vendor extends Masterdata<Vendor, VendorPrimaryKey> {

    private static final long serialVersionUID = 6910354861193369647L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_vendor`";

    @Id
    @Column(name = "VENDOR_ID")
    private String vendorId;

    @Column(name = "VENDOR_NAME")
    private String vendorName;

    @Column(name = "COUNTRY")
    private String country;

    @Column(name = "POSTAL_CODE")
    private String postalCode;

    @Column(name = "REGION")
    private String region;

    @Column(name = "CITY")
    private String city;

    @Column(name = "STREET_NUMBER_OR_PO_BOX")
    private String streetNoOrPoBox;

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
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

    public String getStreetNoOrPoBox() {
        return streetNoOrPoBox;
    }

    public void setStreetNoOrPoBox(String streetNoOrPoBox) {
        this.streetNoOrPoBox = streetNoOrPoBox;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Vendor vendor = (Vendor) o;

        return new EqualsBuilder()
                .append(vendorId, vendor.vendorId)
                .append(validFrom, vendor.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(vendorId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String getEntityId() {
        return this.vendorId;
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

        Vendor vendor = (Vendor) o;

        return new EqualsBuilder()
                .append(vendorId, vendor.vendorId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return this.getClass().getSimpleName();
    }
}
