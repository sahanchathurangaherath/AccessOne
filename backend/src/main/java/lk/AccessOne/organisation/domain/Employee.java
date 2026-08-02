package lk.AccessOne.organisation.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.EmploymentStatus;

import java.time.LocalDate;

@Entity
@Table(name = "employees")
public class Employee extends AuditableEntity {

    @NotBlank @Size(max = 20)
    @Column(name = "emp_id", nullable = false, length = 20, unique = true)
    private String empId;

    @NotBlank @Size(max = 60)
    @Column(name = "first_name", nullable = false, length = 60)
    private String firstName;

    @NotBlank @Size(max = 60)
    @Column(name = "last_name", nullable = false, length = 60)
    private String lastName;

    @NotBlank @Size(max = 20)
    @Column(name = "nic", nullable = false, length = 20, unique = true)
    private String nic;

    @Email @NotBlank @Size(max = 120)
    @Column(name = "email", nullable = false, length = 120, unique = true)
    private String email;

    @Size(max = 20)
    @Column(name = "phone", length = 20)
    private String phone;

    @NotBlank @Size(max = 100)
    @Column(name = "designation", nullable = false, length = 100)
    private String designation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "date_joined", nullable = false)
    private LocalDate dateJoined;

    @Column(name = "date_left")
    private LocalDate dateLeft;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false, length = 20)
    private EmploymentStatus employmentStatus = EmploymentStatus.ACTIVE;

    @Size(max = 255)
    @Column(name = "photo_path", length = 255)
    private String photoPath;

    protected Employee() { }

    public Employee(String empId, String firstName, String lastName, String nic,
                     String email, String phone, String designation,
                     Department department, LocalDate dateJoined) {
        this.empId = empId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.nic = nic;
        this.email = email;
        this.phone = phone;
        this.designation = designation;
        this.department = department;
        this.dateJoined = dateJoined;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    /** A card is only usable while its holder is actively employed. */
    public boolean isActivelyEmployed() {
        return employmentStatus == EmploymentStatus.ACTIVE;
    }

    public void recordExit(EmploymentStatus reason, LocalDate exitDate) {
        this.employmentStatus = reason;
        this.dateLeft = exitDate;
    }

    public String getEmpId() { return empId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getNic() { return nic; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getDesignation() { return designation; }
    public Department getDepartment() { return department; }
    public LocalDate getDateJoined() { return dateJoined; }
    public LocalDate getDateLeft() { return dateLeft; }
    public EmploymentStatus getEmploymentStatus() { return employmentStatus; }
    public String getPhotoPath() { return photoPath; }

    public void updatePhoto(String photoPath) {
        this.photoPath = photoPath;
    }
}
