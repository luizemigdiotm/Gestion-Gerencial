import { Collaborator, Activity, BranchConfig, ShiftConfig, EmergencyContact, Manager, Admin, ActivityDefinition } from './types';

// Time blocks 30 mins
export const TIME_SLOTS_MATUTINO = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", 
  "15:30", "16:00", "16:30", "17:00"
];

export const TIME_SLOTS_VESPERTINO = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", 
  "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", 
  "19:00", "19:30", "20:00", "20:30", "21:00"
];

export const ALL_TIME_SLOTS = [...new Set([...TIME_SLOTS_MATUTINO, ...TIME_SLOTS_VESPERTINO])].sort();

export const LUNCH_TIME_MATUTINO = ["13:00", "13:30"];
export const LUNCH_TIME_VESPERTINO = ["16:00", "16:30"];

export const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DEFAULT_STRINGS = [
  "Apertura de Caja",
  "Cierre de Caja",
  "Arqueo de Caja",
  "Atención Ventanilla",
  "Revisión de Bóveda",
  "Atención a Clientes",
  "Llamadas de Seguimiento",
  "Capacitación",
  "Hora de Comida",
  "Trámite Administrativo"
];

// Mock Manager ID
const MOCK_MANAGER_ID = 999;

export const MOCK_ACTIVITY_DEFINITIONS: ActivityDefinition[] = DEFAULT_STRINGS.map((name, idx) => ({
    id: `def-${idx}`,
    name,
    managerId: MOCK_MANAGER_ID
}));

export const MOCK_BRANCH_CONFIGS: BranchConfig[] = [{
  managerId: MOCK_MANAGER_ID,
  name: "Sucursal Centro Histórico",
  ceco: "MX-12345",
  region: "Metropolitana Norte",
  territory: "Zona 1"
}];

export const MOCK_SHIFT_CONFIGS: ShiftConfig[] = [{
  managerId: MOCK_MANAGER_ID,
  MATUTINO: { start: "08:00", end: "15:00" },
  VESPERTINO: { start: "12:00", end: "20:00" }
}];

export const MOCK_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: '1', managerId: MOCK_MANAGER_ID, name: 'Seguridad Corporativa', phone: '55-1234-5678' },
  { id: '2', managerId: MOCK_MANAGER_ID, name: 'Soporte Sistemas', phone: '800-999-0000' },
  { id: '3', managerId: MOCK_MANAGER_ID, name: 'Gerente Regional', phone: '55-5555-5555' }
];

// --- MOCK DATA FOR AUTH ---

// Admin Default (ID 1)
export const MOCK_ADMINS: Admin[] = [
  {
    id: 1,
    name: "Super Administrador",
    employeeNumber: "admin",
    password: "root",
    isFirstLogin: false,
    role: 'ADMIN'
  }
];

// Gerente Default (ID 999)
export const MOCK_MANAGERS: Manager[] = [
  { 
    id: MOCK_MANAGER_ID, 
    name: "Roberto Gerente", 
    employeeNumber: "ADMIN01", 
    password: "admin", 
    isFirstLogin: false, 
    role: 'MANAGER' 
  }
];

// Colaboradores asignados al Gerente 999
export const MOCK_COLLABORATORS: Collaborator[] = [
  { 
    id: 1, 
    name: "Ana García", 
    roleTitle: "Ejecutiva de Cuenta", 
    shift: "MATUTINO", 
    avatarInitials: "AG", 
    employeeNumber: "EMP001", 
    password: "123", 
    isFirstLogin: true, // Debe cambiar contraseña
    role: 'COLLABORATOR',
    managerId: MOCK_MANAGER_ID
  },
  { 
    id: 2, 
    name: "Carlos Ruiz", 
    roleTitle: "Cajero Principal", 
    shift: "MATUTINO", 
    avatarInitials: "CR", 
    employeeNumber: "EMP002", 
    password: "123", 
    isFirstLogin: false, 
    role: 'COLLABORATOR',
    managerId: MOCK_MANAGER_ID
  },
  { 
    id: 3, 
    name: "María López", 
    roleTitle: "Atención al Cliente", 
    shift: "VESPERTINO", 
    avatarInitials: "ML", 
    employeeNumber: "EMP003", 
    password: "123", 
    isFirstLogin: true, 
    role: 'COLLABORATOR',
    managerId: MOCK_MANAGER_ID
  },
  { 
    id: 4, 
    name: "Juan Pérez", 
    roleTitle: "Asesor Financiero", 
    shift: "VESPERTINO", 
    avatarInitials: "JP", 
    employeeNumber: "EMP004", 
    password: "123", 
    isFirstLogin: false, 
    role: 'COLLABORATOR',
    managerId: MOCK_MANAGER_ID
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: '101', collaboratorId: 1, day: 1, time: "08:30", endTime: "09:00", description: "Apertura de Caja", completed: true, completedAt: new Date() },
  { id: '102', collaboratorId: 1, day: 1, time: "09:00", endTime: "09:30", description: "Atención Ventanilla", completed: true, completedAt: new Date() },
  { id: '103', collaboratorId: 1, day: 1, time: "09:30", endTime: "10:00", description: "Revisión de Bóveda", completed: false },
  { id: '104', collaboratorId: 2, day: 1, time: "08:30", endTime: "09:00", description: "Apertura de Caja", completed: true, completedAt: new Date() },
  { id: '105', collaboratorId: 3, day: 1, time: "12:00", endTime: "12:30", description: "Trámite Administrativo", completed: false },
];