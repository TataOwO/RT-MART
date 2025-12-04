import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModules } from './../module.index';
import { createTestApp } from './../functions/e2e';
import * as AuthPostTest from './../functions/auth/auth_post';
import * as UserPostTest from './../functions/users/users_post';
import * as UserDeleteTest from './../functions/users/users_delete';
import * as SellerPostTest from './../functions/sellers/sellers_post';
import * as SellerDeleteTest from './../functions/sellers/sellers_delete';
import * as SellerGetTest from './../functions/sellers/sellers_get';
import { buyerUser, sellerUser, adminUser, adminTester, buyerUser_sellerCase } from './../variables';

// # stores-api to-do:

//   - Get stores (public)
//       - get all of stores
//       - get stores with filter

//   - Get a single store (public)
//       - get a single store by id
//       - get a single store by deleted store id
//       - get a single store by non-existent id

//   - Update store data (seller's)
//       - **update own store data**
//       - update non-own store data with non-cookie
//       - update store data with non-permission role

//   - Delete store (seller's)
//       - **delete own store**
//       - delete store with non-cookie
//       - delete store with non-permission role

//   - Delete store (admin's)
//       - **delete store by id**
//       - delete store by deleted store id
//       - delete store by non-existent id
//       - delete store with non-cookie
//       - delete store with non-permission role

//   - `Health test`