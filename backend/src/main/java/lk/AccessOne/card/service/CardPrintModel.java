package lk.AccessOne.card.service;

/** What the Thymeleaf template actually needs -- not the full CardDetail. */
public record CardPrintModel(
        String printedName, String printedDesignation, String printedDepartment,
        String empId, String cardSerial) { }
