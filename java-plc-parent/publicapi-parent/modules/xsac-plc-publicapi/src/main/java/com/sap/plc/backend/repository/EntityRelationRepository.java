package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.EntityRelation;
import com.sap.plc.backend.model.EntityRelationView;
import com.sap.plc.backend.model.EntityType;
import com.sap.plc.backend.repository.cust.entityrelation.EntityRelationCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface EntityRelationRepository
        extends JpaRepository<EntityRelation, Integer>, EntityRelationCustomRepository,
        JpaSpecificationExecutor<EntityRelation> {

    String checkForAlreadyExistingEntity(Integer parentId, String entityName, EntityType entityType);

    Integer countFoldersInParent(Integer  parentId, EntityType entityType);

    List<EntityRelationView> getChildren(Integer entityId);

    List<EntityRelation> findByEntityIdIn(List<Integer> parentFolderIds);

    EntityRelation findByEntityIdAndEntityType(Integer parentFolderIds, String entityType);

    @Transactional
    @Modifying
    void deleteByEntityIdIn(List<Integer> entityId);

    @Modifying
    void deleteByEntityId(Integer entityId);

    @Query(value = "SELECT erv.resultNode FROM EntityRelationView erv " +
            "WHERE erv.resultNode IN :entityIds AND erv.isLeaf = 1")
    List<Integer> findEmptyEntityByActualIdIn(@Param("entityIds") List<Integer> entityIds);

    @Query(value = "SELECT DISTINCT erv.predNode FROM EntityRelationView erv WHERE erv.resultNode IN :entityIds")
    List<Integer> findParentIdsByEntityIdIn(@Param("entityIds") List<Integer> entityIds);

    @Query(value = "SELECT DISTINCT erv FROM EntityRelationView erv WHERE erv.resultNode IN :entityIds")
    List<EntityRelationView> findEntitiesByEntityIdIn(@Param("entityIds") List<Integer> entityIds);

    /**
     * Finds all the authorized projects for current user contained in given folders
     *
     * @param parentFolderIds folders to search projects in
     * @param authenticatedUser current logged in user
     * @return list of project entity relations
     */
    @Query(value = "SELECT er FROM EntityRelation er JOIN ProjectReadView prv ON er.entityId = prv.entityId WHERE " +
            "er.parentId IN :parentFolderIds AND er.entityType = 'P' AND prv.userId = :authenticatedUser")
    List<EntityRelation> findProjectERsForAuthorizedProjects(List<Integer> parentFolderIds, String authenticatedUser);

    /**
     * Finds all the folders from given list that contain at least one folder
     *
     * @param parentFolderIds list of folders
     * @return folder ids of the folders that contain at least one folder
     */
    @Query(value = "SELECT DISTINCT er.parentId FROM EntityRelation er WHERE er.parentId IN " +
            ":parentFolderIds AND er.entityType = 'F'")
    List<Integer> findFolderIdsWithFoldersAsChildren(List<Integer> parentFolderIds);
}
