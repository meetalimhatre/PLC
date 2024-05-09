package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.PriceSource;
import com.sap.plc.backend.model.Project;
import com.sap.plc.backend.model.pks.MaterialPricePrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.mutable.MutableObject;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

@IdClass(MaterialPricePrimaryKey.class)
@Entity
@Table(name = MaterialPrice.TABLE_NAME)
public class MaterialPrice extends Masterdata<MaterialPrice, MaterialPricePrimaryKey> {

    private static final long serialVersionUID = 3264942484505399538L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_material_price`";
    private static final String EXTENSION_TABLE_NAME = "`sap.plc.db::basis.t_material_price_ext`";
    private static final String PRICE_ID_COLUMN_NAME = "PRICE_ID";
    private static final String VALID_FROM_COLUMN_NAME = "_VALID_FROM";

    private static final String MATERIAL_PRICE_BUSINESS_OBJECT_AND_PATH = "Material_Price";
    private static final BigDecimal DEFAULT_VALID_FROM_QUANTITY = BigDecimal.ONE.setScale(7, RoundingMode.FLOOR);
    private static final BigDecimal DEFAULT_PRICE_FIXED_PORTION = BigDecimal.ZERO;
    private static final BigDecimal DEFAULT_PRICE_VARIABLE_PORTION = BigDecimal.ZERO;

    @Id
    @Column(name = PRICE_ID_COLUMN_NAME, nullable = false, length = 32)
    private String priceId;

    @Column(name = "VALID_FROM", nullable = false, length = 10)
    private Date validFromDate;

    @Column(name = "VALID_TO", length = 10)
    private Date validToDate;

    @Column(name = "PRICE_SOURCE_ID", nullable = false, length = 20)
    @Fk(PriceSource.class)
    private String priceSourceId;

    @Column(name = "MATERIAL_ID", nullable = false, length = 40)
    @Fk(Material.class)
    private String materialId;

    @Column(name = "PLANT_ID", nullable = false, length = 8)
    @Fk(value = Plant.class, isWildcard = true)
    private String plantId;

    @Column(name = "VENDOR_ID", nullable = false, length = 10)
    @Fk(value = Vendor.class, isWildcard = true)
    private String vendorId;

    @Column(name = "PURCHASING_GROUP", length = 20)
    private String purchasingGroup;

    @Column(name = "PURCHASING_DOCUMENT", length = 10)
    private String purchasingDocument;

    @Column(name = "LOCAL_CONTENT")
    private BigDecimal localContent;

    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    @Fk(value = Project.class, isWildcard = true)
    private String projectId;

    @Column(name = "CUSTOMER_ID", nullable = false, length = 10)
    @Fk(value = Customer.class, isWildcard = true)
    private String customerId;

    @Column(name = "VALID_FROM_QUANTITY", nullable = false, length = 28)
    private BigDecimal validFromQuantity;

    @Column(name = "VALID_TO_QUANTITY", length = 28)
    private BigDecimal validToQuantity;

    @Column(name = "PRICE_FIXED_PORTION", nullable = false, length = 28)
    private BigDecimal priceFixedPortion;

    @Column(name = "PRICE_VARIABLE_PORTION", nullable = false, length = 28)
    private BigDecimal priceVariablePortion;

    @Column(name = "TRANSACTION_CURRENCY_ID", nullable = false, length = 3)
    @Fk(value = Currency.class, name = "currencyId")
    private String transactionCurrencyId;

    @Column(name = "PRICE_UNIT", nullable = false, length = 28)
    private BigDecimal priceUnit;

    @Column(name = "PRICE_UNIT_UOM_ID", nullable = false, length = 3)
    @Fk(value = Uom.class, name = "uomId")
    private String priceUnitUomId;

    @Column(name = "IS_PRICE_SPLIT_ACTIVE", nullable = false)
    private Boolean isPriceSplitActive;

    @Column(name = "IS_PREFERRED_VENDOR", nullable = false)
    private Boolean isPreferredVendor;

    @Column(name = "_VALID_FROM_FIRST_VERSION")
    protected Timestamp validFromFirstVersion;

    @Column(name = "_CREATED_BY_FIRST_VERSION", length = 256)
    protected String createdByFirstVersion;

    @Transient
    private List<PriceComponent> priceComponents;

    @PrePersist
    public void setDefaults() {
        super.setDefaults();
        if (validFromQuantity == null) {
            validFromQuantity = DEFAULT_VALID_FROM_QUANTITY;
        }
        if (priceFixedPortion == null) {
            priceFixedPortion = DEFAULT_PRICE_FIXED_PORTION;
        }
        if (priceVariablePortion == null) {
            priceVariablePortion = DEFAULT_PRICE_VARIABLE_PORTION;
        }
    }

    @Override
    public String getEntityId() {
        return this.priceId;
    }

    @Override
    public String getUniqueQuery() {
        return "validFrom=" + this.validFrom;
    }

    public static String getPriceIdColumnName() {
        return PRICE_ID_COLUMN_NAME;
    }

    public static String getValidFromColumnName() {
        return VALID_FROM_COLUMN_NAME;
    }

    public void setValidFromDate(Date validFrom) {
        this.validFromDate = validFrom;
    }

    public void setValidToDate(Date validTo) {
        this.validToDate = validTo;
    }

    public String getPriceSourceId() {
        return priceSourceId;
    }

    public void setPriceSourceId(String priceSourceId) {
        this.priceSourceId = priceSourceId;
    }

    public String getMaterialId() {
        return materialId;
    }

    public void setMaterialId(String materialId) {
        this.materialId = materialId;
    }

    public String getPlantId() {
        return plantId;
    }

    public void setPlantId(String plantId) {
        this.plantId = plantId;
    }

    public String getVendorId() {
        return vendorId;
    }

    public void setVendorId(String vendorId) {
        this.vendorId = vendorId;
    }

    public String getPurchasingGroup() {
        return purchasingGroup;
    }

    public void setPurchasingGroup(String purchasingGroup) {
        this.purchasingGroup = purchasingGroup;
    }

    public String getPurchasingDocument() {
        return purchasingDocument;
    }

    public void setPurchasingDocument(String purchasingDocument) {
        this.purchasingDocument = purchasingDocument;
    }

    public BigDecimal getLocalContent() {
        return localContent;
    }

    public void setLocalContent(BigDecimal localContent) {
        this.localContent = localContent;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public BigDecimal getValidFromQuantity() {
        return validFromQuantity;
    }

    public void setValidFromQuantity(BigDecimal validFromQuantity) {
        if (validFromQuantity == null) {
            this.validFromQuantity = null;
        } else {
            this.validFromQuantity = validFromQuantity.setScale(7, RoundingMode.FLOOR);
        }
    }

    public BigDecimal getValidToQuantity() {
        return validToQuantity;
    }

    public void setValidToQuantity(BigDecimal validToQuantity) {
        this.validToQuantity = validToQuantity;
    }

    public BigDecimal getPriceFixedPortion() {
        return priceFixedPortion;
    }

    public void setPriceFixedPortion(BigDecimal priceFixedPortion) {
        this.priceFixedPortion = priceFixedPortion;
    }

    public BigDecimal getPriceVariablePortion() {
        return priceVariablePortion;
    }

    public void setPriceVariablePortion(BigDecimal priceVariablePortion) {
        this.priceVariablePortion = priceVariablePortion;
    }

    public String getTransactionCurrencyId() {
        return transactionCurrencyId;
    }

    public void setTransactionCurrencyId(String transactionCurrencyId) {
        this.transactionCurrencyId = transactionCurrencyId;
    }

    public BigDecimal getPriceUnit() {
        return priceUnit;
    }

    public void setPriceUnit(BigDecimal priceUnit) {
        this.priceUnit = priceUnit;
    }

    public String getPriceUnitUomId() {
        return priceUnitUomId;
    }

    public void setPriceUnitUomId(String priceUnitUomId) {
        this.priceUnitUomId = priceUnitUomId;
    }

    public Date getValidFromDate() {
        return validFromDate;
    }

    public Date getValidToDate() {
        return validToDate;
    }

    public Boolean getIsPriceSplitActive() {
        return isPriceSplitActive;
    }

    public void setIsPriceSplitActive(Boolean isPriceSplitActive) {
        this.isPriceSplitActive = isPriceSplitActive;
    }

    public Boolean getIsPreferredVendor() {
        return isPreferredVendor;
    }

    public void setIsPreferredVendor(Boolean isPreferredVendor) {
        this.isPreferredVendor = isPreferredVendor;
    }

    public List<PriceComponent> getPriceComponents() {
        return priceComponents;
    }

    public void setPriceComponents(List<PriceComponent> priceComponents) {
        this.priceComponents = priceComponents;
    }

    public String getPriceId() {
        return priceId;
    }

    public void setPriceId(String priceId) {
        this.priceId = priceId;
    }

    @Override
    public Map getTextsMap() {
        return null;
    }

    @Override
    public void setTextsMap(Map<String, Object> textsMap) {
        //inhereted from parent class
    }

    public Timestamp getValidFromFirstVersion() {
        return validFromFirstVersion;
    }

    public String getCreatedByFirstVersion() {
        return createdByFirstVersion;
    }

    public void setValidFromFirstVersion(Timestamp validFromFirstVersion) {
        this.validFromFirstVersion = validFromFirstVersion;
    }

    public void setCreatedByFirstVersion(String createdByFirstVersion) {
        this.createdByFirstVersion = createdByFirstVersion;
    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        MaterialPrice materialPrice = (MaterialPrice) o;

        return new EqualsBuilder()
                .append(materialPrice, materialPrice.priceId)
                .isEquals();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        MaterialPrice that = (MaterialPrice) o;

        return new EqualsBuilder()
                .append(priceId, that.priceId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public MaterialPricePrimaryKey getEntityKey() {
        if (priceId == null) {
            return null;
        }
        return new MaterialPricePrimaryKey(priceId, validFrom);
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return MATERIAL_PRICE_BUSINESS_OBJECT_AND_PATH;
    }

    @Override
    public String getMetadataPath() {
        return MATERIAL_PRICE_BUSINESS_OBJECT_AND_PATH;
    }

    @Override
    public String getMetadataBusinessObject() {
        return MATERIAL_PRICE_BUSINESS_OBJECT_AND_PATH;
    }

    @Override
    public String getExtensionTableName() {
        return EXTENSION_TABLE_NAME;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceId", priceId)
                .append("validFromDate", validFromDate)
                .append("validToDate", validToDate)
                .append("priceSourceId", priceSourceId)
                .append("materialId", materialId)
                .append("plantId", plantId)
                .append("vendorId", vendorId)
                .append("purchasingGroup", purchasingGroup)
                .append("purchasingDocument", purchasingDocument)
                .append("localContent", localContent)
                .append("projectId", projectId)
                .append("customerId", customerId)
                .append("validFromQuantity", validFromQuantity)
                .append("validToQuantity", validToQuantity)
                .append("priceFixedPortion", priceFixedPortion)
                .append("priceVariablePortion", priceVariablePortion)
                .append("transactionCurrencyId", transactionCurrencyId)
                .append("priceUnit", priceUnit)
                .append("validFromFirstVersion", validFromFirstVersion)
                .append("createdByFirstVersion", createdByFirstVersion)
                .append("priceUnitUomId", priceUnitUomId)
                .append("isPriceSplitActive", isPriceSplitActive)
                .append("isPreferredVendor", isPreferredVendor)
                .toString();
    }

    @Transient
    public MutableObject<MaterialPrice> getCreateUniqueKey() {

        return new MutableObject<MaterialPrice>(this) {

            public MaterialPrice getMaterialPrice() {
                return getValue();
            }

            @Override
            public int hashCode() {
                return new HashCodeBuilder(17, 37)
                        .append(getPriceSourceId())
                        .append(getMaterialId())
                        .append(getPlantId())
                        .append(getVendorId())
                        .append(getProjectId())
                        .append(getCustomerId())
                        .append(getValidFromDate())
                        .append(getValidFromQuantity())
                        .toHashCode();
            }

            @Override
            public boolean equals(Object obj) {

                if (this == obj) {
                    return true;
                }

                if (obj == null || getClass() != obj.getClass()) {
                    return false;
                }

                MaterialPrice that = this.getClass().cast(obj).getMaterialPrice();

                return new EqualsBuilder()
                        .append(getPriceSourceId(), that.getPriceSourceId())
                        .append(getMaterialId(), that.getMaterialId())
                        .append(getPlantId(), that.getPlantId())
                        .append(getVendorId(), that.getVendorId())
                        .append(getProjectId(), that.getProjectId())
                        .append(getCustomerId(), that.getCustomerId())
                        .append(getValidFromDate(), that.getValidFromDate())
                        .append(getValidFromQuantity(), that.getValidFromQuantity())
                        .isEquals();
            }

            @Override
            public String toString() {
                return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                        .append("priceSourceId", getPriceSourceId())
                        .append("materialId", getMaterialId())
                        .append("plantId", getPlantId())
                        .append("vendorId", getVendorId())
                        .append("projectId", getProjectId())
                        .append("customerId", getCustomerId())
                        .append("validFromDate", getValidFromDate())
                        .append("validFromQuantity", getValidFromQuantity())
                        .toString();
            }
        };
    }
}
