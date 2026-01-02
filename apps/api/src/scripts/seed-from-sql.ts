import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';

async function bootstrap() {
    console.log('Starting seed from SQL script...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        const seedFilePath = path.join(process.cwd(), '../../database/seed.sql');
        console.log(`Reading seed file from: ${seedFilePath}`);

        if (!fs.existsSync(seedFilePath)) {
            throw new Error(`Seed file not found at ${seedFilePath}`);
        }

        const sql = fs.readFileSync(seedFilePath, 'utf8');

        console.log('Executing SQL seed script...');

        // We can't easily split by ; because of potential strings containing ;
        // However, TypeORM's query method can execute multiple statements in one call in some PG drivers
        // If not, we might need a better way to parse.
        // For PostgreSQL, running the whole block often works if the driver supports it.
        await dataSource.query(sql);

        console.log('Seed data applied successfully.');
    } catch (error) {
        console.error('Error applying seed data:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
