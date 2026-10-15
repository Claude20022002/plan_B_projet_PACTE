import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './user.entity';
import { Classe } from './classe.entity';
import { Matiere } from './matiere.entity';
import { Groupe } from './groupe.entity';
import { SeedService } from './seed.service';
import { databaseConfig } from './database';
import { SessionPedagogique } from './session.entity';
import { ReactikState } from './reactik-state.entity';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: databaseConfig.host,
      port: databaseConfig.port,
      username: databaseConfig.username,
      password: databaseConfig.password,
      database: databaseConfig.database,
      entities: [User, Classe, Matiere, Groupe, SessionPedagogique, ReactikState],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Classe, Matiere, Groupe, SessionPedagogique, ReactikState]),
  ],
  controllers: [AppController],
  providers: [AppService, SeedService, AppGateway],
})
export class AppModule {}
