package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.TagGeneratedDto;
import com.sap.plc.backend.dto.TagRelationGeneratedDto;
import com.sap.plc.backend.dto.TagRequestGeneratedDto;
import com.sap.plc.backend.model.Tag;
import com.sap.plc.backend.model.TagEntityRelation;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class TagMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface TagGeneratedDtoMapper extends EntityMapper<Tag, TagGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface TagRelationMapper extends EntityMapper<TagEntityRelation, TagRelationGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface TagRelationRequestMapper extends EntityMapper<TagEntityRelation, TagRequestGeneratedDto> {
    }
}
