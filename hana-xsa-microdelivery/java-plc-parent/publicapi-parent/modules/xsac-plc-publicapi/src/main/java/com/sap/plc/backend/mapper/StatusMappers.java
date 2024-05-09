package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.StatusCreateGeneratedDto;
import com.sap.plc.backend.dto.StatusGeneratedDto;
import com.sap.plc.backend.dto.StatusKeyAndTimestampGeneratedDto;
import com.sap.plc.backend.dto.StatusUpdateGeneratedDto;
import com.sap.plc.backend.dto.TextsGeneratedDto;
import com.sap.plc.backend.model.Status;
import com.sap.plc.backend.model.StatusText;
import com.sap.plc.backend.model.pks.StatusPKAndTimestamp;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class StatusMappers {
    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface StatusGeneratedDtoMapper extends EntityMapper<Status,
            StatusGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface StatusTextGeneratedDtoMapper extends EntityMapper<StatusText,
            TextsGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface StatusCreateGeneratedDtoMapper extends EntityMapper<Status,
            StatusCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface StatusUpdateGeneratedDtoMapper extends EntityMapper<Status,
            StatusUpdateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface StatusKeyAndTimestampGeneratedDtoMapper extends EntityMapper<StatusPKAndTimestamp,
            StatusKeyAndTimestampGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface StatusKeyAndTimestampToStatusMapper extends EntityMapper<Status,
            StatusKeyAndTimestampGeneratedDto> {
    }
}
