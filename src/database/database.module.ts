import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo.uri'),
        connectionFactory: (connection: any) => {
          connection.on('connected', () => console.log('✅ MongoDB connected'));
          connection.on('error', (err: any) => console.error('❌ MongoDB error:', err.message));
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}