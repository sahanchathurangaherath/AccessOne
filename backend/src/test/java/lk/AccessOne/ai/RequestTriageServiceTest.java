package lk.AccessOne.ai;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.ai.gatekeeper.service.LeastPrivilegeRecommendationService;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RequestTriageServiceTest {

    @Mock
    private AccessLevelRepository accessLevelRepository;

    private LeastPrivilegeRecommendationService leastPrivilegeService;

    private AccessLevel generalLevel;
    private AccessLevel hrLevel;
    private AccessLevel itLevel;
    private AccessLevel execLevel;

    @BeforeEach
    void setUp() {
        leastPrivilegeService = new LeastPrivilegeRecommendationService(accessLevelRepository);

        generalLevel = new AccessLevel("AL-GEN", "General Staff", "General staff access");
        ReflectionTestUtils.setField(generalLevel, "id", 1L);

        hrLevel = new AccessLevel("AL-HR", "HR Staff", "HR department access");
        ReflectionTestUtils.setField(hrLevel, "id", 3L);

        itLevel = new AccessLevel("AL-IT", "IT Infrastructure", "Server and data centre access");
        ReflectionTestUtils.setField(itLevel, "id", 4L);

        execLevel = new AccessLevel("AL-EXEC", "Executive", "Executive floor access");
        ReflectionTestUtils.setField(execLevel, "id", 5L);

        when(accessLevelRepository.findAll()).thenReturn(List.of(generalLevel, hrLevel, itLevel, execLevel));
    }

    @Test
    @DisplayName("HR Specialist is recommended AL-HR without privilege penalty")
    void testHrEmployeeRecommendation() {
        Department hrDept = new Department("HR", "Human Resources", "HR Dept");
        Employee employee = new Employee(
            "EMP0002", "Nadeesha", "Perera", "198523456789V",
            "nadeesha.perera@accessone.lk", "+94112345002", "HR Operations Specialist",
            hrDept, LocalDate.of(2020, 1, 1)
        );

        LeastPrivilegeRecommendationService.Recommendation rec =
            leastPrivilegeService.evaluate(employee, null);

        assertThat(rec.accessLevelCode()).isEqualTo("AL-HR");
        assertThat(rec.privilegeRiskScorePenalty()).isZero();
        assertThat(rec.isEscalation()).isFalse();
    }

    @Test
    @DisplayName("HR Specialist requesting IT Data Centre access triggers Privilege Escalation penalty")
    void testHrRequestingItLevelTriggersEscalation() {
        Department hrDept = new Department("HR", "Human Resources", "HR Dept");
        Employee employee = new Employee(
            "EMP0002", "Nadeesha", "Perera", "198523456789V",
            "nadeesha.perera@accessone.lk", "+94112345002", "HR Assistant",
            hrDept, LocalDate.of(2020, 1, 1)
        );

        // HR requesting AL-IT (Tier 3 > Tier 2)
        LeastPrivilegeRecommendationService.Recommendation rec =
            leastPrivilegeService.evaluate(employee, itLevel);

        assertThat(rec.accessLevelCode()).isEqualTo("AL-HR");
        assertThat(rec.isEscalation()).isTrue();
        assertThat(rec.privilegeRiskScorePenalty()).isGreaterThanOrEqualTo(40);
        assertThat(rec.reasoning()).contains("Privilege Escalation Warning");
    }

    @Test
    @DisplayName("IT Engineer is recommended AL-IT based on engineering role baseline")
    void testItEngineerRecommendation() {
        Department itDept = new Department("IT", "Information Technology", "IT Dept");
        Employee employee = new Employee(
            "EMP0009", "Ishara", "Weerasinghe", "199490123456V",
            "ishara.w@accessone.lk", "+94112345009", "DevOps Engineer",
            itDept, LocalDate.of(2021, 3, 15)
        );

        LeastPrivilegeRecommendationService.Recommendation rec =
            leastPrivilegeService.evaluate(employee, null);

        assertThat(rec.accessLevelCode()).isEqualTo("AL-IT");
        assertThat(rec.privilegeRiskScorePenalty()).isZero();
    }
}
