package com.sap.plc.backend.repository.cust.entityrelation;

import com.sap.plc.backend.exception.BadRequestException;
import com.sap.plc.backend.model.EntityRelation;
import com.sap.plc.backend.model.EntityRelationView;
import com.sap.plc.backend.model.EntityType;
import com.sap.plc.backend.model.Folder;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static com.sap.plc.backend.error.ErrorCode.GENERAL_VALIDATION_ERROR;

@Repository
public class EntityRelationCustomRepositoryImpl implements EntityRelationCustomRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(EntityRelationCustomRepositoryImpl.class);

    @PersistenceContext
    protected EntityManager em;

    @Override
    public String checkForAlreadyExistingEntity(Integer parentEntityId, String entityName, EntityType entityType) {

        if (entityType == null || StringUtils.isBlank(entityName)) {
            LOGGER.error("Folder name is blank. Application Code: {}",
                    GENERAL_VALIDATION_ERROR.getCode());
            throw new BadRequestException();
        }

        StringBuilder query = new StringBuilder();

        String entityNameRegexpr = entityName.toUpperCase() + " \\(\\d+\\)";

        switch (entityType) {
            case FOLDER:
                query.append("SELECT f.FOLDER_NAME FROM \"")
                     .append(EntityRelation.TABLE_NAME_NO_QUOTES)
                     .append("\" et JOIN \"")
                     .append(Folder.TABLE_NAME_NO_QUOTES)
                     .append("\" f ON f.ENTITY_ID = et.ENTITY_ID ")
                     .append(" WHERE (UPPER(f.FOLDER_NAME) LIKE_REGEXPR :entityNameRegexpr")
                     .append(" OR UPPER(f.FOLDER_NAME) = :entityName)");
                break;

            default:
                throw new UnsupportedOperationException("Invalid entity type: " + entityType);
        }

        query.append(" AND et.ENTITY_TYPE = :entityType");

        if (parentEntityId == null || parentEntityId == 0) {
            query.append(" AND et.PARENT_ENTITY_ID IS NULL ");
        } else {
            query.append(" AND et.PARENT_ENTITY_ID = :parentEntityId");
        }

        Query emQuery = em.createNativeQuery(query.toString());
        emQuery.setParameter("entityNameRegexpr", entityNameRegexpr);
        emQuery.setParameter("entityName", entityName.toUpperCase());
        emQuery.setParameter("entityType", entityType.getType());

        if (parentEntityId != null && parentEntityId != 0) {
            emQuery.setParameter("parentEntityId", parentEntityId);
        }
        List<String> result = emQuery.getResultList();

        result.sort(new Comparator<String>() {
            public int compare(String folderName1, String folderName2) {
                return getIndex(folderName2) - getIndex(folderName1);
            }

            int getIndex(String folderName) {
                String index = folderName.replaceAll("\\D", "");
                return index.isEmpty() ? 0 : Integer.parseInt(index);
            }
        });

        return result.isEmpty() ? null : result.get(0);
    }

    @Override
    public Integer countFoldersInParent(Integer parentEntityId, EntityType entityType) {

        StringBuilder query = new StringBuilder();

        switch (entityType) {
            case FOLDER:
                query.append("SELECT COUNT(*) FROM \"")
                     .append(EntityRelation.TABLE_NAME_NO_QUOTES)
                     .append("\" et ");
                break;

            default:
                throw new UnsupportedOperationException("Invalid entity type: " + entityType);
        }

        query.append(" WHERE et.ENTITY_TYPE = :entityType");

        if (parentEntityId == null || parentEntityId == 0) {
            query.append(" AND et.PARENT_ENTITY_ID IS NULL ");
        } else {
            query.append(" AND et.PARENT_ENTITY_ID = :parentEntityId");
        }

        Query emQuery = em.createNativeQuery(query.toString());
        emQuery.setParameter("entityType", entityType.getType());

        if (parentEntityId != null && parentEntityId != 0) {
            emQuery.setParameter("parentEntityId", parentEntityId);
        }
        List<Long> result = emQuery.getResultList();

        return result.isEmpty() ? null : result.get(0).intValue();
    }

    public List<EntityRelationView> getChildren(Integer entityId) {

        String query = ("SELECT * FROM \"" + EntityRelationView.TABLE_NAME_NO_QUOTES +
                "\" WITH PARAMETERS ('expression' = 'subtree(") + entityId + ",1)')";

        Query emQuery = em.createNativeQuery(query, EntityRelationView.class);
        return (ArrayList<EntityRelationView>) emQuery.getResultList();

    }
}
