package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.PriceSource;
import com.sap.plc.backend.model.Project;
import com.sap.plc.backend.model.pks.ActivityPricePrimaryKey;
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

import static com.sap.plc.backend.model.masterdata.ActivityPrice.TABLE_NAME;

@Table(name = TABLE_NAME)
@Entity
@IdClass(ActivityPricePrimaryKey.class)
public class ActivityPrice extends Masterdata<ActivityPrice, ActivityPricePrimaryKey> {

    private static final long serialVersionUID = -6752743324824045404L;

    static final String TABLE_NAME = "`sap.plc.db::basis.t_activity_price`";
    private static final String EXTENSION_TABLE_NAME = "`sap.plc.db::basis.t_activity_price_ext`";

    private static final String ACTIVITY_PRICE_BUSINESS_OBJECT_AND_PATH = "Activity_Price";

    private static final String PRICE_ID_COLUMN_NAME = "PRICE_ID";
    private static final String VALID_FROM_COLUMN_NAME = "_VALID_FROM";
    private static final BigDecimal DEFAULT_VALID_FROM_QUANTITY = BigDecimal.ONE.setScale(7, RoundingMode.FLOOR);
    private static final BigDecimal DEFAULT_PRICE_FIXED_PORTION = BigDecimal.ZERO;
    private static final BigDecimal DEFAULT_PRICE_VARIABLE_PORTION = BigDecimal.ZERO;

    @Id
    @Column(name = PRICE_ID_COLUMN_NAME, nullable = false, length = 32)
    private String priceId;

    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    @Fk(value = ControllingArea.class, isWildcard = true)
    private String controllingAreaId;

    @Column(name = "COST_CENTER_ID", nullable = false, length = 10)
    @Fk(value = CostCenter.class, isWildcard = true)
    private String costCenterId;

    @Column(name = "ACTIVITY_TYPE_ID", nullable = false, length = 12)
    @Fk(value = ActivityType.class, isWildcard = true)
    private String activityTypeId;

    @Column(name = "VALID_FROM", nullable = false, length = 10)
    private Date validFromDate;

    @Column(name = "VALID_TO", length = 10)
    private Date validToDate;

    @Column(name = "PRICE_SOURCE_ID", nullable = false, length = 20)
    @Fk(PriceSource.class)
    private String priceSourceId;

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

    public static String getPriceIdColumnName() {
        return PRICE_ID_COLUMN_NAME;
    }

    public static String getValidFromColumnName() {
        return VALID_FROM_COLUMN_NAME;
    }

    public String getPriceId() {
        return priceId;
    }

    public void setPriceId(String priceId) {
        this.priceId = priceId;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getCostCenterId() {
        return costCenterId;
    }

    public void setCostCenterId(String costCenterId) {
        this.costCenterId = costCenterId;
    }

    public String getActivityTypeId() {
        return activityTypeId;
    }

    public void setActivityTypeId(String activityTypeId) {
        this.activityTypeId = activityTypeId;
    }

    public Date getValidFromDate() {
        return validFromDate;
    }

    public void setValidFromDate(Date validFromDate) {
        this.validFromDate = validFromDate;
    }

    public Date getValidToDate() {
        return validToDate;
    }

    public void setValidToDate(Date validToDate) {
        this.validToDate = validToDate;
    }

    public String getPriceSourceId() {
        return priceSourceId;
    }

    public void setPriceSourceId(String priceSourceId) {
        this.priceSourceId = priceSourceId;
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

    public Boolean getIsPriceSplitActive() {
        return isPriceSplitActive;
    }

    public void setIsPriceSplitActive(Boolean isPriceSplitActive) {
        this.isPriceSplitActive = isPriceSplitActive;
    }

    public List<PriceComponent> getPriceComponents() {
        return priceComponents;
    }

    public void setPriceComponents(List<PriceComponent> priceComponents) {
        this.priceComponents = priceComponents;
    }

    @Override
    public String getEntityId() {
        return null;
    }

    @Override
    public String getUniqueQuery() {
        return null;
    }

    @Override
    public Map getTextsMap() {
        return null;
    }

    @Override
    public void setTextsMap(Map<String, Object> textsMap) {
        //inherited from upper class. Entity does not have texts
    }

    public Timestamp getValidFromFirstVersion() {
        return validFromFirstVersion;
    }

    public void setValidFromFirstVersion(Timestamp validFromFirstVersion) {
        this.validFromFirstVersion = validFromFirstVersion;
    }

    public String getCreatedByFirstVersion() {
        return createdByFirstVersion;
    }

    public void setCreatedByFirstVersion(String createdByFirstVersion) {
        this.createdByFirstVersion = createdByFirstVersion;
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return ACTIVITY_PRICE_BUSINESS_OBJECT_AND_PATH;
    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ActivityPrice activityPrice = (ActivityPrice) o;

        return new EqualsBuilder()
                .append(activityPrice, activityPrice.priceId)
                .isEquals();
    }

    @Override
    public ActivityPricePrimaryKey getEntityKey() {
        if (priceId == null) {
            return null;
        }
        return new ActivityPricePrimaryKey(priceId, validFrom);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ActivityPrice that = (ActivityPrice) o;

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
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("priceId", priceId)
                .append("controllingAreaId", controllingAreaId)
                .append("costCenterId", costCenterId)
                .append("activityTypeId", activityTypeId)
                .append("validFromDate", validFromDate)
                .append("validToDate", validToDate)
                .append("priceSourceId", priceSourceId)
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
                .append("priceComponents", priceComponents)
                .append("source", source)
                .append("createdBy", createdBy)
                .append("validFromFirstVersion", validFromFirstVersion)
                .append("createdByFirstVersion", createdByFirstVersion)
                .append("validFrom", validFrom)
                .append("validTo", validTo)
                .append("customFields", customFields)
                .toString();
    }

    @Override
    public String getExtensionTableName() {
        return EXTENSION_TABLE_NAME;
    }

    @Transient
    public MutableObject<ActivityPrice> getCreateUniqueKey() {
        return new MutableObject<ActivityPrice>(this) {

            public ActivityPrice getActivityPrice() {
                return getValue();
            }

            @Override
            public int hashCode() {
                return new HashCodeBuilder(17, 37)
                        .append(getPriceSourceId())
                        .append(getControllingAreaId())
                        .append(getCostCenterId())
                        .append(getActivityTypeId())
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

                ActivityPrice that = this.getClass().cast(obj).getActivityPrice();

                return new EqualsBuilder()
                        .append(getPriceSourceId(), that.getPriceSourceId())
                        .append(getControllingAreaId(), that.getControllingAreaId())
                        .append(getCostCenterId(), that.getCostCenterId())
                        .append(getActivityTypeId(), that.getActivityTypeId())
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
                        .append("controllingAreaId", getControllingAreaId())
                        .append("costCenterId", getCostCenterId())
                        .append("activityTypeId", getActivityTypeId())
                        .append("projectId", getProjectId())
                        .append("customerId", getCustomerId())
                        .append("validFromDate", getValidFromDate())
                        .append("validFromQuantity", getValidFromQuantity())
                        .toString();
            }
        };
    }

}
