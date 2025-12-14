import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Activity, Collaborator, Manager, Admin, AppState, BranchConfig, ShiftConfig, EmergencyContact, ActivityDefinition } from './types';
import { MOCK_ACTIVITIES, MOCK_COLLABORATORS, MOCK_MANAGERS, MOCK_ADMINS, MOCK_BRANCH_CONFIGS, MOCK_SHIFT_CONFIGS, MOCK_EMERGENCY_CONTACTS, MOCK_ACTIVITY_DEFINITIONS } from './constants';

interface AppContextType extends AppState {
  login: (employeeNumber: string, password: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  
  // Activities
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  
  // Simulation
  setSimulatedDate: (date: Date) => void;

  // Collaborators Management
  addCollaborator: (collab: Omit<Collaborator, 'id' | 'avatarInitials' | 'password' | 'isFirstLogin' | 'role'> & {managerId?: number}) => void;
  updateCollaborator: (id: number, updates: Partial<Collaborator>) => void;
  deleteCollaborator: (id: number) => void;

  // Managers Management (For Admins)
  addManager: (manager: Omit<Manager, 'id' | 'isFirstLogin' | 'role' | 'password'>) => void;
  updateManager: (id: number, updates: Partial<Manager>) => void;
  deleteManager: (id: number) => void;

  // Config Management (Now Context Aware)
  addActivityType: (type: string) => void;
  deleteActivityType: (type: string) => void;
  updateBranchConfig: (config: BranchConfig) => void;
  updateShiftConfig: (config: ShiftConfig) => void;
  
  // Emergency Contacts
  addEmergencyContact: (name: string, phone: string) => void;
  deleteEmergencyContact: (id: string) => void;

  // Data Getters (Filtered)
  getVisibleCollaborators: () => Collaborator[];
  getVisibleActivities: () => Activity[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default configs for new managers or fallbacks
const INITIAL_BRANCH_CONFIG_TEMPLATE = {
    name: "Nueva Sucursal",
    ceco: "MX-00000",
    region: "Sin Asignar",
    territory: "Sin Asignar"
};

const INITIAL_SHIFT_CONFIG_TEMPLATE = {
    MATUTINO: { start: "08:00", end: "15:00" },
    VESPERTINO: { start: "12:00", end: "20:00" }
};

const INITIAL_ACTIVITIES_TEMPLATE = [
  "Apertura de Caja", "Cierre de Caja", "Atención a Clientes", "Hora de Comida"
];

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const initialDate = new Date();
  initialDate.setDate(initialDate.getDate() - initialDate.getDay() + 1); 
  initialDate.setHours(10, 15, 0, 0);

  // Database State (Mocking Supabase Tables)
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(MOCK_COLLABORATORS);
  const [managers, setManagers] = useState<Manager[]>(MOCK_MANAGERS);
  const [admins, setAdmins] = useState<Admin[]>(MOCK_ADMINS);
  
  // Configuration State (Now Global Arrays keyed by ManagerID)
  const [allActivityDefinitions, setAllActivityDefinitions] = useState<ActivityDefinition[]>(MOCK_ACTIVITY_DEFINITIONS);
  const [allBranchConfigs, setAllBranchConfigs] = useState<BranchConfig[]>(MOCK_BRANCH_CONFIGS);
  const [allShiftConfigs, setAllShiftConfigs] = useState<ShiftConfig[]>(MOCK_SHIFT_CONFIGS);
  const [allEmergencyContacts, setAllEmergencyContacts] = useState<EmergencyContact[]>(MOCK_EMERGENCY_CONTACTS);

  const [currentUser, setCurrentUser] = useState<Collaborator | Manager | Admin | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  // --- Auth ---
  const login = (employeeNumber: string, pass: string): boolean => {
    // 0. Check Admins
    const admin = admins.find(a => a.employeeNumber === employeeNumber && a.password === pass);
    if (admin) {
        setCurrentUser(admin);
        return true;
    }
    // 1. Check Managers
    const manager = managers.find(m => m.employeeNumber === employeeNumber && m.password === pass);
    if (manager) {
      setCurrentUser(manager);
      return true;
    }
    // 2. Check Collaborators
    const collab = collaborators.find(c => c.employeeNumber === employeeNumber && c.password === pass);
    if (collab) {
      setCurrentUser(collab);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const changePassword = (newPassword: string) => {
    if (!currentUser) return;
    
    if (currentUser.role === 'ADMIN') {
        setAdmins(prev => prev.map(a => a.id === currentUser.id ? { ...a, password: newPassword, isFirstLogin: false } : a));
        setCurrentUser(prev => prev ? ({ ...prev, password: newPassword, isFirstLogin: false } as Admin) : null);
    } else if (currentUser.role === 'MANAGER') {
        setManagers(prev => prev.map(m => m.id === currentUser.id ? { ...m, password: newPassword, isFirstLogin: false } : m));
        setCurrentUser(prev => prev ? ({ ...prev, password: newPassword, isFirstLogin: false } as Manager) : null);
    } else {
        setCollaborators(prev => prev.map(c => c.id === currentUser.id ? { ...c, password: newPassword, isFirstLogin: false } : c));
        setCurrentUser(prev => prev ? ({ ...prev, password: newPassword, isFirstLogin: false } as Collaborator) : null);
    }
  };

  // --- Helper to get Context ID ---
  // Returns the Manager ID that owns the configuration we should be looking at
  const getContextManagerId = (): number => {
      if (!currentUser) return 0; // Default fallback
      if (currentUser.role === 'MANAGER') return currentUser.id;
      if (currentUser.role === 'COLLABORATOR') return (currentUser as Collaborator).managerId;
      
      // If Admin, use first available manager or 0 if none exist
      if (currentUser.role === 'ADMIN') {
          return managers.length > 0 ? managers[0].id : 0;
      }
      return 0;
  };

  // --- Computed Configs based on Context ---
  const contextManagerId = getContextManagerId();

  const branchConfig = useMemo(() => {
     return allBranchConfigs.find(c => c.managerId === contextManagerId) || { ...INITIAL_BRANCH_CONFIG_TEMPLATE, managerId: contextManagerId };
  }, [allBranchConfigs, contextManagerId]);

  const shiftConfig = useMemo(() => {
      return allShiftConfigs.find(c => c.managerId === contextManagerId) || { ...INITIAL_SHIFT_CONFIG_TEMPLATE, managerId: contextManagerId };
  }, [allShiftConfigs, contextManagerId]);

  const activityTypes = useMemo(() => {
      return allActivityDefinitions.filter(a => a.managerId === contextManagerId).map(a => a.name);
  }, [allActivityDefinitions, contextManagerId]);

  const emergencyContacts = useMemo(() => {
      return allEmergencyContacts.filter(c => c.managerId === contextManagerId);
  }, [allEmergencyContacts, contextManagerId]);

  // --- Data Security / Filtering ---
  const getVisibleCollaborators = (): Collaborator[] => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'ADMIN') {
        return collaborators;
    } else if (currentUser.role === 'MANAGER') {
        return collaborators.filter(c => c.managerId === currentUser.id);
    } else {
        const currentManagerId = (currentUser as Collaborator).managerId;
        return collaborators.filter(c => c.managerId === currentManagerId);
    }
  };

  const getVisibleActivities = (): Activity[] => {
    if (currentUser?.role === 'ADMIN') return activities;

    const visibleCollabs = getVisibleCollaborators();
    const visibleIds = visibleCollabs.map(c => c.id);
    if (currentUser?.role === 'COLLABORATOR') visibleIds.push(currentUser.id);
    
    return activities.filter(a => visibleIds.includes(a.collaboratorId));
  };


  // --- Activities ---
  const addActivity = (data: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      completed: false
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        if (updates.completed === true && !act.completed) {
          return { ...act, ...updates, completedAt: currentDate };
        }
        return { ...act, ...updates };
      }
      return act;
    }));
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  // --- Managers (Admin Only) ---
  const addManager = (data: Omit<Manager, 'id' | 'isFirstLogin' | 'role' | 'password'>) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    const newId = Math.max(...managers.map(m => m.id), 900) + 1; 
    const newManager: Manager = {
        id: newId,
        password: data.employeeNumber, 
        isFirstLogin: true,
        role: 'MANAGER',
        ...data
    };
    setManagers(prev => [...prev, newManager]);

    // Initialize Default Configs for this new Manager
    setAllBranchConfigs(prev => [...prev, { ...INITIAL_BRANCH_CONFIG_TEMPLATE, managerId: newId }]);
    setAllShiftConfigs(prev => [...prev, { ...INITIAL_SHIFT_CONFIG_TEMPLATE, managerId: newId }]);
    
    const newActivities = INITIAL_ACTIVITIES_TEMPLATE.map((name, idx) => ({
        id: `def-${newId}-${idx}`,
        name,
        managerId: newId
    }));
    setAllActivityDefinitions(prev => [...prev, ...newActivities]);
  };

  const updateManager = (id: number, updates: Partial<Manager>) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setManagers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteManager = (id: number) => {
      if (!currentUser || currentUser.role !== 'ADMIN') return;
      setManagers(prev => prev.filter(m => m.id !== id));
      // Cleanup configs
      setAllBranchConfigs(prev => prev.filter(c => c.managerId !== id));
      setAllShiftConfigs(prev => prev.filter(c => c.managerId !== id));
      setAllActivityDefinitions(prev => prev.filter(c => c.managerId !== id));
      setAllEmergencyContacts(prev => prev.filter(c => c.managerId !== id));
  };


  // --- Collaborators ---
  const addCollaborator = (data: Omit<Collaborator, 'id' | 'avatarInitials' | 'password' | 'isFirstLogin' | 'role'> & {managerId?: number}) => {
    if (!currentUser) return;
    
    let assignedManagerId = currentUser.id;
    if (currentUser.role === 'ADMIN') {
        if (!data.managerId) {
            console.error("Admin must provide managerId");
            return;
        }
        assignedManagerId = data.managerId;
    }

    const newId = Math.max(...collaborators.map(c => c.id), 0) + 1;
    const initials = data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const newCollab: Collaborator = {
      id: newId,
      avatarInitials: initials,
      password: "123",
      isFirstLogin: true,
      role: 'COLLABORATOR',
      managerId: assignedManagerId,
      name: data.name,
      employeeNumber: data.employeeNumber,
      roleTitle: data.roleTitle,
      shift: data.shift
    };
    setCollaborators(prev => [...prev, newCollab]);
  };

  const updateCollaborator = (id: number, updates: Partial<Collaborator>) => {
    setCollaborators(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        if (updates.name) {
             updated.avatarInitials = updates.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        }
        return updated;
      }
      return c;
    }));
  };

  const deleteCollaborator = (id: number) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    setActivities(prev => prev.filter(a => a.collaboratorId !== id));
  };

  // --- Config Management (Scoped by Manager) ---
  const addActivityType = (type: string) => {
    if (!contextManagerId) return;
    // Check duplicate for this manager
    const exists = allActivityDefinitions.some(a => a.managerId === contextManagerId && a.name === type);
    if (!exists) {
        setAllActivityDefinitions(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            name: type,
            managerId: contextManagerId
        }]);
    }
  };

  const deleteActivityType = (type: string) => {
    if (!contextManagerId) return;
    setAllActivityDefinitions(prev => prev.filter(a => !(a.managerId === contextManagerId && a.name === type)));
  };

  const updateBranchConfig = (config: BranchConfig) => {
    if (!contextManagerId) return;
    setAllBranchConfigs(prev => {
        const others = prev.filter(c => c.managerId !== contextManagerId);
        return [...others, { ...config, managerId: contextManagerId }];
    });
  };

  const updateShiftConfig = (config: ShiftConfig) => {
    if (!contextManagerId) return;
    setAllShiftConfigs(prev => {
        const others = prev.filter(c => c.managerId !== contextManagerId);
        return [...others, { ...config, managerId: contextManagerId }];
    });
  };

  const addEmergencyContact = (name: string, phone: string) => {
    if (!contextManagerId) return;
    const newContact: EmergencyContact = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        phone,
        managerId: contextManagerId
    };
    setAllEmergencyContacts(prev => [...prev, newContact]);
  };

  const deleteEmergencyContact = (id: string) => {
    setAllEmergencyContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppContext.Provider value={{
      activities: getVisibleActivities(), 
      collaborators: getVisibleCollaborators(),
      managers,
      admins,
      activityTypes, // Computed for current context
      currentUser,
      currentDate,
      branchConfig, // Computed for current context
      shiftConfig, // Computed for current context
      emergencyContacts, // Computed for current context
      login,
      logout,
      changePassword,
      addActivity,
      updateActivity,
      deleteActivity,
      setSimulatedDate: setCurrentDate,
      addCollaborator,
      updateCollaborator,
      deleteCollaborator,
      addManager,
      updateManager,
      deleteManager,
      addActivityType,
      deleteActivityType,
      updateBranchConfig,
      updateShiftConfig,
      addEmergencyContact,
      deleteEmergencyContact,
      getVisibleCollaborators,
      getVisibleActivities
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};