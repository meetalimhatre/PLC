package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.LifecycleConfigurationCreateUpdateGeneratedDto;
import com.sap.plc.backend.dto.LifecycleConfigurationKeyGeneratedDto;
import com.sap.plc.backend.mapper.ProjectLifecycleConfigMappers;
import com.sap.plc.backend.service.ProjectLifecycleConfigurationService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createDeleteResult;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = ProjectLifecycleConfigurationController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class ProjectLifecycleConfigurationController implements LifecycleConfigurationGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.LIFECYCLE_CONFIGURATIONS;
    private static final String FILTER_PK = "projectId,calculationId";

    @Resource
    private ProjectLifecycleConfigurationService lifecycleConfigurationService;

    @Resource
    private ProjectLifecycleConfigMappers.ProjectLifecycleConfigDtoMapper mapper;

    @Override
    @DeleteMapping
    public ResponseEntity deleteAll(@NotEmpty @RequestBody List<LifecycleConfigurationKeyGeneratedDto> body) {
        return createDeleteResult(
                lifecycleConfigurationService.delete(body),
                PATH,
                HttpStatus.OK);
    }

    @Override
    @RequestMapping(value = "/{projectId}", method = RequestMethod.GET)
    public ResponseEntity get(
            @Valid @NotNull @Size(max = 35) @Pattern(
                    regexp = "^[\\p{L}\\d_:#./\\-\\|+`)(](?:[\\p{L}\\d_:#./\\-\\| +`)(]*[\\p{L}\\d_:#./\\-\\|+`)(])?$")
            @PathVariable("projectId") String projectId,
            @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false, defaultValue
                    = "1000") Integer top,
            @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0") Integer skip,
            @Valid @RequestParam(value = "filter", required = false) String filter,
            @Valid @RequestParam(value = "fields", required = false) String fields) {
        return new ResponseEntity<>(lifecycleConfigurationService.getAllLifecycleConfigurations(top, skip, filter,
                fields,
                projectId), HttpStatus.OK);
    }

    @Override
    @RequestMapping(value = "/{projectId}/{calculationId}", method = RequestMethod.GET)
    public ResponseEntity getById(@Valid @NotNull @Size(max = 35) @Pattern(
            regexp = "^[\\p{Lu}\\d_:#./\\-\\|+)(`](?:[\\p{Lu}\\d_:#./\\-\\| +`)(]*[\\p{Lu}\\d_:#./\\-\\|+`)(])?$")
                                  @PathVariable("projectId") String projectId,
                                  @Valid @NotNull @Min(0) @PathVariable("calculationId") Integer calculationId) {
        return new ResponseEntity<>(
                lifecycleConfigurationService.getProjectLifecycleConfigById(projectId, calculationId),
                HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity patch(@NotEmpty @RequestBody List<LifecycleConfigurationCreateUpdateGeneratedDto> body,
                                @Valid @Pattern(regexp = "^(ids|full)$")
                                @RequestParam(value = "returnType", required = false) String returnType) {
        return createResult(lifecycleConfigurationService.patch(body),
                mapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }

    @Override
    @PostMapping
    public ResponseEntity post(@NotEmpty @RequestBody List<LifecycleConfigurationCreateUpdateGeneratedDto> body,
                               @Valid @Pattern(regexp = "^(ids|full)$")
                               @RequestParam(value = "returnType", required = false) String returnType) {
        return createResult(lifecycleConfigurationService.create(body),
                mapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.CREATED,
                FILTER_PK);
    }

    @Override
    @PutMapping
    public ResponseEntity put(@NotEmpty @RequestBody List<LifecycleConfigurationCreateUpdateGeneratedDto> body,
                              @Valid @Pattern(regexp = "^(ids|full)$")
                              @RequestParam(value = "returnType", required = false) String returnType) {

        return createResult(lifecycleConfigurationService.update(body),
                mapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }
}
