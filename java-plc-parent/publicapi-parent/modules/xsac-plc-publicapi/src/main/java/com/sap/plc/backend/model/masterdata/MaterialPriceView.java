package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.MaterialPricePrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.mutable.MutableObject;
import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;
import java.util.Map;

import static com.sap.plc.backend.model.masterdata.MaterialPriceView.VIEW_NAME;

@IdClass(MaterialPricePrimaryKey.class)
@Entity
@Immutable
@Table(name = VIEW_NAME)
public class MaterialPriceView extends Masterdata<MaterialPriceView, MaterialPricePrimaryKey> {

    private static final long serialVersionUID = -3344570933306205535L;

    private static final String EXTENSION_TABLE_NAME = "`sap.plc.db::basis.t_material_price_ext`";
    private static final String PRICE_ID_COLUMN_NAME = "PRICE_ID";
    private static final String VALID_FROM_COLUMN_NAME = "_VALID_FROM";
    private static final String MATERIAL_PRICE_BUSINESS_OBJECT_AND_PATH = "Material_Price";
    public static final String VIEW_NAME = "`sap.plc.db.views::v_material_price`";

    @Id
    @Column(name = PRICE_ID_COLUMN_NAME, nullable = false, length = 32)
    private String priceId;

    @Column(name = "VALID_FROM", nullable = false, length = 10)
    private Date validFromDate;

    @Column(name = "VALID_TO", length = 10)
    private Date validToDate;

    @Column(name = "PRICE_SOURCE_ID", nullable = false, length = 20)
    private String priceSourceId;

    @Column(name = "MATERIAL_ID", nullable = false, length = 40)
    private String materialId;

    @Column(name = "PLANT_ID", nullable = false, length = 8)
    private String plantId;

    @Column(name = "VENDOR_ID", nullable = false, length = 10)
    private String vendorId;

    @Column(name = "PURCHASING_GROUP", length = 20)
    private String purchasingGroup;

    @Column(name = "PURCHASING_DOCUMENT", length = 10)
    private String purchasingDocument;

    @Column(name = "LOCAL_CONTENT", length = 28)
    private String localContent;

    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Column(name = "CUSTOMER_ID", nullable = false, length = 10)
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
    private String transactionCurrencyId;

    @Column(name = "PRICE_UNIT", nullable = false, length = 28)
    private BigDecimal priceUnit;

    @Column(name = "PRICE_UNIT_UOM_ID", nullable = false, length = 3)
    private String priceUnitUomId;

    @Column(name = "IS_PRICE_SPLIT_ACTIVE", nullable = false)
    private Boolean isPriceSplitActive;

    @Column(name = "IS_PREFERRED_VENDOR", nullable = false)
    private Boolean isPreferredVendor;

    @Transient
    private List<PriceComponent> priceComponents;

    @Column(name = "MATERIAL_DESCRIPTION", length = 250)
    private String materialDescription;

    @Column(name = "MATERIAL_LANGUAGE", nullable = false, length = 11)
    private String materialLanguage;

    public String getMaterialDescription() {
        return materialDescription;
    }

    public void setMaterialDescription(String materialDescription) {
        this.materialDescription = materialDescription;
    }

    public String getMaterialLanguage() {
        return materialLanguage;
    }

    public void setMaterialLanguage(String materialLanguage) {
        this.materialLanguage = materialLanguage;
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

    public String getLocalContent() {
        return localContent;
    }

    public void setLocalContent(String localContent) {
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
        this.validFromQuantity = validFromQuantity;
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

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        MaterialPriceView materialPrice = (MaterialPriceView) o;

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

        MaterialPriceView that = (MaterialPriceView) o;

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
        MaterialPricePrimaryKey key = new MaterialPricePrimaryKey(this.priceId, this.validFrom);
        return priceId != null ? key : null;
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
                .append("priceUnitUomId", priceUnitUomId)
                .append("isPriceSplitActive", isPriceSplitActive)
                .append("isPreferredVendor", isPreferredVendor)
                .toString();
    }

    @Transient
    public MutableObject<MaterialPriceView> getCreateUniqueKey() {

        return new MutableObject<MaterialPriceView>(this) {

            public MaterialPriceView getMaterialPriceView() {
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

                MaterialPriceView that = this.getClass().cast(obj).getMaterialPriceView();

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
                        .toString();
            }
        };
    }
}
