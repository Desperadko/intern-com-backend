import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { Opportunity } from './entities/opportunity.entity';
import { Application } from './entities/application.entity';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { UsersModule } from './users/users.module';
import { ApplicationsModule } from './applications/applications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { StripeWebhookMiddleware } from './middlewares/stripe-webhook.middleware';
import { EmailTemplatesModule } from './emails/email-templates/email-templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'internships_db'),
        entities: [User, Opportunity, Application],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Opportunity, Application]),
    AuthModule,
    OpportunitiesModule,
    UsersModule,
    ApplicationsModule,
    SubscriptionsModule,
    EmailTemplatesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(StripeWebhookMiddleware).forRoutes('subscriptions/webhook');
  }
}
