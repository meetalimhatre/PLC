package com.sap.plc.backend.repository;

import com.sap.plc.backend.model.instanceprivilege.AuthProject;
import com.sap.plc.backend.model.instanceprivilege.calculation.CalculationPrivilege;
import com.sap.plc.backend.model.instanceprivilege.calculationversion.CalculationVersionPrivilege;
import com.sap.plc.backend.model.instanceprivilege.project.ProjectPrivilege;
import com.sap.plc.backend.model.pks.AuthProjectPrimaryKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface AuthProjectRepository
        extends JpaRepository<AuthProject, AuthProjectPrimaryKey>, JpaSpecificationExecutor<AuthProject> {

    @Deprecated
    @Query(value =
            "SELECT new com.sap.plc.backend.model.instanceprivilege.project.ProjectPrivilege(auth.projectId, auth.privilege) " +
                    "FROM AuthProject AS auth WHERE auth.userId = :username and auth.projectId IN :projectIds")
    List<ProjectPrivilege> findAllProjectInstancePrivileges(@Param("projectIds") Set<String> projectIds,
                                                            @Param("username") String username);

    @Deprecated
    @Query(value =
            "SELECT new com.sap.plc.backend.model.instanceprivilege.calculation.CalculationPrivilege(calculation.calculationId, auth.privilege) " +
                    "FROM AuthProject AS auth INNER JOIN Calculation AS calculation ON auth.projectId = calculation.projectId " +
                    "WHERE auth.userId = :username AND calculation.calculationId IN :calculationIds")
    List<CalculationPrivilege> findAllCalculationInstancePrivileges(@Param("calculationIds") Set<Integer> calculationId,
                                                                    @Param("username") String username);

    @Query(nativeQuery = true)
    @Deprecated
    List<CalculationVersionPrivilege> findAllCalculationVersionInstancePrivileges(
            @Param("calculationVersionIds") Set<Integer> calculationVersionIds,
            @Param("username") String username);

    @Query(value = "SELECT auth.projectId FROM ProjectReadView AS auth WHERE auth.userId = :username and auth.projectId IN :projectIds")
    Set<String> findAllProjectsReadInstancePrivileges(
            @Param("projectIds") Set<String> projectIds, @Param("username") String username);

    @Query(value = "SELECT auth.projectId FROM ProjectCreateEditView AS auth WHERE auth.userId = :username and auth.projectId IN :projectIds")
    Set<String> findAllProjectsCreateEditInstancePrivileges(
            @Param("projectIds") Set<String> projectIds, @Param("username") String username);

    @Query(value = "SELECT auth.projectId FROM ProjectFullEditView AS auth WHERE auth.userId = :username and auth.projectId IN :projectIds")
    Set<String> findAllProjectsFullEditInstancePrivileges(
            @Param("projectIds") Set<String> projectIds, @Param("username") String username);

    @Query(value = "SELECT auth.projectId FROM ProjectAdministrateView AS auth WHERE auth.userId = :username and auth.projectId IN :projectIds")
    Set<String> findAllProjectsAdministrateInstancePrivileges(
            @Param("projectIds") Set<String> projectIds, @Param("username") String username);

    @Query(value = "SELECT auth.calculationId FROM CalculationReadView AS auth WHERE auth.userId = :username and auth.calculationId IN :calculationIds")
    Set<Integer> findAllCalculationReadInstancePrivileges(
            @Param("calculationIds") Set<Integer> calculationIds,
            @Param("username") String username);

    @Query(value = "SELECT auth.calculationId FROM CalculationCreateEditView AS auth WHERE auth.userId = :username and auth.calculationId IN :calculationIds")
    Set<Integer> findAllCalculationCreateEditInstancePrivileges(
            @Param("calculationIds") Set<Integer> calculationIds,
            @Param("username") String username);

    @Query(value = "SELECT auth.calculationId FROM CalculationFullEditView AS auth WHERE auth.userId = :username and auth.calculationId IN :calculationIds")
    Set<Integer> findAllCalculationFullEditInstancePrivileges(
            @Param("calculationIds") Set<Integer> calculationIds,
            @Param("username") String username);

    @Query(value = "SELECT auth.calculationId FROM CalculationAdministrateView AS auth WHERE auth.userId = :username and auth.calculationId IN :calculationIds")
    Set<Integer> findAllCalculationAdministrateInstancePrivileges(
            @Param("calculationIds") Set<Integer> calculationIds,
            @Param("username") String username);

    @Query(value = "SELECT auth.calculationVersionId FROM CalculationVersionReadView AS auth WHERE auth.userId = :username and auth.calculationVersionId IN :calculationVersionIds")
    Set<Integer> findAllCalculationVersionReadInstancePrivileges(
            @Param("calculationVersionIds") Set<Integer> calculationVersionIds,
            @Param("username") String username);

    @Query(value = "SELECT auth.calculationVersionId FROM CalculationVersionCreateEditView AS auth WHERE auth.userId = :username and auth.calculationVersionId IN :calculationVersionIds")
    Set<Integer> findAllCalculationVersionCreateEditInstancePrivileges(
            @Param("calculationVersionIds") Set<Integer> calculationVersionIds,
            @Param("username") String username);

    @Query(value =
            "SELECT auth.calculationVersionId FROM CalculationVersionFullEditView AS auth WHERE auth.userId = :username and auth.calculationVersionId IN :calculationVersionIds")
    Set<Integer> findAllCalculationVersionFullEditInstancePrivileges(
            @Param("calculationVersionIds") Set<Integer> calculationVersionIds,
            @Param("username") String username);

    @Query(value =
            "SELECT auth.calculationVersionId FROM CalculationVersionAdministrateView AS auth WHERE auth.userId = :username and auth.calculationVersionId IN :calculationVersionIds")
    Set<Integer> findAllCalculationVersionAdministrateInstancePrivileges(
            @Param("calculationVersionIds") Set<Integer> calculationVersionIds,
            @Param("username") String username);
}