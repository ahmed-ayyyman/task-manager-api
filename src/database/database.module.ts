import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Connection } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('mongo.uri'),
        connectionFactory: (connection: Connection) => {
          connection.on('connected', () => console.log('✅ MongoDB connected'));
          connection.on('error', (err: unknown) =>
            console.error(
              '❌ MongoDB error:',
              err instanceof Error ? err.message : err,
            ),
          );
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
