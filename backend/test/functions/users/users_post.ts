import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { buyerUser, sellerUser, adminUser, adminTester } from '../../variables';

export async function createBuyerUser(app: INestApplication){
    const res = await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', `refreshToken=${adminTester.cookie.refreshToken}`)
        .send({
            loginId: buyerUser.loginId,
            password: buyerUser.password,
            name: buyerUser.name,
            email: buyerUser.email,
            phone: buyerUser.phone,
            role: buyerUser.role,
        })
        .expect(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.loginId).toBe(buyerUser.loginId);
    buyerUser.userId = res.body.userId;
}

export async function createSellerUser(app: INestApplication){
    const res = await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', `refreshToken=${adminTester.cookie.refreshToken}`)
        .send({
            loginId: sellerUser.loginId,
            password: sellerUser.password,
            name: sellerUser.name,
            email: sellerUser.email,
            phone: sellerUser.phone,
            role: sellerUser.role,
        })
        .expect(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.loginId).toBe(sellerUser.loginId);
    sellerUser.userId = res.body.userId;
}

export async function createAdminUser(app: INestApplication): Promise<string> {
    const res = await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', `refreshToken=${adminTester.cookie.refreshToken}`)
        .send({
            loginId: adminUser.loginId,
            password: adminUser.password,
            name: adminUser.name,
            email: adminUser.email,
            phone: adminUser.phone,
            role: adminUser.role,
        })
        .expect(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.loginId).toBe(adminUser.loginId);
    adminUser.userId = res.body.userId;
    return res.body.userId;
}

export async function createUserWithConflict(app: INestApplication, loginId: string, email: string){
    const res = await request(app.getHttpServer())
        .post('/users')
        .set('Cookie', `refreshToken=${adminTester.cookie.refreshToken}`)
        .send({
            loginId: loginId,
            password: '!abc12345678',
            name: '測試用帳號',
            email: email,
        })
        .expect(409);

    expect(res.body).toHaveProperty('statusCode', 409);
    expect(res.body).toHaveProperty('message');
}

export async function restoreDeletedUserById(app: INestApplication){
    const res = await request(app.getHttpServer())
      .post(`/users/${buyerUser.userId}/restore`)
      .set('Cookie', `refreshToken=${adminTester.cookie.refreshToken}`)
      .expect(201);

    expect(res.body).toHaveProperty('userId', buyerUser.userId);
}

export async function restoreNonDeletedUserById(app: INestApplication){
    const res = await request(app.getHttpServer())
      .post(`/users/${buyerUser.userId}/restore`)
      .set('Cookie', `refreshToken=${adminTester.cookie.refreshToken}`)
      .expect(404);
}

export async function restoreDeletedUserByNonExistentId(app: INestApplication){
    const res = await request(app.getHttpServer())
      .post(`/users/10000/restore`)
      .set('Cookie', `refreshToken=${adminTester.cookie.refreshToken}`)
      .expect(404);
}

export async function restoreDeletedUserWithNonPermissionRole(app: INestApplication){
    const res = await request(app.getHttpServer())
        .post(`/users/${buyerUser.userId}/restore`)
        .set('Cookie', `refreshToken=${sellerUser.cookie.refreshToken}`)
        .expect(401);
}
