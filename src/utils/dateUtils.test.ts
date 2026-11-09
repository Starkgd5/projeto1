import { afterEach, describe, expect, it, vi } from 'vitest';
import { getExpirationInfo } from './dateUtils';
import { parseDateString, parseOcrText } from '../services/ocrService';

describe('parseDateString', () => {
  it('converts supported Brazilian dates to ISO', () => {
    expect(parseDateString('15/08/2026')).toBe('2026-08-15');
    expect(parseDateString('15 AGO 2026')).toBe('2026-08-15');
    expect(parseDateString('AGO/26')).toBe('2026-08-31');
    expect(parseDateString('02/2028')).toBe('2028-02-29');
  });

  it('rejects impossible dates and accepts leap days only in leap years', () => {
    expect(parseDateString('31/02/2027')).toBeNull();
    expect(parseDateString('29/02/2027')).toBeNull();
    expect(parseDateString('29/02/2028')).toBe('2028-02-29');
    expect(parseDateString('2027-02-31')).toBeNull();
  });
});

describe('parseOcrText', () => {
  it('extracts labeled expiration, lot, and barcode values', () => {
    expect(parseOcrText('FAB: 12/03/2026\nVAL: 12/09/2026\nLOTE: LT24980\n7891000100103')).toMatchObject({
      validadeDetectada: '2026-09-12',
      loteDetectado: 'LT24980',
      codigoBarrasDetectado: '7891000100103'
    });
  });

  it('does not turn impossible OCR dates into expiration dates', () => {
    expect(parseOcrText('VAL: 31/02/2027').validadeDetectada).toBeUndefined();
  });
});

describe('getExpirationInfo', () => {
  afterEach(() => vi.useRealTimers());

  it('classifies expiration boundaries consistently', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00'));

    expect(getExpirationInfo('2026-01-01').status).toBe('critico_30');
    expect(getExpirationInfo('2026-01-31').status).toBe('critico_30');
    expect(getExpirationInfo('2026-02-01').status).toBe('alerta_90');
    expect(getExpirationInfo('2026-04-02').status).toBe('atencao_180');
    expect(getExpirationInfo('2026-06-30').status).toBe('atencao_180');
    expect(getExpirationInfo('2026-07-01').status).toBe('seguro');
  });

  it('marks missing or malformed dates as invalid, never safe', () => {
    expect(getExpirationInfo('').status).toBe('invalida');
    expect(getExpirationInfo('2026-02-31').status).toBe('invalida');
    expect(getExpirationInfo('not-a-date').status).toBe('invalida');
  });
});