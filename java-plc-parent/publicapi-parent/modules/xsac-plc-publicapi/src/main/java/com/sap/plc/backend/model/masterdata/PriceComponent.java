package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.PriceComponentPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.masterdata.PriceComponent.TABLE_NAME;

@IdClass(PriceComponentPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class PriceComponent extends com.sap.plc.backend.model.Entity<PriceComponent, PriceComponentPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_price_component`";
    
    @Id
    @Column(name = "PRICE_ID", nullable = false)
    @Size(max = 32)
    private String priceId;

    @Id
    @Column(name = "_VALID_FROM", nullable = false)
    private Timestamp validFrom;

    @Id
    @Column(name = "ACCOUNT_ID", nullable = false)
    @Size(max = 10)
    private String accountId;

    @Id
    @Column(name = "CONTROLLING_AREA_ID", nullable = false)
    @Size(max = 4)
    private String controllingAreaId;

    @Column(name = "PRICE_FIXED", nullable = false)
    private BigDecimal priceFixed;

    @Column(name = "PRICE_VARIABLE", nullable = false)
    private BigDecimal priceVariable;

    public PriceComponent(String priceId, Timestamp validFrom, String accountId, BigDecimal priceFixed, BigDecimal priceVariable, String controllingAreaId) {
        this.priceId = priceId;
        this.validFrom = validFrom;
        this.accountId = accountId;
        this.priceFixed = priceFixed;
        this.priceVariable = priceVariable;
        this.controllingAreaId = controllingAreaId;
    }

    public PriceComponent() {
    }

    public String getPriceId() {
        return priceId;
    }

    public void setPriceId(String priceId) {
        this.priceId = priceId;
    }

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public BigDecimal getPriceFixed() {
        return priceFixed;
    }

    public void setPriceFixed(BigDecimal priceFixed) {
        this.priceFixed = priceFixed;
    }

    public BigDecimal getPriceVariable() {
        return priceVariable;
    }

    public void setPriceVariable(BigDecimal priceVariable) {
        this.priceVariable = priceVariable;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceComponent component = (PriceComponent) o;

        return new EqualsBuilder()
                .append(priceId, component.priceId)
                .append(validFrom, component.validFrom)
                .append(accountId, component.accountId)
                .append(controllingAreaId, component.controllingAreaId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceId)
                .append(validFrom)
                .append(accountId)
                .append(controllingAreaId)
                .toHashCode();
    }
}
