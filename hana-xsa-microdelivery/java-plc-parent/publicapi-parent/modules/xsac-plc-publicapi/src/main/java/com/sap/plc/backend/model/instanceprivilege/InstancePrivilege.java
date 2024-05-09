package com.sap.plc.backend.model.instanceprivilege;

import java.util.ArrayList;
import java.util.List;

public enum InstancePrivilege {

    READ("READ"),
    CREATE_EDIT("CREATE_EDIT"),
    FULL_EDIT("FULL_EDIT"),
    ADMINISTRATE("ADMINISTRATE");

    private static final List<InstancePrivilege> PRIVILEGES = new ArrayList<>();
    private static final List<String> PRIVILEGES_AS_STRING = new ArrayList<>();

    static {
        for (InstancePrivilege instancePrivilege : InstancePrivilege.values()) {
            PRIVILEGES.add(instancePrivilege);
            PRIVILEGES_AS_STRING.add(instancePrivilege.getPrivilege());
        }
    }

    private String privilege;

    InstancePrivilege(String privilege) {
        this.privilege = privilege;
    }

    /**
     * Get privilege as string
     *
     * @return privilege as string
     */
    public String getPrivilege() {
        return privilege;
    }

    /**
     * Returns the privilege list in ascending access level order, from the lowest access level to the highest
     *
     * @return privilege list
     */
    public static List<InstancePrivilege> getPrivilegeList() {
        return PRIVILEGES;
    }

    /**
     * Returns the privilege list in ascending access level order, from the lowest access level to the highest
     *
     * @return privilege list as string
     */
    public static List<String> getPrivilegeListAsString() {
        return PRIVILEGES_AS_STRING;
    }
}
