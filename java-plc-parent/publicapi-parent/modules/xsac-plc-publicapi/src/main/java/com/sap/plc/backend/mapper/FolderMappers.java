package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.FolderGeneratedDto;
import com.sap.plc.backend.model.Folder;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class FolderMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface FolderGeneratedDtoMapper extends EntityMapper<Folder, FolderGeneratedDto> {
    }
}
