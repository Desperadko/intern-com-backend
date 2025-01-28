import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { EmailTemplateService } from './emails/email-templates/email-templates.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure Express raw body parsing for Stripe webhooks
  app.use('/subscriptions/webhook', express.raw({ type: 'application/json' }));

  // Increase payload size limit
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Seed with default email templates if they don't exist
  const emailTemplateService = app.get(EmailTemplateService);
  await emailTemplateService.initEmailTemplates();

  const port = process.env.PORT || 3030;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
