"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const database_1 = require("./database");
async function bootstrap() {
    // Only try to create DB if explicitly requested or in dev
    if (process.env.CREATE_DB === 'true') {
        try {
            await (0, database_1.ensureDatabaseExists)();
        }
        catch (e) {
            console.warn('Warning: Could not ensure database exists, continuing anyway...', e?.message || e);
        }
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // CORS configuration: Allow your production frontend URL
    app.enableCors({
        origin: process.env.FRONTEND_URL || '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Backend running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map