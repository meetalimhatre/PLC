package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.ActivityTypeGeneratedDto;
import com.sap.plc.backend.dto.ActivityTypePrimaryKeyGeneratedDto;
import com.sap.plc.backend.dto.TextsGeneratedDto;
import com.sap.plc.backend.model.masterdata.ActivityType;
import com.sap.plc.backend.model.masterdata.ActivityTypeText;
import com.sap.plc.backend.model.pks.ActivityTypePrimaryKey;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class ActivityTypeMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityTypeGeneratedDtoMapper extends MasterdataMapper<ActivityType, ActivityTypeGeneratedDto>{
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityTypePrimaryKeyGeneratedDtoMapper extends PrimaryKeyMapper<ActivityTypePrimaryKey,
            ActivityTypePrimaryKeyGeneratedDto>{
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ActivityTypeTextGeneratedDtoMapper extends EntityMapper<ActivityTypeText, TextsGeneratedDto>{
    }
}
