import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { Application } from '../entities/application.entity';
import { User } from '../entities/user.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EmailerService } from 'src/emails/emailer.service';
import { EmailTemplateService } from 'src/emails/email-templates/email-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Application, User, Opportunity])],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, SubscriptionsService, EmailerService, EmailTemplateService],
})
export class ApplicationsModule {}
