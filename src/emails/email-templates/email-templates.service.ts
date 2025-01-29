import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as fs from 'fs/promises'
import { join } from "path";
import { EmailTemplateDto } from "./dto/email-templates.dto";

@Injectable()
export class EmailTemplateService{

    async getEmailTemplateAsync(type: string): Promise<EmailTemplateDto>{

        const filePath = this.getFilePath(type);

        try{
            const fileContent = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(fileContent) as EmailTemplateDto;
        }
        catch(e){
            console.error(`Error reading ${type} template`, e);
            throw new InternalServerErrorException(`Failed to read ${type} template`);
        }
    }

    async saveEmailTemplateAsync(type: string, template: EmailTemplateDto): Promise<{ message: string }>{

        const filePath = this.getFilePath(type);

        try{
            await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf-8');
            return {message: `${type} template updated successfully`};
        }
        catch(e){
            console.error(`Error updating ${type} template:`, e);
            throw new InternalServerErrorException(`Failed to update ${type} template`);
        }
    }

    async initEmailTemplates(): Promise<void>{
        
        const defaultTemplateValues = { subject: "Default Subject", message: "Default Message" };

        try{

            await fs.mkdir(join(this.templatesDir), {recursive: true});

            try{
                await fs.access(this.acceptedFilePath);
            }
            catch{
                await fs.writeFile(this.acceptedFilePath, JSON.stringify(defaultTemplateValues, null, 2), 'utf-8');
            }

            try{
                await fs.access(this.rejectedFilePath);
            }
            catch{
                await fs.writeFile(this.rejectedFilePath, JSON.stringify(defaultTemplateValues, null, 2), 'utf-8');
            }
        }
        catch(e){
            console.error("Error trying to initialize email templates", e);
            throw new InternalServerErrorException("Error seeding templates");
        }
    }

    private get templatesDir(): string {
        return process.env.TEMPLATES_PATH;
    } 
    private get acceptedFilePath(): string {
        return process.env.ACCEPTED_TEMPLATE_PATH;
    }
    private get rejectedFilePath(): string {
        return process.env.REJECTED_TEMPLATE_PATH;
    }

    private getFilePath(type: string){
        return type === 'accepted' ? this.acceptedFilePath : this.rejectedFilePath;
    }
}