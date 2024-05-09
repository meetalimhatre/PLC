package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.PriceSourceCreateGeneratedDto;
import com.sap.plc.backend.dto.PriceSourceGeneratedDto;
import com.sap.plc.backend.dto.PriceSourceKeyAndTimestampGeneratedDto;
import com.sap.plc.backend.dto.PriceSourceUpdateGeneratedDto;
import com.sap.plc.backend.dto.PriceSourceUpsertGeneratedDto;
import com.sap.plc.backend.dto.TextsGeneratedDto;
import com.sap.plc.backend.model.PriceSource;
import com.sap.plc.backend.model.PriceSourceText;
import com.sap.plc.backend.model.pks.PriceSourcePKAndTimestamp;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class PriceSourceMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceSourceGeneratedDtoMapper extends EntityMapper<PriceSource,
            PriceSourceGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceSourceTextGeneratedDtoMapper extends EntityMapper<PriceSourceText,
            TextsGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceSourceCreateGeneratedDtoMapper extends EntityMapper<PriceSource,
            PriceSourceCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceSourceUpdateGeneratedDtoMapper extends EntityMapper<PriceSource,
            PriceSourceUpdateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceSourceUpsertGeneratedDtoMapper extends EntityMapper<PriceSource,
            PriceSourceUpsertGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceSourceKeyAndTimestampGeneratedDtoMapper extends EntityMapper<PriceSourcePKAndTimestamp,
            PriceSourceKeyAndTimestampGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PriceSourceKeyAndTimestampToPriceSourceMapper extends EntityMapper<PriceSource,
            PriceSourceKeyAndTimestampGeneratedDto> {
    }

}
