package com.sap.plc.backend.model;

import com.sap.plc.backend.model.masterdata.Account;
import com.sap.plc.backend.model.masterdata.Currency;
import com.sap.plc.backend.model.pks.OneTimeProjectCostPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.mutable.MutableObject;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.OneTimeProjectCost.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME)
@IdClass(OneTimeProjectCostPrimaryKey.class)
public class OneTimeProjectCost
        extends com.sap.plc.backend.model.Entity<OneTimeProjectCost, OneTimeProjectCostPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_one_time_project_cost`";
    public static final String SEQUENCE_NAME = "`sap.plc.db.sequence::s_one_time_project_cost_id`";
    private static final long serialVersionUID = -4656241029702801265L;

    public OneTimeProjectCost() {
    }

    public OneTimeProjectCost(Integer oneTimeCostId) {
        this.oneTimeCostId = oneTimeCostId;
    }

    @Id
    @Column(name = "ONE_TIME_COST_ID", nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ONE_TIME_COST_SEQUENCE")
    @GenericGenerator(name = "ONE_TIME_COST_SEQUENCE",
            strategy = "com.sap.plc.backend.model.sequencegenerator.OneTimeProjectCostSequenceStyleGenerator")
    private Integer oneTimeCostId;

    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Fk(value = Account.class)
    @Column(name = "ACCOUNT_ID", nullable = false, length = 10)
    private String accountId;

    @Column(name = "COST_DESCRIPTION", nullable = false, length = 250)
    private String costDescription;

    @Column(name = "COST_TO_DISTRIBUTE", nullable = false, length = 28, precision = 7)
    private BigDecimal costToDistribute;

    @Column(name = "COST_NOT_DISTRIBUTED", nullable = false, length = 28, precision = 7)
    private BigDecimal costNotDistributed;

    @Fk(value = Currency.class, name = "currencyId")
    @Column(name = "COST_CURRENCY_ID", nullable = false, length = 3)
    private String costCurrencyId;

    @Column(name = "FIXED_COST_PORTION", nullable = false, length = 28, precision = 7)
    @ColumnDefault(value = "100")
    private BigDecimal fixedCostPortion;

    @Column(name = "DISTRIBUTION_TYPE", nullable = false)
    @ColumnDefault(value = "0")
    private Integer distributionType;

    @Column(name = "LAST_MODIFIED_ON", nullable = false)
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY", nullable = false, length = 256)
    private String lastModifiedBy;

    public Integer getOneTimeCostId() {
        return oneTimeCostId;
    }

    public void setOneTimeCostId(Integer oneTimeCostId) {
        this.oneTimeCostId = oneTimeCostId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getCostDescription() {
        return costDescription;
    }

    public void setCostDescription(String costDescription) {
        this.costDescription = costDescription;
    }

    public BigDecimal getCostToDistribute() {
        return costToDistribute;
    }

    public void setCostToDistribute(BigDecimal costToDistribute) {
        this.costToDistribute = costToDistribute;
    }

    public BigDecimal getCostNotDistributed() { return costNotDistributed; }

    public void setCostNotDistributed(BigDecimal costNotDistributed) { this.costNotDistributed = costNotDistributed; }

    public String getCostCurrencyId() {
        return costCurrencyId;
    }

    public void setCostCurrencyId(String costCurrencyId) {
        this.costCurrencyId = costCurrencyId;
    }

    public BigDecimal getFixedCostPortion() {
        return fixedCostPortion;
    }

    public void setFixedCostPortion(BigDecimal fixedCostPortion) {
        this.fixedCostPortion = fixedCostPortion;
    }

    public Integer getDistributionType() {
        return distributionType;
    }

    public void setDistributionType(Integer distributionType) {
        this.distributionType = distributionType;
    }

    public Timestamp getLastModifiedOn() {
        return lastModifiedOn;
    }

    public void setLastModifiedOn(Timestamp lastModifiedOn) {
        this.lastModifiedOn = lastModifiedOn;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof OneTimeProjectCost)) {
            return false;
        }

        OneTimeProjectCost that = (OneTimeProjectCost) o;

        return new EqualsBuilder()
                .append(oneTimeCostId, that.oneTimeCostId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(oneTimeCostId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return "OneTimeProjectCost{" +
                "oneTimeCostId=" + oneTimeCostId +
                ", projectId='" + projectId + '\'' +
                ", accountId='" + accountId + '\'' +
                ", costDescription='" + costDescription + '\'' +
                ", costToDistribute=" + costToDistribute +
                ", costCurrencyId='" + costCurrencyId + '\'' +
                ", fixedCostPortion=" + fixedCostPortion +
                ", distributionType=" + distributionType + '\'' +
                '}';
    }

    /**
     * Method used to override equals and hashcode methods in order to remove duplicated cost descriptions from request
     * based on cost description *
     * project id
     *
     * @return returns an OTPC entity
     */
    @Transient
    public MutableObject<OneTimeProjectCost> getCostDescriptionUniqueKey() {

        return new MutableObject<OneTimeProjectCost>(this) {

            public OneTimeProjectCost getMOneTimeProjectCost() {
                return getValue();
            }

            @Override
            public int hashCode() {
                return new HashCodeBuilder(17, 37)
                        .append(getCostDescription())
                        .append(getProjectId())
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

                OneTimeProjectCost that = this.getClass().cast(obj).getMOneTimeProjectCost();

                return new EqualsBuilder()
                        .append(getCostDescription(), that.getCostDescription())
                        .append(getProjectId(), that.getProjectId())
                        .isEquals();
            }
        };
    }
}
