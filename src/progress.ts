export const LEARNING_NODE_IDS = [
  'net-basics',
  'linux-bash',
  'python-sec',
  'cryptography',
  'owasp-web',
  'pentest'
] as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateActiveStreak(dates: string[]) {
  if (dates.length === 0) return 0;

  const uniqueDates = new Set(dates);
  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86_400_000));
  const latest = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a))[0];

  if (latest !== today && latest !== yesterday) return 0;

  let streak = 0;
  const checkDate = new Date(`${latest}T12:00:00`);
  while (uniqueDates.has(getLocalDateString(checkDate))) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

function readStoredJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

export function sanitizeNodeIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(value.filter(
    (id): id is string => typeof id === 'string' && LEARNING_NODE_IDS.includes(id as typeof LEARNING_NODE_IDS[number])
  )));
}

export function sanitizeStudyDates(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(value.filter(
    (date): date is string => typeof date === 'string' && DATE_PATTERN.test(date)
  )));
}

export function readStoredNodeIds() {
  return sanitizeNodeIds(readStoredJson('sec_completed_nodes'));
}

export function readStoredStudyDates() {
  return sanitizeStudyDates(readStoredJson('sec_study_dates'));
}

export function readStoredLongestStreak() {
  const value = Number(localStorage.getItem('sec_longest_streak') || '0');
  return Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), 3_660) : 0;
}
