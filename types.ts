export type Role = 'MANAGER' | 'COLLABORATOR' | 'ADMIN';
export type ShiftType = 'MATUTINO' | 'VESPERTINO';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday...

export interface UserBase {
  id: number;
  name: string;
  employeeNumber: string; // Used for Login
  password?: string; // Should be hashed in real DB
  isFirstLogin: boolean;
  role: Role;
}

export interface Collaborator extends UserBase {
  role: 'COLLABORATOR';
  roleTitle: string;
  shift: ShiftType;
  avatarInitials: string;
  managerId: number; // Foreign Key to Manager
}

export interface Manager extends UserBase {
  role: 'MANAGER';
}

export interface Admin extends UserBase {
  role: 'ADMIN';
}

export interface Activity {
  id: string;
  collaboratorId: number;
  day: DayOfWeek;
  time: string;
  endTime: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  type?: string; 
}

export interface ActivityDefinition {
    id: string;
    name: string;
    managerId: number;
}

export interface BranchConfig {
  managerId: number; // Config belongs to a specific manager
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
  managerId: number;
  MATUTINO: ShiftSchedule;
  VESPERTINO: ShiftSchedule;
}

export interface EmergencyContact {
  id: string;
  managerId: number;
  name: string;
  phone: string;
}

export interface AppState {
  activities: Activity[];
  collaborators: Collaborator[]; 
  managers: Manager[]; 
  admins: Admin[];
  activityTypes: string[]; // Computed based on context
  currentUser: Collaborator | Manager | Admin | null;
  currentDate: Date;
  branchConfig: BranchConfig; // Computed based on context
  shiftConfig: ShiftConfig; // Computed based on context
  emergencyContacts: EmergencyContact[]; // Computed based on context
}