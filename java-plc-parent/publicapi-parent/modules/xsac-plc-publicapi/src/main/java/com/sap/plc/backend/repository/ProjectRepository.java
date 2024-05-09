package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.Project;
import com.sap.plc.backend.model.pks.ProjectPrimaryKey;
import com.sap.plc.backend.repository.cust.project.ProjectCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProjectRepository extends EntityRepository<Project, ProjectPrimaryKey>,
        ProjectCustomRepository, JpaRepository<Project, ProjectPrimaryKey>, JpaSpecificationExecutor<Project> {

    List<Project> findAllByActivityPriceStrategyIdIn(Collection<String> activityPriceStrategyIdCollection);

    List<Project> findAllByMaterialPriceStrategyIdIn(Collection<String> materialPriceStrategyIdCollection);

    @Query(nativeQuery = true,
            value = "select op.project_id from \"sap.plc.db::basis.t_open_projects\" op " +
                    "where op.project_id in :projectIds and op.session_id = :username and op.is_writeable = " +
                    ":isWriteable")
    List<String> findOpenedProjects(List<String> projectIds, Boolean isWriteable, String username);

    @Query(nativeQuery = true,
            value = "select op.project_id from \"sap.plc.db::basis.t_open_projects\" op " +
            "where op.project_id in :projectIds and op.session_id = :username")
    List<String> findOpenedProjects(List<String> projectIds, String username);

    boolean existsByProjectId(String projectId);

    List<Project> findAllByProjectIdIn(List<String> projectIds);
}