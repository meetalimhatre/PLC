package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.controller.utils.ResponseUtils;
import com.sap.plc.backend.dto.TagGeneratedDto;
import com.sap.plc.backend.dto.TagRequestGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.service.TagService;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
import java.util.List;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = TagController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class TagController implements TagGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.TAGS;

    @Resource
    private TagService tagService;

    @Override
    @GetMapping
    public ResponseEntity getTags(
            @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false, defaultValue = "100") Integer top,
            @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0") Integer skip,
            @Valid @RequestParam(value = "filter", required = false) String filter) {

        PlcResponse<TagGeneratedDto, Integer> response = new PlcResponse<>();
        response.setEntities(tagService.getTags(filter, top, skip));

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Override
    @RequestMapping(value = "/calculations/{calculationId}/calculationVersionTags", method = RequestMethod.GET)
    public ResponseEntity getTagsForCalculationParent(
            @Valid @NotNull @Min(0) @PathVariable("calculationId") Integer calculationId) {
        return new ResponseEntity<>(tagService.getTagsForCalculationVersions(calculationId), HttpStatus.OK);
    }

    @Override
    @RequestMapping(value = "/projects/{projectId}/calculationTags", method = RequestMethod.GET)
    public ResponseEntity getTagsForProjectParent(@Valid @NotNull String projectId) {
        return new ResponseEntity<>(
                tagService.getTagsForCalculations(projectId),
                HttpStatus.OK);
    }

    @Override
    @RequestMapping(value = "/calculationTags", method = RequestMethod.DELETE)
    public ResponseEntity removeAssociationBetweenTagAndCalculation(
            @NotEmpty @RequestBody List<TagRequestGeneratedDto> body) {
        return ResponseUtils.createDeleteResult(tagService.removeTagFromCalculation(body),
                PATH, HttpStatus.NO_CONTENT);
    }

    @Override
    @RequestMapping(value = "/calculationVersionTags", method = RequestMethod.DELETE)
    public ResponseEntity removeAssociationBetweenTagAndCalculationVersion(
            @NotEmpty @RequestBody List<TagRequestGeneratedDto> body) {
        return ResponseUtils.createDeleteResult(tagService.removeTagFromCalculationVersion(body),
                PATH, HttpStatus.NO_CONTENT);
    }

    @Override
    @RequestMapping(value = "/calculationTags", method = RequestMethod.POST)
    public ResponseEntity assignTagToCalculation(@NotEmpty @RequestBody List<TagRequestGeneratedDto> body) {
        return ResponseUtils
                .createResult(tagService.createAndAssignTagsToCalculations(body), HttpStatus.CREATED, PATH +
                        "/calculationTags");
    }

    @Override
    @RequestMapping(value = "/calculationVersionTags", method = RequestMethod.POST)
    public ResponseEntity assignTagToCalculationVersion(@NotEmpty @RequestBody List<TagRequestGeneratedDto> body) {
        return ResponseUtils
                .createResult(tagService.createAndAssignTagsToCalculationVersions(body), HttpStatus.CREATED,
                        PATH + "/calculationVersionTags");
    }
}

