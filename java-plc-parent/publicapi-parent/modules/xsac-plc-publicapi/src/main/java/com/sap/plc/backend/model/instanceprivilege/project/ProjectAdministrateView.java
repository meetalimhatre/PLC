package com.sap.plc.backend.model.instanceprivilege.project;

import com.sap.plc.backend.model.pks.ProjectInstancePrivilegeViewPrimaryKey;

import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.instanceprivilege.project.ProjectAdministrateView.VIEW_NAME;

@IdClass(ProjectInstancePrivilegeViewPrimaryKey.class)
@jakarta.persistence.Entity
@Table(name = VIEW_NAME)
public class ProjectAdministrateView extends ProjectInstancePrivilegeView<ProjectAdministrateView> {
    static final String VIEW_NAME = "`sap.plc.db.authorization::privileges.v_project_administrate`";
}
