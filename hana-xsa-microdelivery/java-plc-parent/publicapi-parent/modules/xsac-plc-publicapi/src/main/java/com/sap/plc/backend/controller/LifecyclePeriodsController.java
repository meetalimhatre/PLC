package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.LifecyclePeriodGeneratedDto;
import com.sap.plc.backend.mapper.LifecyclePeriodsMappers;
import com.sap.plc.backend.service.LifecyclePeriodsService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = LifecyclePeriodsController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class LifecyclePeriodsController implements LifecyclePeriodsGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.LIFECYCLE_PERIODS;
    private static final String FILTER_PK = "projectId,year";

    private final LifecyclePeriodsService lifecyclePeriodsService;

    private final LifecyclePeriodsMappers.LifecyclePeriodsWithAuditGeneratedDtoMapper dtoMapper;

    public LifecyclePeriodsController(LifecyclePeriodsService lifecyclePeriodsService,
                                      LifecyclePeriodsMappers.LifecyclePeriodsWithAuditGeneratedDtoMapper dtoMapper) {
        this.lifecyclePeriodsService = lifecyclePeriodsService;
        this.dtoMapper = dtoMapper;
    }

    @Override
    @GetMapping(value = "/{projectId}")
    public ResponseEntity get(@Valid @NotNull @Size(max = 35) @Pattern(
            regexp = "^[\\p{L}\\d_:#./\\-\\|+`)(](?:[\\p{L}\\d_:#./\\-\\| +`)(]*[\\p{L}\\d_:#./\\-\\|+`)(])?$")
                              @PathVariable("projectId") String projectId, @Valid @Min(1) @Max(10000)
                              @RequestParam(value = "top", required = false, defaultValue = "1000") Integer top,
                              @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0")
                                      Integer skip,
                              @Valid @RequestParam(value = "filter", required = false) String filter,
                              @Valid @RequestParam(value = "fields", required = false) String fields) {
        return new ResponseEntity(lifecyclePeriodsService.getAllLifecyclePeriods(top, skip, filter, fields,
                projectId), HttpStatus.OK);
    }

    @Override
    @PatchMapping
    public ResponseEntity patch(@NotEmpty List<LifecyclePeriodGeneratedDto> body,
                                @Valid @Pattern(regexp = "^(ids|full)$")
                                @RequestParam(value = "returnType", required = false) String returnType) {
        return createResult(lifecyclePeriodsService.patch(body),
                dtoMapper, PATH, FULL.getReturnType().equalsIgnoreCase(returnType),
                HttpStatus.OK,
                FILTER_PK);
    }
}
