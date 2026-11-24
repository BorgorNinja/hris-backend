import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ZonesModule } from './zones/zones.module';
import { IncidentsModule } from './incidents/incidents.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'sentri'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'sentri_db'),
        autoLoadEntities: true,
        synchronize: true, // dev only — auto-creates tables from entities
      }),
    }),
    AuthModule,
    UsersModule,
    ZonesModule,
    IncidentsModule,
    AnnouncementsModule,
  ],
})
export class AppModule {}
