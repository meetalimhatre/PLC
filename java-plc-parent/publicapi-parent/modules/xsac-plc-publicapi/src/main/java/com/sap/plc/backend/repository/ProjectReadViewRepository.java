package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.instanceprivilege.project.ProjectReadView;
import com.sap.plc.backend.model.pks.ProjectInstancePrivilegeViewPrimaryKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectReadViewRepository
        extends PLCRepository<ProjectReadView, ProjectInstancePrivilegeViewPrimaryKey> {

    Page<ProjectReadView> findAllByProjectIdInAndUserId(List<String> projectIds, String userId, Pageable pageable);
}
