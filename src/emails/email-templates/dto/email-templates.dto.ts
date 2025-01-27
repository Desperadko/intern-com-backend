import { IsNotEmpty, IsString } from "class-validator";

export class EmailTemplateDto{
    
    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    message: string;
}