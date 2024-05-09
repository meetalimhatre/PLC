package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.Tag;
import com.sap.plc.backend.model.pks.TagPrimaryKey;
import com.sap.plc.backend.repository.cust.tag.TagCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TagRepository extends EntityRepository<Tag, TagPrimaryKey>, TagCustomRepository, JpaSpecificationExecutor<Tag> {

    List<Tag> findAllByTagIdIn(List<Integer> tagId);
    Tag findByTagName(String tagName);
}
