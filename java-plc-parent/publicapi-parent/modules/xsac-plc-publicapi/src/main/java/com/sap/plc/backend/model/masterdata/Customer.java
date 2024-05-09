package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.CustomerPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.util.Map;

import static com.sap.plc.backend.model.masterdata.Customer.TABLE_NAME;

@IdClass(CustomerPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)

public class Customer extends Masterdata<Customer, CustomerPrimaryKey>{

    private static final long serialVersionUID = 8551652364060603659L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_customer`";

    @Id
    @Column(name = "CUSTOMER_ID")
    private String customerId;

    @Column(name = "CUSTOMER_NAME")
    private String customerName;

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

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
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
    public String getEntityId() {
        return this.customerId;
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

        Customer customer = (Customer) o;

        return new EqualsBuilder()
                .append(customerId, customer.customerId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return this.getClass().getSimpleName();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Customer customer = (Customer) o;

        return new EqualsBuilder()
                .append(customerId, customer.customerId)
                .append(validFrom, customer.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(customerId)
                .append(validFrom)
                .toHashCode();
    }
}
