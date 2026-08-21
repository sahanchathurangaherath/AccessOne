package lk.AccessOne.visitor.domain;

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
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.domain.AuditableEntity;
import lk.AccessOne.shared.enums.IdDocumentType;
import lk.AccessOne.shared.enums.VisitorType;

@Entity
@Table(name = "visitors")
public class Visitor extends AuditableEntity {

    @Column(name = "visitor_code", nullable = false, length = 20, unique = true)
    private String visitorCode;

    @NotBlank @Size(max = 120)
    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @NotBlank @Size(max = 30)
    @Column(name = "id_document_no", nullable = false, length = 30)
    private String idDocumentNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "id_document_type", nullable = false, length = 15)
    private IdDocumentType idDocumentType = IdDocumentType.NIC;

    @Size(max = 120)
    @Column(name = "company", length = 120)
    private String company;

    @Size(max = 20)
    @Column(name = "phone", length = 20)
    private String phone;

    @Email @Size(max = 120)
    @Column(name = "email", length = 120)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "visitor_type", nullable = false, length = 20)
    private VisitorType visitorType;

    /**
     * NOT NULL in the schema. A visitor without a host is exactly the
     * accountability gap this module exists to close -- somebody in the
     * building nobody is responsible for.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "host_employee_id", nullable = false)
    private Employee hostEmployee;

    @Column(name = "photo_path", length = 255)
    private String photoPath;

    /** Soft delete: visit history is a security record and must survive. */
    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    protected Visitor() { }

    public Visitor(String visitorCode, String fullName, IdDocumentType docType,
                    String docNo, VisitorType type, Employee host,
                    String company, String phone, String email) {
        this.visitorCode = visitorCode;
        this.fullName = fullName;
        this.idDocumentType = docType;
        this.idDocumentNo = docNo;
        this.visitorType = type;
        this.hostEmployee = host;
        this.company = company;
        this.phone = phone;
        this.email = email;
    }

    public void update(String fullName, String company, String phone,
                        String email, Employee host) {
        this.fullName = fullName;
        this.company = company;
        this.phone = phone;
        this.email = email;
        this.hostEmployee = host;
    }

    public void attachPhoto(String path) { this.photoPath = path; }

    public void softDelete() { this.deleted = true; }
    public void restore()    { this.deleted = false; }

    public boolean isDeleted() { return deleted; }

    public String getVisitorCode()         { return visitorCode; }
    public String getFullName()            { return fullName; }
    public String getIdDocumentNo()        { return idDocumentNo; }
    public IdDocumentType getIdDocumentType() { return idDocumentType; }
    public String getCompany()             { return company; }
    public String getPhone()               { return phone; }
    public String getEmail()               { return email; }
    public VisitorType getVisitorType()    { return visitorType; }
    public Employee getHostEmployee()      { return hostEmployee; }
    public String getPhotoPath()           { return photoPath; }
}
