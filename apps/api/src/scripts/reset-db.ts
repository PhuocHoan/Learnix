import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function bootstrap() {
    console.log('Starting database reset...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        console.log('Dropping database...');
        await dataSource.dropDatabase();
        console.log('Database dropped successfully.');

        console.log('Synchronizing database...');
        await dataSource.synchronize();
        console.log('Database synchronized successfully.');

        console.log('Database reset complete.');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
