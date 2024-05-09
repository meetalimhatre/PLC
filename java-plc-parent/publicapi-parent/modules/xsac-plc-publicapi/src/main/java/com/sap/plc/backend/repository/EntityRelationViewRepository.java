package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.EntityRelationView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntityRelationViewRepository extends JpaRepository<EntityRelationView, Integer> {

    EntityRelationView findByResultNode(Integer resultNode);

    List<EntityRelationView> findByResultNodeIn(List<Integer> resultNode);

    List<EntityRelationView> findByEntityTypeAndPathStartsWith(String entityType, String path);
}
