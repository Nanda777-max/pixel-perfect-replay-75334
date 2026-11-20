import { describe, it, expect } from 'vitest';
import { parseProjects, parseEducation, parseExperience, parseResearch } from '@/content/parse';

describe('content parsers', () => {
  it('reads every project without inventing values', () => {
    const { projects, comingSoon } = parseProjects();
    expect(projects.map(p => p.title)).toEqual([
      'FIFA World Cup 2026 Match Outcome Predictor',
      'Conversational AI Chatbot (NLP and Deep Learning)',
      'IoT Health Monitoring System with ML-Based Blood Pressure Estimation',
    ]);
    expect(projects[0]?.github).toBe('https://github.com/Nanda777-max/wc26-predictor');
    expect(projects[0]?.slug).toBe('wc26-predictor');
    expect(projects[0]?.demo).toBeUndefined();
    expect(projects[0]?.results).toContain('62.5% accuracy');
    expect(projects[1]?.noMetrics).toBe(true);
    expect(projects[1]?.role).toBeUndefined();
    expect(projects[1]?.github).toBeUndefined();
    expect(comingSoon).toBe(2);
  });
  it('reads education and experience headers', () => {
    const [master, btech] = parseEducation();
    expect(master).toMatchObject({ title: 'Master of Data Science', organisation: 'Monash University', location: 'Melbourne, Australia', status: 'in progress', startYear: 2025, endYear: 2027 });
    expect(master?.coursework).toContain('Machine Learning');
    expect(master?.details.join(' ')).not.toContain('§');
    expect(btech).toMatchObject({ organisation: 'TKM College of Engineering', location: 'Kollam, India' });
    const jobs = parseExperience();
    expect(jobs.map(j => j.organisation)).toEqual(['KitaHQ', 'Tata Consultancy Services', 'Evoura Technologies']);
    expect(jobs[0]?.note).toContain('TeaMWork');
    expect(jobs[1]).toMatchObject({ location: 'Kolkata, India', tools: ['Java', 'SQL', 'REST APIs'] });
  });
  it('reads research and leaves unsupplied fields empty', () => {
    const r = parseResearch();
    expect(r.link).toBe('https://ieeexplore.ieee.org/document/10528136');
    expect(r.title).toBe('Compact Diplexer Using Electromagnetic Bandgap Resonators for C and X Band Radar Systems');
    expect(r.summary).toMatch(/^A diplexer/);
    expect(r.contribution).toBeUndefined(); // still to be supplied
    expect(r.figurePath).toBe('/images/projects/ieee-figure.png');
  });
});
