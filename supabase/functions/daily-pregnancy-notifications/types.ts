
export interface BreedingRecord {
  id: string;
  expected_due_date: string;
  mother_id: string;
  pregnancy_confirmed: boolean;
  status: string;
  actual_birth_date?: string;
}

export interface Animal {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  preferred_language?: string;
}

export interface NotificationResult {
  notificationsSent: number;
  notificationsFailed: number;
}
