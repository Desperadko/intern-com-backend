import { Module } from "@nestjs/common";
import { EmailTemplateController } from "./email-templates.controller";
import { EmailTemplateService } from "./email-templates.service";

@Module({
    controllers: [EmailTemplateController],
    providers: [EmailTemplateService],
})
export class EmailTemplatesModule{}