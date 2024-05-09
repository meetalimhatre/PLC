package com.sap.plc.backend.model.masterdata;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.NamedNativeQueries;
import jakarta.persistence.NamedNativeQuery;
import jakarta.persistence.NamedQueries;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;

@Entity
@Table(name = MaterialPriceValidate.TABLE_NAME)
@NamedQueries({
        @NamedQuery(name = "materialPriceValidate.deleteAll", query = "delete from MaterialPriceValidate"),
        @NamedQuery(name = "materialPriceValidate.retrieveValidationResult",
                query = "select mpv.listIndex, mpv.priceId, mpv.fkIssue, mpv.ukIssue " +
                        "FROM MaterialPriceValidate mpv ORDER BY mpv.listIndex desc")
})
@NamedNativeQueries({
        /**
         * The procedure generates the primary key with a SYSUUID call in varchar(32) format,
         * validates the foreign keys (invalid foreign key rows will be populated as comma separated values
         * in the fk_issue column, for logging purposes) and also validates the logical unique key of: PRICE_SOURCE_ID,
         * MATERIAL_ID, PLANT_ID, VENDOR_ID, PROJECT_ID, CUSTOMER_ID, VALID_FROM,
         * VALID_FROM_QUANTITY (invalid unique key rows will have a value greater than 0 in the uk_issue column).
         * The data is processed in a global temporary table:
         * sap.plc.db.administration::maintemporarytables.gtt_validate_material_price
         */
        @NamedNativeQuery(name = "materialPriceValidate.callValidateProcedure",
                query = "CALL \"sap.plc.db.administration.procedures::p_validate_material_price\"")
})
public class MaterialPriceValidate implements Serializable {

    private static final long serialVersionUID = -3662959653748587578L;

    static final String TABLE_NAME = "`sap.plc.db.administration::maintemporarytables.gtt_validate_material_price`";

    @Id
    @Column(name = "LIST_INDEX")
    private Integer listIndex;

    @Column(name = "PRICE_ID", length = 32)
    private String priceId;

    @Column(name = "PRICE_SOURCE_ID", nullable = false, length = 20)
    private String priceSourceId;

    @Column(name = "MATERIAL_ID", nullable = false, length = 40)
    private String materialId;

    @Column(name = "PLANT_ID", nullable = false, length = 8)
    private String plantId;

    @Column(name = "VENDOR_ID", nullable = false, length = 10)
    private String vendorId;

    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Column(name = "CUSTOMER_ID", nullable = false, length = 10)
    private String customerId;

    @Column(name = "VALID_FROM", nullable = false, length = 10)
    private Date validFromDate;

    @Column(name = "VALID_FROM_QUANTITY", nullable = false, length = 28)
    private BigDecimal validFromQuantity;

    @Column(name = "TRANSACTION_CURRENCY_ID", nullable = false, length = 3)
    private String transactionCurrencyId;

    @Column(name = "PRICE_UNIT_UOM_ID", nullable = false, length = 3)
    private String priceUnitUomId;

    @Column(name = "FK_ISSUE", length = 100)
    private String fkIssue;

    @Column(name = "UK_ISSUE", nullable = false)
    private Integer ukIssue;

    @PrePersist
    public void setDefaults() {
        if (validFromQuantity == null) {
            validFromQuantity = BigDecimal.ONE;
        }
        if (ukIssue == null) {
            ukIssue = 0;
        }
    }

    public Integer getListIndex() {
        return listIndex;
    }

    public MaterialPriceValidate setListIndex(Integer listIndex) {
        this.listIndex = listIndex;
        return this;
    }

    public String getPriceId() {
        return priceId;
    }

    public MaterialPriceValidate setPriceId(String priceId) {
        this.priceId = priceId;
        return this;
    }

    public String getPriceSourceId() {
        return priceSourceId;
    }

    public MaterialPriceValidate setPriceSourceId(String priceSourceId) {
        this.priceSourceId = priceSourceId;
        return this;
    }

    public String getMaterialId() {
        return materialId;
    }

    public MaterialPriceValidate setMaterialId(String materialId) {
        this.materialId = materialId;
        return this;
    }

    public String getPlantId() {
        return plantId;
    }

    public MaterialPriceValidate setPlantId(String plantId) {
        this.plantId = plantId;
        return this;
    }

    public String getVendorId() {
        return vendorId;
    }

    public MaterialPriceValidate setVendorId(String vendorId) {
        this.vendorId = vendorId;
        return this;
    }

    public String getProjectId() {
        return projectId;
    }

    public MaterialPriceValidate setProjectId(String projectId) {
        this.projectId = projectId;
        return this;
    }

    public String getCustomerId() {
        return customerId;
    }

    public MaterialPriceValidate setCustomerId(String customerId) {
        this.customerId = customerId;
        return this;
    }

    public Date getValidFromDate() {
        return validFromDate;
    }

    public MaterialPriceValidate setValidFromDate(Date validFromDate) {
        this.validFromDate = validFromDate;
        return this;
    }

    public BigDecimal getValidFromQuantity() {
        return validFromQuantity;
    }

    public MaterialPriceValidate setValidFromQuantity(BigDecimal validFromQuantity) {
        this.validFromQuantity = validFromQuantity;
        return this;
    }

    public String getTransactionCurrencyId() {
        return transactionCurrencyId;
    }

    public MaterialPriceValidate setTransactionCurrencyId(String transactionCurrencyId) {
        this.transactionCurrencyId = transactionCurrencyId;
        return this;
    }

    public String getPriceUnitUomId() {
        return priceUnitUomId;
    }

    public MaterialPriceValidate setPriceUnitUomId(String priceUnitUomId) {
        this.priceUnitUomId = priceUnitUomId;
        return this;
    }

    public String getFkIssue() {
        return fkIssue;
    }

    public MaterialPriceValidate setFkIssue(String fkIssue) {
        this.fkIssue = fkIssue;
        return this;
    }

    public Integer getUkIssue() {
        return ukIssue;
    }

    public MaterialPriceValidate setUkIssue(Integer ukIssue) {
        this.ukIssue = ukIssue;
        return this;
    }
}
