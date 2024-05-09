package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.ControllingAreaSearchGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.mapper.ControllingAreaMappers;
import com.sap.plc.backend.model.masterdata.ControllingArea;
import com.sap.plc.backend.service.masterdata.ControllingAreaServiceImpl;
import com.sap.plc.backend.util.OffsetPageable;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

import static com.sap.plc.backend.controller.ControllingAreaController.PATH;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = PATH, produces = MediaType.APPLICATION_JSON_VALUE)
public class ControllingAreaController implements ControllingAreaGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.CONTROLLING_AREAS;

    @Resource
    private ControllingAreaServiceImpl controllingAreaService;

    @Resource
    private ControllingAreaMappers.ControllingAreaGeneratedDtoMapper controllingAreaMapper;

    @Override
    @PostMapping(PublicAPI.SEARCH)
    public ResponseEntity search(
            @NotEmpty @Size(min = 1, max = 10000) @RequestBody List<ControllingAreaSearchGeneratedDto> searchBody,
            @Valid @RequestParam(value = "language", defaultValue = "EN", required = false) String language,
            @Valid @Min(1) @Max(10000)
            @RequestParam(value = "top", defaultValue = "" + OffsetPageable.DEFAULT_PAGE_SIZE, required = false)
                    Integer top,
            @Valid @Min(0)
            @RequestParam(value = "skip", defaultValue = "" + OffsetPageable.DEFAULT_OFFSET, required = false)
                    Integer skip) {

        Pageable pageable = new OffsetPageable(skip, top, Sort.by("controllingAreaId").ascending());
        Page<ControllingArea> result =
                controllingAreaService.searchUsingJpaQueryMethods(searchBody, language, pageable, true);

        return new ResponseEntity<PlcResponse>(
                PlcResponse.buildResponseWithEntities(controllingAreaMapper.entityToDto(result.getContent())),
                HttpStatus.OK);
    }

}
