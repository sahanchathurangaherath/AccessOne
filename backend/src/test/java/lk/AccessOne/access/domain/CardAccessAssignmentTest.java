package lk.AccessOne.access.domain;

import lk.AccessOne.identity.domain.Role;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class CardAccessAssignmentTest {

    private User itAdmin() {
        Department dept = new Department("IT", "Information Technology", null);
        Employee employee = new Employee("EMP200", "Kasun", "Jayasinghe", "922345678V",
                "kjayasinghe@accessone.lk", null, "IT Administrator", dept, LocalDate.now());
        Role role = new Role("IT_ADMIN", "Configures departments, areas and access levels");
        return new User("kjayasinghe", "hash", employee, role);
    }

    @Test
    void supersedingSetsBothFlagsTogether() {
        AccessLevel level = new AccessLevel("L3", "Manager", null);
        CardAccessAssignment assignment =
            new CardAccessAssignment(1L, level, itAdmin(), LocalDate.now(), null);

        assignment.supersede();

        // chk_caa_current (is_current = 0 OR revoked_at IS NULL) would
        // reject the row if only one of these were set.
        assertThat(assignment.isCurrent()).isFalse();
        assertThat(assignment.getRevokedAt()).isNotNull();
    }

    @Test
    void aFreshAssignmentIsCurrentWithNoRevocationTimestamp() {
        AccessLevel level = new AccessLevel("L3", "Manager", null);
        CardAccessAssignment assignment =
            new CardAccessAssignment(1L, level, itAdmin(), LocalDate.now(), "Initial grant");

        assertThat(assignment.isCurrent()).isTrue();
        assertThat(assignment.getRevokedAt()).isNull();
        assertThat(assignment.getRemarks()).isEqualTo("Initial grant");
    }
}
