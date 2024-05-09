package com.sap.plc.backend.repository.cust.folder;

import com.sap.plc.backend.model.Folder;
import com.sap.plc.backend.repository.cust.CustomRepository;

import java.util.List;

public interface FolderCustomRepository extends CustomRepository<Folder> {

    List<String> findByParentIdAndFolderNameInIgnoreCase(Integer parentEntityId, List<String> entityNames);
}
