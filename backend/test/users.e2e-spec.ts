import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './module.index';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mariadb',
          host: 'mariadb',
          port: 3306,
          username: 'rt_mart_user',
          password: 'rt_mart_and_the_user_password_yeah_very_cool123*',
          database: 'rt_mart_db',
          autoLoadEntities: true,
          migrations: ['../src/migrations/*.js'],
        }),
        ...AppModules,
      ],}).compile();
      
    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  let testUserId: string;
  let testUserLoginId = 'test_user';

  it('/users (POST) → create a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        loginId: testUserLoginId,
        password: '12345678',
        name: '測試用帳號',
        email: testUserLoginId + '@example.com',
        phone: '0912345678',
        role: 'buyer',
      })
      .expect(201);

  expect(res.body).toHaveProperty('userId');
  expect(res.body.loginId).toBe(testUserLoginId);
  testUserId = res.body.userId;
  });

  it('/users (POST) → create a user for conflict 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        loginId: testUserLoginId,
        password: '12345678',
        name: '測試用帳號',
        email: testUserLoginId + '@example.com',
        phone: '0912345678',
        role: 'buyer',
      })
      .expect(409);

  expect(res.body).toHaveProperty('statusCode', 409);
  expect(res.body).toHaveProperty('message');
  });


  it('/users (GET) → get all users', async () => {
    const res = await request(app.getHttpServer())
      .get('/users?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('/users/:id (GET) → get a single user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${testUserId}`)
      .expect(200);

    expect(res.body).toHaveProperty('userId', testUserId);
    expect(res.body.loginId).toBe(testUserLoginId);
  });

  it('/users/:id (PATCH) → update a user', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${testUserId}`)
      .send({ name: '更新後的名稱' })
      .expect(200);

    expect(res.body).toHaveProperty('userId', testUserId);
    expect(res.body.name).toBe('更新後的名稱');
  });

  it('/users/:id/restore (POST) → restore a user', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${testUserId}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .post(`/users/${testUserId}/restore`)
      .expect(201);

    expect(res.body).toHaveProperty('userId', testUserId);
  });

  it('/users/:id (DELETE) → delete a user', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${testUserId}`)
      .expect(200);

    expect(res.body).toHaveProperty('message', 'User deleted successfully');
  });

  it('/users/test/health (GET) → health check', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/test/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('module', 'users');
    expect(res.body).toHaveProperty('timestamp');
  });
});
