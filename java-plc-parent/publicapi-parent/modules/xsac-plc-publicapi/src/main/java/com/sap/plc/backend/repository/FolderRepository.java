package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.Folder;
import com.sap.plc.backend.repository.cust.folder.FolderCustomRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Integer>, JpaSpecificationExecutor<Folder>,
        FolderCustomRepository {

    @Query(value = "SELECT f.folderId FROM Folder f WHERE f.folderName like %:partialFolderName%")
    List<Integer> findByNameContaining(@Param("partialFolderName") String partialFolderName);

    @Query(value = "DELETE FROM \"" + Folder.TABLE_NAME_NO_QUOTES + "\" WHERE ENTITY_ID IN :entityIds",
            nativeQuery = true)
    @Transactional
    @Modifying
    void deleteFolders(@Param("entityIds") List<Integer> entityIds);

    @Query(value = "DELETE FROM \"" + Folder.TABLE_NAME_NO_QUOTES + "\" WHERE ENTITY_ID = :entityId",
            nativeQuery = true)
    @Modifying
    void deleteFolder(@Param("entityId") Integer entityId);
}
