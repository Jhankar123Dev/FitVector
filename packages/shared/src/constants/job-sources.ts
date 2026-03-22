export interface JobSource {
  id: string;
  name: string;
  color: string;
  icon: string;
  baseUrl: string;
}

export const JOB_SOURCES = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: 'linkedin',
    baseUrl: 'https://www.linkedin.com/jobs',
  },
  naukri: {
    id: 'naukri',
    name: 'Naukri',
    color: '#4A90D9',
    icon: 'naukri',
    baseUrl: 'https://www.naukri.com',
  },
  indeed: {
    id: 'indeed',
    name: 'Indeed',
    color: '#2164F3',
    icon: 'indeed',
    baseUrl: 'https://www.indeed.com',
  },
  glassdoor: {
    id: 'glassdoor',
    name: 'Glassdoor',
    color: '#0CAA41',
    icon: 'glassdoor',
    baseUrl: 'https://www.glassdoor.com',
  },
  google: {
    id: 'google',
    name: 'Google Jobs',
    color: '#4285F4',
    icon: 'google',
    baseUrl: 'https://www.google.com/search?q=jobs',
  },
  ziprecruiter: {
    id: 'ziprecruiter',
    name: 'ZipRecruiter',
    color: '#25A55F',
    icon: 'ziprecruiter',
    baseUrl: 'https://www.ziprecruiter.com',
  },
  fitvector: {
    id: 'fitvector',
    name: 'FitVector',
    color: '#7C3AED',
    icon: 'fitvector',
    baseUrl: 'https://app.fitvector.com',
  },
} as const;

export type JobSourceId = keyof typeof JOB_SOURCES;

export const JOB_SOURCE_IDS: JobSourceId[] = Object.keys(JOB_SOURCES) as JobSourceId[];

/**
 * Get a job source by its id. Returns undefined if not found.
 */
export function getJobSource(id: string): JobSource | undefined {
  return (JOB_SOURCES as Record<string, JobSource>)[id];
}
