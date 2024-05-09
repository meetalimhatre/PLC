package com.sap.plc.backend.repository.cust.entityrelation;

import com.sap.plc.backend.model.EntityRelationView;
import com.sap.plc.backend.model.EntityType;

import java.util.List;

public interface EntityRelationCustomRepository {

    String checkForAlreadyExistingEntity(Integer parentId, String entityName, EntityType entityType);

    Integer countFoldersInParent(Integer parentEntityId, EntityType entityType);

    List<EntityRelationView> getChildren(Integer entityId);
}
