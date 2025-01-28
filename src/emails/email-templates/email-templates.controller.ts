import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    BadRequestException
} from "@nestjs/common";
import { EmailTemplateService } from "./email-templates.service";
import { EmailTemplateDto } from "./dto/email-templates.dto";

@Controller('email-templates')
export class EmailTemplateController{

    constructor(private readonly emailTemplateService: EmailTemplateService){}

    @Get()
    async getEmailTemplate(@Query('type') type: string){
        if(type !== 'accepted' && type !== 'rejected'){
            throw new BadRequestException('Invalid template type');
        }
        return this.emailTemplateService.getEmailTemplateAsync(type);
    }

    @Post()
    async saveEmailTemplate(
        @Query('type') type: string,
        @Body() template: EmailTemplateDto,
    ){
        if(type !== 'accepted' && type !== 'rejected'){
            throw new BadRequestException('Invalid template type');
        }
        if(!template.subject || !template.message){
            throw new BadRequestException('Template must include subject and message');
        }
        return this.emailTemplateService.saveEmailTemplateAsync(type, template);
    }
}