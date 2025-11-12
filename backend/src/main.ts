import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5173', 'http://frontend:5173'], // Vite 預設 port (本地和 Docker)
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();

