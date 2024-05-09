package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.TagEntityRelation;
import com.sap.plc.backend.model.pks.TagEntityRelationPrimaryKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TagEntityRelationRepository extends JpaRepository<TagEntityRelation, TagEntityRelationPrimaryKey> {

    @Query(nativeQuery = true, value =
        "SELECT * FROM \"sap.plc.db::basis.t_entity_tags\" " +
        "WHERE \"ENTITY_TYPE\" = 'V' AND \"ENTITY_ID\" IN " +
        "(SELECT \"CALCULATION_VERSION_ID\" FROM \"sap.plc.db::basis.t_calculation_version\" " +
        "WHERE \"CALCULATION_ID\" = :calculationId)")
    List<TagEntityRelation> findByCalculationIdIn(@Param("calculationId")Integer calculationId);

    @Query(nativeQuery = true, value =
        "SELECT * FROM \"sap.plc.db::basis.t_entity_tags\" " +
        "WHERE \"ENTITY_TYPE\" = 'C' AND \"ENTITY_ID\" IN " +
        "(SELECT \"CALCULATION_ID\" FROM \"sap.plc.db::basis.t_calculation\" " +
        "WHERE \"PROJECT_ID\" = :projectId)")
    List<TagEntityRelation> findByProjectIdIn(@Param("projectId")String projectId);

    List<TagEntityRelation> findByTagId(Integer tagId);
}
