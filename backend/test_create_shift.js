const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const { ShiftsService } = require('./build/modules/shifts/shifts.service.js') || {};
  if (!ShiftsService) {
     console.log('Cannot load ShiftsService');
     return;
  }
  const s = new ShiftsService();
  try {
     const res = await s.createShift('086e89c3-11e3-4f12-8a7b-f333bdd260b0', {
       job_id: 'cf84b0f3-b263-4af2-bdfa-5fc8d261a103',
       start_time: '2026-04-12T08:00',
       end_time: '2026-04-12T12:00',
       max_workers: 2,
       auto_assign: false
     });
     console.log('Created!', res);
  } catch (e) {
     console.error('Error:', e);
  }
}
run().catch(console.error);
