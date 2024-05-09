package com.sap.plc.backend.model.instanceprivilege;

import com.sap.plc.backend.model.Calculation;
import com.sap.plc.backend.model.CalculationVersion;
import com.sap.plc.backend.model.instanceprivilege.calculationversion.CalculationVersionPrivilege;
import com.sap.plc.backend.model.pks.AuthProjectPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.hibernate.annotations.NamedNativeQuery;

import jakarta.persistence.Column;
import jakarta.persistence.ColumnResult;
import jakarta.persistence.ConstructorResult;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.SqlResultSetMapping;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.instanceprivilege.AuthProject.TABLE_NAME;

@Entity
@IdClass(AuthProjectPrimaryKey.class)
@Table(name = TABLE_NAME)
@SqlResultSetMapping(
        name = "calculationVersionInstancePrivilegesMapping",
        classes = {
                @ConstructorResult(
                        targetClass = CalculationVersionPrivilege.class,
                        columns = {
                                @ColumnResult(name = "calculationVersionId"),
                                @ColumnResult(name = "privilege")
                        }
                )
        }
)
@NamedNativeQuery(name = "AuthProject.findAllCalculationVersionInstancePrivileges",
        query = "SELECT calculationJoin.CALCULATION_VERSION_ID AS calculationVersionId, auth.PRIVILEGE AS privilege " +
                "FROM " + AuthProject.TABLE_NAME_DOUBLE_QUOTES + " AS auth INNER JOIN " +
                "( SELECT calculation.PROJECT_ID, version.CALCULATION_VERSION_ID FROM " + Calculation.TABLE_NAME_DOUBLE_QUOTES +
                " AS calculation " +
                "INNER JOIN " +
                "  ( SELECT CALCULATION_VERSION_ID, CALCULATION_ID FROM " + CalculationVersion.TABLE_NAME_DOUBLE_QUOTES + " " +
                "    UNION " +
                "    SELECT CALCULATION_VERSION_ID, CALCULATION_ID FROM " + CalculationVersion.TEMPORARY_TABLE_NAME_DOUBLE_QUOTES + " " +
                "    WHERE SESSION_ID = :username " +
                "  ) AS version " +
                "  ON calculation.CALCULATION_ID = version.CALCULATION_ID " +
                ") AS calculationJoin " +
                "ON auth.PROJECT_ID = calculationJoin.PROJECT_ID " +
                "WHERE auth.USER_ID = :username AND calculationJoin.CALCULATION_VERSION_ID IN :calculationVersionIds",
        resultSetMapping = "calculationVersionInstancePrivilegesMapping")
public class AuthProject extends com.sap.plc.backend.model.Entity<AuthProject, AuthProjectPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::auth.t_auth_project`";
    static final String TABLE_NAME_DOUBLE_QUOTES = "\"sap.plc.db::auth.t_auth_project\"";
    private static final long serialVersionUID = -873077489800902531L;

    @Id
    @Column(name = "PROJECT_ID", nullable = false, length = 35)
    private String projectId;

    @Id
    @Column(name = "USER_ID", nullable = false, length = 256)
    private String userId;

    @Column(name = "PRIVILEGE", nullable = false, length = 20)
    private String privilege;

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPrivilege() {
        return privilege;
    }

    public void setPrivilege(String privilege) {
        this.privilege = privilege;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof AuthProject)) {
            return false;
        }

        AuthProject that = (AuthProject) o;

        return new EqualsBuilder()
                .append(projectId, that.projectId)
                .append(userId, that.userId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(projectId)
                .append(userId)
                .toHashCode();
    }
}
