import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { FeedbackModule } from './feedback/feedback.module';
import { JoinRequestsModule } from './join-requests/join-requests.module';
import { LoggerModule } from 'nestjs-pino';
import { NotificationsModule } from './notifications/notifications.module';
import { ProjectsModule } from './projects/projects.module';
import { SubtasksModule } from './subtasks/subtasks.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        MONGO_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    SubtasksModule,
    FeedbackModule,
    JoinRequestsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
