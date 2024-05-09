package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.StatusTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.StatusText.TABLE_NAME;

@IdClass(StatusTextPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class StatusText extends com.sap.plc.backend.model.Entity<StatusText, StatusTextPrimaryKey>{

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_status__text`" ;
    private static final long serialVersionUID = -4597680389713512175L;

    @Id
    @Column(name = "STATUS_ID")
    private String statusId;

    @Id
    @Column(name = "LANGUAGE")
    private String language;

    @Column(name = "STATUS_DESCRIPTION")
    private String description;

    @Column(name = "STATUS_NAME")
    private String statusName;

    public StatusText(String statusId, String language, String description, String statusName) {
        this.statusId = statusId;
        this.language = language;
        this.description = description;
        this.statusName = statusName;
    }

    public StatusText(String language, String description, String statusName) {
        this.language = language;
        this.description = description;
        this.statusName = statusName;
    }
    public StatusText() {
    }

    public String getStatusId() {
        return statusId;
    }

    public void setStatusId(String statusId) {
        this.statusId = statusId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatusName() {
        return statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        StatusText that = (StatusText) o;

        return new EqualsBuilder()
                .append(statusId, that.statusId)
                .append(language, that.language)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(statusId)
                .append(language)
                .toHashCode();
    }


}
