import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from "./email-templates/email-templates.service";
import { EmailTemplateDto } from "./email-templates/dto/email-templates.dto";
import { ApplicationStatus } from "src/entities/application.entity";

@Injectable()
export class EmailerService{

    private transporter: nodemailer.Transporter | null = null;

    constructor(private readonly emailTemplateService: EmailTemplateService){}
    
    async sendEmailAsync(
        applicationStatus: ApplicationStatus,
        applicantName: string,
        companyName: string,
        applicantEmail: string,
        companyEmail: string,
        jobPosition: string,
        companyNote: string
    ): Promise<void> {
        
        if(applicationStatus === ApplicationStatus.PENDING) return;
        
        if(companyNote === null){
            companyNote = `Best regards ${companyName}`;
        }
        
        const template = await this.emailTemplateService.getEmailTemplateAsync(applicationStatus);
        
        const templateValues: Record<string, string> = {
            "applicantName": applicantName,
            "companyName": companyName,
            "jobPosition": jobPosition,
            "companyNote": companyNote
        };
        const populatedTemplate = this.populateTemplate(template, templateValues);
        
        await this.createTransporter();
        
        try{
            const mailingInfo = await this.transporter.sendMail({
                from: companyEmail,
                to: applicantEmail,
                subject: populatedTemplate.subject,
                text: populatedTemplate.message
            });
            
            console.log(`Message sent: ${mailingInfo.messageId}`);
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(mailingInfo)}}`);
        }
        catch(e){
            console.error("Error sending email: ", e);
        }
    }

    private populateTemplate(template: EmailTemplateDto, templateValues: Record<string, string>) {
        let { subject, message } = template;
    
        Object.keys(templateValues).forEach((key) => {
            const placeholder = `{{${key}}}`;
            const value = templateValues[key];
    
            subject = subject.replace(new RegExp(placeholder, 'g'), value);
            message = message.replace(new RegExp(placeholder, 'g'), value);
        });
    
        return { subject, message };
    }

    private async createTransporter() : Promise<void>{
        if(this.transporter) return;

        const testAccount = await nodemailer.createTestAccount();

        this.transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        console.log(`Using Ethereal credentials: ${testAccount.user} : ${testAccount.pass}`);
    }
}