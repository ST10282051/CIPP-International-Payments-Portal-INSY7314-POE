
const request = require('supertest');
const app = require('../app');
describe('Auth', ()=>{
  test('health endpoint', async ()=>{
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status','ok');
  });
});
