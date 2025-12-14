import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Activity, Collaborator, Manager, Admin, AppState, BranchConfig, ShiftConfig, EmergencyContact, ActivityDefinition, UserBase } from './types';
import { supabase } from './supabaseClient';

interface AppContextType extends AppState {
  login: (employeeNumber: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;

  // Activities
  addActivity: (activity: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;

  // Simulation
  setSimulatedDate: (date: Date) => void;

  // Collaborators Management
  addCollaborator: (collab: any) => Promise<void>;
  updateCollaborator: (id: string, updates: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;

  // Managers Management
  addManager: (manager: any) => Promise<void>;
  updateManager: (id: string, updates: Partial<Manager>) => Promise<void>;
  deleteManager: (id: string) => Promise<void>;

  // Config Management
  addActivityType: (type: string) => Promise<void>;
  deleteActivityType: (type: string) => Promise<void>;
  updateBranchConfig: (config: BranchConfig) => Promise<void>;
  updateShiftConfig: (config: ShiftConfig) => Promise<void>;

  // Emergency Contacts
  addEmergencyContact: (name: string, phone: string) => Promise<void>;
  deleteEmergencyContact: (id: string) => Promise<void>;

  // Data Getters (Filtered)
  getVisibleCollaborators: () => Collaborator[];
  getVisibleActivities: () => Activity[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Defaults
const INITIAL_BRANCH_CONFIG_TEMPLATE: Omit<BranchConfig, 'managerId'> = {
  name: "Nueva Sucursal",
  ceco: "MX-00000",
  region: "Sin Asignar",
  territory: "Sin Asignar"
};

const INITIAL_SHIFT_CONFIG_TEMPLATE: Omit<ShiftConfig, 'managerId'> = {
  MATUTINO: { start: "08:00", end: "15:00" },
  VESPERTINO: { start: "12:00", end: "20:00" }
};

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  // --- Initialization Guard ---
  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-red-600">
        <div className="bg-white p-8 rounded shadow-lg max-w-md text-center border border-red-200">
          <h1 className="text-2xl font-bold mb-4">Error de Configuración</h1>
          <p className="mb-4">No se ha podido inicializar la conexión con Supabase.</p>
          <p className="text-sm bg-gray-100 p-3 rounded text-left font-mono">
            Faltan variables de entorno: <br />
            VITE_SUPABASE_URL <br />
            VITE_SUPABASE_ANON_KEY
          </p>
          <p className="text-xs text-gray-500 mt-4">Verifica tu archivo .env.local</p>
        </div>
      </div>
    );
  }

  const initialDate = new Date();
  initialDate.setDate(initialDate.getDate() - initialDate.getDay() + 1);
  initialDate.setHours(10, 15, 0, 0);

  // --- Global State ---
  const [activities, setActivities] = useState<Activity[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);

  const [allActivityDefinitions, setAllActivityDefinitions] = useState<ActivityDefinition[]>([]);
  const [allBranchConfigs, setAllBranchConfigs] = useState<BranchConfig[]>([]);
  const [allShiftConfigs, setAllShiftConfigs] = useState<ShiftConfig[]>([]);
  const [allEmergencyContacts, setAllEmergencyContacts] = useState<EmergencyContact[]>([]);

  const [currentUser, setCurrentUser] = useState<Collaborator | Manager | Admin | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  // --- Auth & Initial Fetch ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        // Clear Data
        setActivities([]);
        setCollaborators([]);
        setManagers([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      // Map DB snake_case to app camelCase
      const user: any = {
        id: data.id,
        name: data.name,
        email: data.email,
        employeeNumber: data.employee_number,
        role: data.role,
        isFirstLogin: false, // Manage differently in DB if needed
      };

      if (data.role === 'COLLABORATOR') {
        user.roleTitle = data.role_title;
        user.shift = data.shift;
        user.avatarInitials = data.avatar_initials;
        user.managerId = data.manager_id;
      }

      setCurrentUser(user);
      fetchAppData(user);
    }
  };

  const fetchAppData = async (user: UserBase) => {
    // Logic to fetch data based on Role
    // 1. Fetch Configs & Definitions (Usually Manager Scope)

    let managerIdsToFetch: string[] = [];

    if (user.role === 'MANAGER') {
      managerIdsToFetch = [user.id];
    } else if (user.role === 'COLLABORATOR') {
      managerIdsToFetch = [(user as Collaborator).managerId];
    } else if (user.role === 'ADMIN') {
      const { data: allManagers } = await supabase.from('profiles').select('*').eq('role', 'MANAGER');
      if (allManagers) managerIdsToFetch = allManagers.map(m => m.id);
    }

    // Fetch Related Data
    if (managerIdsToFetch.length > 0) {
      // Activities Definitions
      const { data: actDefs } = await supabase.from('activity_definitions').select('*').in('manager_id', managerIdsToFetch);
      if (actDefs) setAllActivityDefinitions(actDefs.map(d => ({ ...d, managerId: d.manager_id })));

      // Branch Configs
      const { data: bConfigs } = await supabase.from('branch_configs').select('*').in('manager_id', managerIdsToFetch);
      if (bConfigs) setAllBranchConfigs(bConfigs.map(c => ({ ...c, managerId: c.manager_id })));

      // Shift Configs
      const { data: sConfigs } = await supabase.from('shift_configs').select('*').in('manager_id', managerIdsToFetch);
      // Need to map flat DB columns to MATUTINO/VESPERTINO objects
      if (sConfigs) {
        const mappedConfigs = sConfigs.map(c => ({
          id: c.id,
          managerId: c.manager_id,
          MATUTINO: { start: c.matutino_start, end: c.matutino_end },
          VESPERTINO: { start: c.vespertino_start, end: c.vespertino_end },
        }));
        setAllShiftConfigs(mappedConfigs);
      }

      // Emergency Contacts
      const { data: eContacts } = await supabase.from('emergency_contacts').select('*').in('manager_id', managerIdsToFetch);
      if (eContacts) setAllEmergencyContacts(eContacts.map(c => ({ ...c, managerId: c.manager_id })));

      // Fetch Collaborators
      const { data: collabs } = await supabase.from('profiles').select('*').eq('role', 'COLLABORATOR').in('manager_id', managerIdsToFetch);
      if (collabs) {
        setCollaborators(collabs.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          employeeNumber: c.employee_number,
          role: 'COLLABORATOR',
          roleTitle: c.role_title,
          shift: c.shift,
          avatarInitials: c.avatar_initials,
          managerId: c.manager_id,
        })));
      }

      // Fetch Activities for these collaborators
      const { data: acts } = await supabase.from('activities').select('*'); // If RLS is on, this is safe. Or filter by collaborator IDs.
      if (acts) {
        const mappedActs = acts.map(a => ({
          id: a.id,
          collaboratorId: a.collaborator_id,
          day: a.day_of_week as any,
          time: a.time_start.substring(0, 5), // HH:mm:ss -> HH:mm
          endTime: a.time_end.substring(0, 5),
          description: a.description,
          completed: a.is_completed,
          completedAt: a.completed_at ? new Date(a.completed_at) : undefined,
          type: 'default' // Add type column if needed in DB
        }));
        setActivities(mappedActs);
      }
    }
  };


  // --- Auth Actions ---
  const login = async (employeeNumber: string, pass: string): Promise<boolean> => {
    // NOTE: Supabase Login uses EMAIL, but user has Employee Number.
    // Trick: If we want to login with EmployeeNumber, we need a way to map it to Email first 
    // OR (easier for MVP) assume 'employeeNumber' input IS the email for now, OR fetch email by empNum via Edge Function (Admin).
    // FOR THIS MVP: We will try to sign in using the INPUT as Email. User must enter Email.

    const { error } = await supabase.auth.signInWithPassword({
      email: employeeNumber, // Using input field as Email
      password: pass,
    });

    if (error) {
      console.error("Login Error", error);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const changePassword = async (newPassword: string) => {
    await supabase.auth.updateUser({ password: newPassword });
  };


  // --- Helper to get Context ID ---
  const getContextManagerId = (): string => {
    if (!currentUser) return '';
    if (currentUser.role === 'MANAGER') return currentUser.id;
    if (currentUser.role === 'COLLABORATOR') return (currentUser as Collaborator).managerId;
    if (currentUser.role === 'ADMIN') {
      // Mock: use first manager found
      return ''; // TODO: Admin selector logic
    }
    return '';
  };

  const contextManagerId = getContextManagerId();

  // --- Computed Configs ---
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


  // --- Getters ---
  const getVisibleCollaborators = (): Collaborator[] => {
    if (!currentUser) return [];
    if (currentUser.role === 'MANAGER') return collaborators.filter(c => c.managerId === currentUser.id);
    if (currentUser.role === 'COLLABORATOR') return collaborators.filter(c => c.managerId === (currentUser as Collaborator).managerId);
    return collaborators;
  };

  const getVisibleActivities = (): Activity[] => {
    // Already filtered by fetch logic mostly, but safe to filter again
    const visibleCollabs = getVisibleCollaborators().map(c => c.id);
    if (currentUser?.role === 'COLLABORATOR') visibleCollabs.push(currentUser.id);
    return activities.filter(a => visibleCollabs.includes(a.collaboratorId));
  };


  // --- Actions ---
  // Note: These now need to be Async to update DB, but state update is Optimistic or re-fetch

  const addActivity = async (data: Omit<Activity, 'id'>) => {
    // DB Insert
    const { data: inserted, error } = await supabase.from('activities').insert({
      collaborator_id: data.collaboratorId,
      day_of_week: data.day,
      time_start: data.time,
      time_end: data.endTime,
      description: data.description,
      is_completed: false
    }).select().single();

    if (inserted && !error) {
      // Update Local State
      const newAct: Activity = {
        id: inserted.id,
        collaboratorId: inserted.collaborator_id,
        day: inserted.day_of_week,
        time: inserted.time_start.slice(0, 5),
        endTime: inserted.time_end.slice(0, 5),
        description: inserted.description,
        completed: inserted.is_completed,
        type: 'default'
      };
      setActivities(prev => [...prev, newAct]);
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    // Prepare DB updates
    const dbUpdates: any = {};
    if (updates.completed !== undefined) {
      dbUpdates.is_completed = updates.completed;
      if (updates.completed) dbUpdates.completed_at = new Date(); // Should match server time ideally
    }

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('activities').update(dbUpdates).eq('id', id);

      // Optimistic Update
      setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  };

  const deleteActivity = async (id: string) => {
    await supabase.from('activities').delete().eq('id', id);
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  // --- Placeholders for other actions (User management) ---
  // --- User Management (Profiles) ---
  // Note: Creating a user profile requires an existing Auth User (UUID).
  // For this MVP, we assume the Auth User is created manually or via a separate Admin flow.
  // These functions facilitate managing the Profile data once the ID is known or if we are just updating.

  const addCollaborator = async (collab: any) => {
    // In a real app, this would use a Server Action to create Auth User + Profile.
    // Here we can only insert the profile if we have the ID. 
    // Since we don't have the ID from the UI (yet), this is limited.
    // OPTION: We could generate a dummy profile for visualization if not linked to Auth yet,
    // but 'profiles' is strictly linked to Auth.

    alert("Para agregar un colaborador, primero crea el usuario en 'Authentication' de Supabase. Luego, agrega manualmente el registro en la tabla 'public.profiles' con el Rol 'COLLABORATOR'.");
    console.warn("Feature requiring Admin API: addCollaborator");
  };

  const updateCollaborator = async (id: string, updates: Partial<Collaborator>) => {
    // Map to snake_case
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.employeeNumber) dbUpdates.employee_number = updates.employeeNumber;
    if (updates.roleTitle) dbUpdates.role_title = updates.roleTitle;
    if (updates.shift) dbUpdates.shift = updates.shift;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);

    if (!error) {
      setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  };

  const deleteCollaborator = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setCollaborators(prev => prev.filter(c => c.id !== id));
    }
  };

  const addManager = async (manager: any) => {
    alert("Para agregar un gerente, crea el usuario en Supabase Auth y luego inserta en 'public.profiles' con Rol 'MANAGER'.");
  };

  const updateManager = async (id: string, updates: Partial<Manager>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.employeeNumber) dbUpdates.employee_number = updates.employeeNumber;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
    if (!error) {
      setManagers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }
  };

  const deleteManager = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setManagers(prev => prev.filter(m => m.id !== id));
    }
  };


  // --- Config Management ---

  const addActivityType = async (type: string) => {
    if (!contextManagerId) return;
    const { data, error } = await supabase.from('activity_definitions').insert({
      manager_id: contextManagerId,
      name: type
    }).select().single();

    if (data && !error) {
      setAllActivityDefinitions(prev => [...prev, { id: data.id, manager_id: data.manager_id, name: data.name, managerId: data.manager_id } as any]);
    }
  };

  const deleteActivityType = async (type: string) => {
    if (!contextManagerId) return;
    const { error } = await supabase.from('activity_definitions').delete().match({
      manager_id: contextManagerId,
      name: type
    });

    if (!error) {
      setAllActivityDefinitions(prev => prev.filter(a => !(a.managerId === contextManagerId && a.name === type)));
    }
  };

  const updateBranchConfig = async (config: BranchConfig) => {
    if (!contextManagerId) return;

    const { data, error } = await supabase.from('branch_configs').upsert({
      manager_id: contextManagerId,
      name: config.name,
      ceco: config.ceco,
      region: config.region,
      territory: config.territory
    }, { onConflict: 'manager_id' }).select();

    if (!error && data) {
      // We need to update AllBranchConfigs or force fetch
      setAllBranchConfigs(prev => {
        const idx = prev.findIndex(c => c.managerId === contextManagerId);
        const newConfig = { ...config, managerId: contextManagerId };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = newConfig;
          return copy;
        }
        return [...prev, newConfig];
      });
    }
  };

  const updateShiftConfig = async (config: ShiftConfig) => {
    if (!contextManagerId) return;

    const { error } = await supabase.from('shift_configs').upsert({
      manager_id: contextManagerId,
      matutino_start: config.MATUTINO.start,
      matutino_end: config.MATUTINO.end,
      vespertino_start: config.VESPERTINO.start,
      vespertino_end: config.VESPERTINO.end
    }, { onConflict: 'manager_id' });

    if (!error) {
      setAllShiftConfigs(prev => {
        const idx = prev.findIndex(c => c.managerId === contextManagerId);
        const newConf = { ...config, managerId: contextManagerId, id: 'temp' }; // id not critical for local logic
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = newConf;
          return copy;
        }
        return [...prev, newConf];
      });
    }
  };

  const addEmergencyContact = async (name: string, phone: string) => {
    if (!contextManagerId) return;
    const { data, error } = await supabase.from('emergency_contacts').insert({
      manager_id: contextManagerId,
      name,
      phone
    }).select().single();

    if (data && !error) {
      setAllEmergencyContacts(prev => [...prev, {
        id: data.id,
        managerId: data.manager_id,
        name: data.name,
        phone: data.phone
      }]);
    }
  };

  const deleteEmergencyContact = async (id: string) => {
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
    if (!error) {
      setAllEmergencyContacts(prev => prev.filter(c => c.id !== id));
    }
  };


  return (
    <AppContext.Provider value={{
      activities: getVisibleActivities(),
      collaborators: getVisibleCollaborators(),
      managers,
      admins,
      activityTypes,
      currentUser,
      currentDate,
      branchConfig,
      shiftConfig,
      emergencyContacts,
      login, // Now returns Promise<boolean> and takes Email
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