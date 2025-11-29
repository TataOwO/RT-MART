import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';
import { createTestApp } from './../functions/e2e';
import * as AuthPostTest from './../functions/auth/auth_post';
import * as UserPostTest from './../functions/users/users_post';
import * as UserPatchTest from './../functions/users/users_patch';
import * as UserDeleteTest from './../functions/users/users_delete';
import * as UserGetTest from './../functions/users/users_get';
import { buyerUser, sellerUser, adminUser, adminTester } from './../variables';


describe('SellerController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  }, 15000);

  afterAll(async () => {
    await app.close();
  });




});