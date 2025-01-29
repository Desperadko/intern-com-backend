import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { ApplicationsService } from '../applications/applications.service';
import { Application } from '../entities/application.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EmailerService } from 'src/emails/emailer.service';
import { EmailTemplateService } from 'src/emails/email-templates/email-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Application, Opportunity])],
  controllers: [UsersController],
  providers: [UsersService, ApplicationsService, SubscriptionsService, EmailerService, EmailTemplateService],
  exports: [UsersService],
})
export class UsersModule {}
