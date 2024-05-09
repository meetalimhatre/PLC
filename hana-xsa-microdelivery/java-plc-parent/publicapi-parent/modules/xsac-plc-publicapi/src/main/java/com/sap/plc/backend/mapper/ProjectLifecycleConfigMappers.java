package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.LifecycleConfigurationCreateUpdateGeneratedDto;
import com.sap.plc.backend.dto.LifecycleConfigurationGeneratedDto;
import com.sap.plc.backend.dto.LifecycleConfigurationKeyGeneratedDto;
import com.sap.plc.backend.model.ProjectLifecycleConfiguration;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class ProjectLifecycleConfigMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ProjectLifecycleConfigDtoMapper extends EntityMapper<ProjectLifecycleConfiguration,
            LifecycleConfigurationGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ProjectLifecycleConfigCreateUpdateDtoMapper extends EntityMapper<ProjectLifecycleConfiguration,
            LifecycleConfigurationCreateUpdateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ProjectLifecycleConfigPrimaryKeyDtoMapper extends EntityMapper<ProjectLifecycleConfiguration,
            LifecycleConfigurationKeyGeneratedDto> {
    }

}
