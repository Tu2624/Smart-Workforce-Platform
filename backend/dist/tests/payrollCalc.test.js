"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payrollCalc_1 = require("../src/utils/payrollCalc");
describe('calcPayrollItem', () => {
    const base = { shiftDurationHours: 8, hourlyRate: 50000, lateMinutes: 0, earlyMinutes: 0, isIncomplete: false };
    it('trả về đúng lương khi đúng giờ, không trừ', () => {
        const r = (0, payrollCalc_1.calcPayrollItem)(base);
        expect(r.subtotal).toBe(400000); // 8h × 50000
        expect(r.hours_worked).toBe(8);
        expect(r.deduction_amount).toBe(0);
        expect(r.deduction_minutes).toBe(0);
    });
    it('trừ tiền khi đi trễ 10 phút', () => {
        const r = (0, payrollCalc_1.calcPayrollItem)({ ...base, lateMinutes: 10 });
        const expected = 8 * 50000 - (10 / 60) * 50000;
        expect(r.subtotal).toBeCloseTo(expected, 2);
        expect(r.deduction_minutes).toBe(10);
    });
    it('trừ tiền khi về sớm 30 phút', () => {
        const r = (0, payrollCalc_1.calcPayrollItem)({ ...base, earlyMinutes: 30 });
        const expected = 8 * 50000 - (30 / 60) * 50000;
        expect(r.subtotal).toBeCloseTo(expected, 2);
        expect(r.deduction_minutes).toBe(30);
    });
    it('cộng dồn trễ + về sớm', () => {
        const r = (0, payrollCalc_1.calcPayrollItem)({ ...base, lateMinutes: 15, earlyMinutes: 15 });
        const expected = 8 * 50000 - (30 / 60) * 50000;
        expect(r.subtotal).toBeCloseTo(expected, 2);
        expect(r.deduction_minutes).toBe(30);
    });
    it('subtotal tối thiểu là 0 (không âm)', () => {
        // trễ 600 phút = 10h > ca 8h
        const r = (0, payrollCalc_1.calcPayrollItem)({ ...base, lateMinutes: 600 });
        expect(r.subtotal).toBe(0);
        expect(r.hours_worked).toBe(0);
    });
    it('incomplete → tất cả về 0 dù không trễ', () => {
        const r = (0, payrollCalc_1.calcPayrollItem)({ ...base, isIncomplete: true });
        expect(r.subtotal).toBe(0);
        expect(r.hours_worked).toBe(0);
        expect(r.deduction_amount).toBe(0);
        expect(r.scheduled_hours).toBe(8);
    });
    it('hourly_rate = 0 → subtotal = 0', () => {
        const r = (0, payrollCalc_1.calcPayrollItem)({ ...base, hourlyRate: 0 });
        expect(r.subtotal).toBe(0);
    });
    it('scheduled_hours phản ánh đúng độ dài ca', () => {
        const r = (0, payrollCalc_1.calcPayrollItem)({ ...base, shiftDurationHours: 4 });
        expect(r.scheduled_hours).toBe(4);
        expect(r.subtotal).toBe(200000);
    });
});
