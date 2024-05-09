package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.AccountPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import static com.sap.plc.backend.model.masterdata.Account.TABLE_NAME;

@IdClass(AccountPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class Account extends Masterdata<Account, AccountPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_account`";
    private static final long serialVersionUID = -3402432133735194216L;

    @Id
    @Column(name = "ACCOUNT_ID", nullable = false, length = 10)
    private String accountId;

    @Id
    @Fk(value = ControllingArea.class)
    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    private String controllingAreaId;

    @Transient
    private List<AccountText> texts;

    public Account(String accountId, String controllingAreaId, Integer source, String createdBy, Timestamp validFrom, Timestamp validTo) {
        this.accountId = accountId;
        this.controllingAreaId = controllingAreaId;
        this.source = source;
        this.createdBy = createdBy;
        this.validFrom = validFrom;
        this.validTo = validTo;
    }

    public Account() {
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public List<AccountText> getTexts() {
        return texts;
    }

    public void setTexts(List<AccountText> texts) {
        this.texts = texts;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Account that = (Account) o;

        return new EqualsBuilder()
                .append(accountId, that.accountId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(accountId)
                .append(controllingAreaId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String getEntityId() {
        return this.accountId;
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

        Account that = (Account) o;

        return new EqualsBuilder()
                .append(accountId, that.accountId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return this.getClass().getSimpleName();
    }
}
