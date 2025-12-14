export type Role = 'MANAGER' | 'COLLABORATOR' | 'ADMIN';
export type ShiftType = 'MATUTINO' | 'VESPERTINO';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday...

export interface UserBase {
  id: string; // UUID from Supabase
  name: string;
  email: string;
  employeeNumber: string;
  // password is removed as it is handled by Supabase Auth
  isFirstLogin?: boolean; // Can use 'last_sign_in_at' or similar from Supabase logic if needed, keeping optional
  role: Role;
}

export interface Collaborator extends UserBase {
  role: 'COLLABORATOR';
  roleTitle: string;
  shift: ShiftType;
  avatarInitials: string;
  managerId: string; // UUID
}

export interface Manager extends UserBase {
  role: 'MANAGER';
}

export interface Admin extends UserBase {
  role: 'ADMIN';
}

export interface Activity {
  id: string; // UUID
  collaboratorId: string; // UUID
  day: DayOfWeek;
  time: string; // Time string HH:mm
  endTime: string; // Time string HH:mm
  description: string;
  completed: boolean;
  completedAt?: Date;
  type?: string;
}

export interface ActivityDefinition {
  id: string; // BigInt loaded as string or UUID if we changed it, keeping string for safety
  name: string;
  managerId: string; // UUID
}

export interface BranchConfig {
  id?: string; // DB ID
  managerId: string; // UUID
  name: string;
  ceco: string;
  region: string;
  territory: string;
}

export interface ShiftSchedule {
  start: string;
  end: string;
}

export interface ShiftConfig {
  id?: string;
  managerId: string; // UUID
  MATUTINO: ShiftSchedule;
  VESPERTINO: ShiftSchedule;
}

export interface EmergencyContact {
  id: string;
  managerId: string; // UUID
  name: string;
  phone: string;
}

export interface AppState {
  activities: Activity[];
  collaborators: Collaborator[];
  managers: Manager[];
  admins: Admin[];
  activityTypes: string[];
  currentUser: Collaborator | Manager | Admin | null;
  currentDate: Date;
  branchConfig: BranchConfig;
  shiftConfig: ShiftConfig;
  emergencyContacts: EmergencyContact[];
}