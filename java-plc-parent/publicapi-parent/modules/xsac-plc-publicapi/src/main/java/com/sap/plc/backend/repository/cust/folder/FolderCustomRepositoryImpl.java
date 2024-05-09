package com.sap.plc.backend.repository.cust.folder;

import com.sap.plc.backend.filter.specification.builder.GenericSpecificationsBuilder;
import com.sap.plc.backend.model.Folder;
import com.sap.plc.backend.repository.cust.GenericRepository;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

import jakarta.persistence.Query;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class FolderCustomRepositoryImpl extends GenericRepository<Folder> implements FolderCustomRepository {

    private static final String SELECT_FOLDERS = "SELECT f.folderName FROM Folder f WHERE ";

    @Override
    public Class<Folder> getEntityClass() {
        return Folder.class;
    }

    @Override
    public GenericSpecificationsBuilder<Folder> getSpecBuilder() {
        return new GenericSpecificationsBuilder<>();
    }

    @Override
    public List<String> findByParentIdAndFolderNameInIgnoreCase(Integer parentEntityId, List<String> folderNames) {

        if (CollectionUtils.isEmpty(folderNames)) {
            return Collections.emptyList();
        }

        folderNames = folderNames.stream().map(String::toUpperCase).collect(Collectors.toList());

        StringBuilder query = new StringBuilder(SELECT_FOLDERS);

        if (parentEntityId == null || parentEntityId == 0) {
            query.append(" f.parentId IS NULL ");
        } else {
            query.append(" f.parentId = :parentEntityId ");
        }

        query.append(" AND UPPER(f.folderName) IN :folderNames ");

        Query emQuery = em.createQuery(query.toString());
        emQuery.setParameter("folderNames", folderNames);

        if (parentEntityId != null && parentEntityId != 0) {
            emQuery.setParameter("parentEntityId", parentEntityId);
        }
        return emQuery.getResultList();
    }

}