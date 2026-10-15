"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_entity_1 = require("./user.entity");
const classe_entity_1 = require("./classe.entity");
const matiere_entity_1 = require("./matiere.entity");
const groupe_entity_1 = require("./groupe.entity");
const seed_service_1 = require("./seed.service");
const database_1 = require("./database");
const session_entity_1 = require("./session.entity");
const reactik_state_entity_1 = require("./reactik-state.entity");
const app_gateway_1 = require("./app.gateway");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: database_1.databaseConfig.host,
                port: database_1.databaseConfig.port,
                username: database_1.databaseConfig.username,
                password: database_1.databaseConfig.password,
                database: database_1.databaseConfig.database,
                entities: [user_entity_1.User, classe_entity_1.Classe, matiere_entity_1.Matiere, groupe_entity_1.Groupe, session_entity_1.SessionPedagogique, reactik_state_entity_1.ReactikState],
                synchronize: true,
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, classe_entity_1.Classe, matiere_entity_1.Matiere, groupe_entity_1.Groupe, session_entity_1.SessionPedagogique, reactik_state_entity_1.ReactikState]),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, seed_service_1.SeedService, app_gateway_1.AppGateway],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map