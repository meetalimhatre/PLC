package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.ProjectGeneratedDto;
import com.sap.plc.backend.model.instanceprivilege.project.ProjectReadView;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class ProjectMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ProjectReadViewGeneratedDtoMapper extends EntityMapper<ProjectReadView, ProjectGeneratedDto> {
    }
}
