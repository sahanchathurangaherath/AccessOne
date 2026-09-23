package lk.AccessOne.notification.service;

import java.util.Map;

public interface EmailService {

    /**
     * Sends an asynchronous HTML email rendered from a Thymeleaf template.
     *
     * @param to recipient email address
     * @param subject email subject line
     * @param templateName relative template name in templates/email/ (without .html)
     * @param variables map of Thymeleaf model attributes
     */
    void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables);

    /**
     * Sends an asynchronous HTML email with a binary file attachment (e.g., PDF).
     *
     * @param to recipient email address
     * @param subject email subject line
     * @param templateName relative template name in templates/email/ (without .html)
     * @param variables map of Thymeleaf model attributes
     * @param attachmentFilename file name presented to recipient (e.g., "VisitorPass.pdf")
     * @param attachmentData byte array data of the attachment
     * @param mimeType MIME type of attachment (e.g., "application/pdf")
     */
    void sendHtmlEmailWithAttachment(String to, String subject, String templateName,
                                     Map<String, Object> variables, String attachmentFilename,
                                     byte[] attachmentData, String mimeType);
}
