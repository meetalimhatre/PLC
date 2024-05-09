package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.ActivityTypePrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.List;
import java.util.Map;

import static com.sap.plc.backend.model.masterdata.ActivityType.TABLE_NAME;

@IdClass(ActivityTypePrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class ActivityType extends Masterdata<ActivityType, ActivityTypePrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_activity_type`";
    private static final long serialVersionUID = 4500701956810021481L;
    private static final String METADATA_BUSINESS_OBJECT_AND_PATH = "Activity_Type";

    @Id
    @Column(name = "ACTIVITY_TYPE_ID", nullable = false, length = 12)
    private String activityTypeId;

    @Id
    @Fk(value = ControllingArea.class)
    @Column(name = "CONTROLLING_AREA_ID", nullable = false, length = 4)
    private String controllingAreaId;

    @Column(name = "ACCOUNT_ID", length = 10)
    private String accountId;

    @Transient
    private List<ActivityTypeText> texts;

    public String getActivityTypeId() {
        return activityTypeId;
    }

    public void setActivityTypeId(String activityTypeId) {
        this.activityTypeId = activityTypeId;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public List<ActivityTypeText> getTexts() {
        return texts;
    }

    public void setTexts(List<ActivityTypeText> texts) {
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

        ActivityType that = (ActivityType) o;

        return new EqualsBuilder()
                .append(activityTypeId, that.activityTypeId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(activityTypeId)
                .append(controllingAreaId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String getEntityId() {
        return this.activityTypeId;
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

        ActivityType that = (ActivityType) o;

        return new EqualsBuilder()
                .append(activityTypeId, that.activityTypeId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return METADATA_BUSINESS_OBJECT_AND_PATH;
    }
}
