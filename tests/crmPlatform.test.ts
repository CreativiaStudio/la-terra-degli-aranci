import { describe, it, expect, beforeEach } from 'vitest';
import { invitiApi } from '../src/services/invitiApi';

describe('TDA Multi-Tenant Platform & Sposi CRM Engine', () => {
  beforeEach(() => {
    // Reset window.location mock
    delete (window as any).location;
    (window as any).location = new URL('https://www.laterradegliaranci.it/invito/');
  });

  it('detects default pilot couple slug when at root /invito/', () => {
    expect(invitiApi.getCurrentSlug()).toBe('francesca-e-ferdinando');
  });

  it('detects couple slug dynamically from URL pathname', () => {
    (window as any).location = new URL('https://www.laterradegliaranci.it/invito/antonio-e-alessia/');
    expect(invitiApi.getCurrentSlug()).toBe('antonio-e-alessia');
  });

  it('detects couple slug from query parameter ?coppia=...', () => {
    (window as any).location = new URL('https://www.laterradegliaranci.it/invito/?coppia=mario-e-elena');
    expect(invitiApi.getCurrentSlug()).toBe('mario-e-elena');
  });

  it('ignores asset and system paths from slug extraction', () => {
    (window as any).location = new URL('https://www.laterradegliaranci.it/invito/assets/index.js');
    expect(invitiApi.getCurrentSlug()).toBe('francesca-e-ferdinando');
  });

  it('generates correct CSV export URL for Excel with couple slug and PIN', () => {
    const url = invitiApi.getExportCsvUrl('francesca-e-ferdinando', '0712');
    expect(url).toContain('/wp-json/tda/v1/crm/francesca-e-ferdinando/export-csv');
    expect(url).toContain('pin=0712');
  });
});
