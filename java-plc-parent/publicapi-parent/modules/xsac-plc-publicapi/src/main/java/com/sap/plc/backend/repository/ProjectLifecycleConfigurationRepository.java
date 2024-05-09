package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.ProjectLifecycleConfiguration;
import com.sap.plc.backend.model.pks.ProjectLifecycleConfigurationPrimaryKey;
import com.sap.plc.backend.repository.cust.lifecycleconfig.ProjectLifecycleConfigurationCustomRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectLifecycleConfigurationRepository extends EntityRepository<ProjectLifecycleConfiguration,
        ProjectLifecycleConfigurationPrimaryKey>,
        ProjectLifecycleConfigurationCustomRepository,
        JpaSpecificationExecutor<ProjectLifecycleConfiguration> {

}
