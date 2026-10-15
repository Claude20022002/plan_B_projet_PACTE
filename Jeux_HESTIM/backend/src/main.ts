import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ensureDatabaseExists } from './database';

async function bootstrap() {
  // Only try to create DB if explicitly requested or in dev
  if (process.env.CREATE_DB === 'true') {
    try {
      await ensureDatabaseExists();
    } catch (e: any) {
      console.warn('Warning: Could not ensure database exists, continuing anyway...', e?.message || e);
    }
  }

  const app = await NestFactory.create(AppModule);
  
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
