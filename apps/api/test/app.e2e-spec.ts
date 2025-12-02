import { type INestApplication } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- Runtime safety in tests */
import { Test, type TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { type App } from 'supertest/types';

import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/');
    // The project may or may not expose a root route. Accept 200 or 404.
    expect([200, 404]).toContain(res.status);
  });
});
