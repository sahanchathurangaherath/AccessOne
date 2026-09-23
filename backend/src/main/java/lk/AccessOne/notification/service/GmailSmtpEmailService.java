package lk.AccessOne.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class GmailSmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailSmtpEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final TemplateEngine templateEngine;
    private final String defaultFrom;
    private final String frontendBaseUrl;
    private final boolean mailEnabled;

    public GmailSmtpEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            TemplateEngine templateEngine,
            @Value("${accessone.mail.from:AccessOne <no-reply@accessone.local>}") String defaultFrom,
            @Value("${accessone.mail.frontend-base-url:http://localhost:3000}") String frontendBaseUrl,
            @Value("${accessone.mail.enabled:true}") boolean mailEnabled) {
        this.mailSenderProvider = mailSenderProvider;
        this.templateEngine = templateEngine;
        this.defaultFrom = defaultFrom;
        this.frontendBaseUrl = frontendBaseUrl;
        this.mailEnabled = mailEnabled;
    }

    @Async
    @Override
    public void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        sendHtmlEmailWithAttachment(to, subject, templateName, variables, null, null, null);
    }

    @Async
    @Override
    public void sendHtmlEmailWithAttachment(String to, String subject, String templateName,
                                           Map<String, Object> variables, String attachmentFilename,
                                           byte[] attachmentData, String mimeType) {
        if (!mailEnabled) {
            log.info("Email notifications disabled via accessone.mail.enabled=false. Suppressing email to: {}", to);
            return;
        }

        if (to == null || to.isBlank()) {
            log.warn("Cannot send email: recipient address is empty or null for subject '{}'", subject);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("JavaMailSender bean is not available. Skipping email delivery to {} for subject '{}'", to, subject);
            return;
        }

        try {
            Context context = new Context();
            if (variables != null) {
                variables.forEach(context::setVariable);
            }
            context.setVariable("frontendBaseUrl", frontendBaseUrl);
            context.setVariable("subject", subject);

            String templatePath = "email/" + templateName;
            String htmlContent = templateEngine.process(templatePath, context);

            MimeMessage message = mailSender.createMimeMessage();
            boolean isMultipart = (attachmentData != null && attachmentData.length > 0 && attachmentFilename != null);
            MimeMessageHelper helper = new MimeMessageHelper(message, isMultipart, StandardCharsets.UTF_8.name());

            helper.setFrom(defaultFrom);
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            if (isMultipart) {
                ByteArrayResource resource = new ByteArrayResource(attachmentData);
                if (mimeType != null && !mimeType.isBlank()) {
                    helper.addAttachment(attachmentFilename, resource, mimeType);
                } else {
                    helper.addAttachment(attachmentFilename, resource);
                }
                log.debug("Attached {} ({} bytes) to email for {}", attachmentFilename, attachmentData.length, to);
            }

            mailSender.send(message);
            log.info("Successfully dispatched email via Gmail SMTP to: {} [Subject: '{}']", to, subject);

        } catch (MessagingException e) {
            log.error("Failed to construct or send MIME email to {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during email dispatch to {}: {}", to, e.getMessage(), e);
        }
    }
}
