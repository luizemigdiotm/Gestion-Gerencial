import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Activity, DayOfWeek, ShiftType, Collaborator, BranchConfig, ShiftConfig, Manager } from '../types';
import { DAYS_OF_WEEK, ALL_TIME_SLOTS } from '../constants';
import { getActivityStatus, getCurrentTimeSlot, isLunchTime, timeToMinutes } from '../utils';
import { Modal } from './Modal';
import { Activity as ActivityIcon, Calendar, BarChart2, Plus, Edit2, Trash2, Clock, CheckCircle, AlertTriangle, Coffee, Briefcase, User, Settings, Save, XCircle, MapPin, Building, Globe, Phone, TrendingUp, Award, AlertCircle, PieChart, Star, Key, Shield, UserPlus, Filter } from 'lucide-react';

type ManagerTab = 'LIVE' | 'PLANNING' | 'STATS' | 'CONFIG';
type TimeRange = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export const ManagerDashboard: React.FC = () => {
  const { 
    collaborators, activities, currentDate, activityTypes, branchConfig, shiftConfig, emergencyContacts, currentUser, managers,
    addActivity, updateActivity, deleteActivity, 
    addCollaborator, updateCollaborator, deleteCollaborator,
    addManager, updateManager, deleteManager,
    addActivityType, deleteActivityType,
    updateBranchConfig, updateShiftConfig,
    addEmergencyContact, deleteEmergencyContact
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<ManagerTab>('LIVE');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDate.getDay() as DayOfWeek);
  const isAdmin = currentUser?.role === 'ADMIN';
  
  // Modal State for Editing Activities
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    collaboratorId: 0,
    time: '',
    endTime: '',
    description: ''
  });

  const handleOpenModal = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      collaboratorId: activity.collaboratorId,
      time: activity.time,
      endTime: activity.endTime || activity.time, // Fallback
      description: activity.description
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (editingActivity) {
      updateActivity(editingActivity.id, {
        collaboratorId: Number(formData.collaboratorId),
        time: formData.time,
        endTime: formData.endTime,
        description: formData.description
      });
      setIsModalOpen(false);
    }
  };

  // --- SUB-COMPONENTS FOR VIEWS ---

  const LiveView = () => {
    const dayOfWeek = currentDate.getDay();
    const currentTimeSlot = getCurrentTimeSlot(currentDate);
    const currentMinutes = timeToMinutes(currentTimeSlot);

    // Safeguard against missing config
    if (!shiftConfig || !shiftConfig.MATUTINO || !shiftConfig.VESPERTINO) {
        return <div className="p-8 text-center text-gray-500">Cargando configuración de horarios...</div>;
    }

    // Dynamic Shift Logic based on Config
    const matStart = timeToMinutes(shiftConfig.MATUTINO.start);
    const matEnd = timeToMinutes(shiftConfig.MATUTINO.end);
    const vesStart = timeToMinutes(shiftConfig.VESPERTINO.start);
    const vesEnd = timeToMinutes(shiftConfig.VESPERTINO.end);

    let activeShiftLabel = "FUERA DE HORARIO";
    // Check overlap first
    if (currentMinutes >= vesStart && currentMinutes < matEnd) {
        activeShiftLabel = "☀️ MATUTINO / 🌙 VESPERTINO (TRASLAPE)";
    } else if (currentMinutes >= matStart && currentMinutes < matEnd) {
        activeShiftLabel = "☀️ MATUTINO";
    } else if (currentMinutes >= vesStart && currentMinutes < vesEnd) {
        activeShiftLabel = "🌙 VESPERTINO";
    }

    return (
      <div className="space-y-6">
        {/* Branch Header Info */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Building size={24} className="text-blue-200"/> 
                        {branchConfig.name}
                        {isAdmin && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">MODO ADMIN</span>}
                    </h1>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-blue-100">
                        <span className="flex items-center gap-1"><MapPin size={14}/> CECO: {branchConfig.ceco}</span>
                        <span className="flex items-center gap-1"><Globe size={14}/> Región: {branchConfig.region}</span>
                        <span className="flex items-center gap-1"><MapPin size={14}/> Territorio: {branchConfig.territory}</span>
                    </div>
                </div>
                <div className="text-right bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <p className="text-2xl font-mono font-bold">{currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs uppercase tracking-widest opacity-80">{DAYS_OF_WEEK[dayOfWeek]}</p>
                </div>
            </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Turno Activo</p>
            <p className="text-lg font-bold text-blue-700">{activeShiftLabel}</p>
          </div>
          <div className="flex gap-4 text-sm">
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> En tiempo</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Atrasado</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> En proceso</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {collaborators.length === 0 && (
             <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-xl">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <UserPlus size={40} className="text-gray-300"/>
                 </div>
                 <h3 className="text-xl font-bold text-gray-600 mb-2">No tienes colaboradores asignados</h3>
                 <p className="text-sm text-center max-w-md mb-6 px-4">
                    Parece que tu equipo está vacío. Registra a tus colaboradores para comenzar a asignar actividades y monitorear su desempeño.
                 </p>
                 <button 
                    onClick={() => setActiveTab('CONFIG')} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                 >
                    <Settings size={18} /> Ir a Configuración
                 </button>
             </div>
          )}
          {collaborators.map(collab => {
            const todaysActivities = activities.filter(a => a.collaboratorId === collab.id && a.day === dayOfWeek);
            const currentAct = todaysActivities.find(a => getActivityStatus(a, currentDate) === 'CURRENT' || getActivityStatus(a, currentDate) === 'LATE');
            const nextAct = todaysActivities
              .filter(a => timeToMinutes(a.time) > timeToMinutes(currentTimeSlot))
              .sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time))[0];
            
            const isLunch = isLunchTime(currentTimeSlot, collab.shift);
            
            let statusColor = "border-gray-200";
            let statusBg = "bg-white";

            if (currentAct) {
                const status = getActivityStatus(currentAct, currentDate);
                if (status === 'LATE') { statusColor = "border-red-500"; statusBg = "bg-red-50"; }
                else if (status === 'CURRENT') { statusColor = "border-yellow-400"; statusBg = "bg-yellow-50"; }
            }

            // If admin, show which manager owns this collaborator
            const ownerManager = isAdmin ? managers.find(m => m.id === collab.managerId) : null;

            return (
              <div key={collab.id} className={`border-l-4 rounded-r-lg shadow-sm p-5 ${statusColor} ${statusBg} transition-all`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900">{collab.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{collab.roleTitle}</span>
                        {ownerManager && <p className="text-[10px] text-blue-600 mt-1">Jefe: {ownerManager.name}</p>}
                    </div>
                    {collab.shift === 'MATUTINO' ? <span className="text-xl">☀️</span> : <span className="text-xl">🌙</span>}
                </div>

                {isLunch ? (
                    <div className="flex flex-col items-center justify-center py-6 text-yellow-700">
                        <Coffee size={32} className="mb-2"/>
                        <span className="font-bold">Hora de Comida</span>
                        <span className="text-sm">No molestar</span>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Actividad Actual</p>
                            {currentAct ? (
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-800">{currentAct.description}</p>
                                        <p className="text-sm text-gray-500">{currentAct.time} - {currentAct.endTime}</p>
                                    </div>
                                    {getActivityStatus(currentAct, currentDate) === 'LATE' && (
                                        <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400 italic">Sin actividad asignada</p>
                            )}
                        </div>
                        
                        <div className="pt-3 border-t border-gray-200/50">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Siguiente</p>
                            {nextAct ? (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600 truncate mr-2">{nextAct.description}</span>
                                    <span className="text-sm font-mono text-gray-500">{nextAct.time}</span>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400">Fin del turno</span>
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                             <button 
                                onClick={() => currentAct && updateActivity(currentAct.id, { completed: true })}
                                disabled={!currentAct}
                                className={`flex-1 text-xs bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors ${!currentAct ? 'opacity-50 cursor-not-allowed' : ''}`}
                             >
                                <CheckCircle size={14} /> Completar
                             </button>
                             <button 
                                onClick={() => currentAct && handleOpenModal(currentAct)} 
                                disabled={!currentAct} 
                                className={`flex-1 text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded flex items-center justify-center gap-2 transition-colors ${!currentAct ? 'opacity-50 cursor-not-allowed' : ''}`}
                             >
                                <Edit2 size={14} /> Editar
                             </button>
                        </div>
                    </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const PlanningView = () => {
    // Start form
    const [selectedActivityType, setSelectedActivityType] = useState(activityTypes[0] || '');
    const [selectedCollabId, setSelectedCollabId] = useState<number>(collaborators[0]?.id || 0);
    const [startTime, setStartTime] = useState<string>('08:00');
    const [endTime, setEndTime] = useState<string>('08:30');

    // Filter activities for the selected day
    const dailyActivities = activities
        .filter(a => a.day === selectedDay)
        .sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    const handleCreateAssignment = () => {
        if (!selectedActivityType) return;
        
        // Validation: End time must be > Start time
        if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
            alert("La hora de fin debe ser posterior a la hora de inicio");
            return;
        }

        addActivity({
            collaboratorId: selectedCollabId,
            day: selectedDay,
            time: startTime,
            endTime: endTime,
            description: selectedActivityType,
            completed: false
        });
    };

    if (collaborators.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 bg-white border rounded-xl shadow-sm p-8">
                 <UserPlus size={48} className="mb-4 opacity-30"/>
                 <h3 className="text-lg font-bold text-gray-600">Se requieren colaboradores</h3>
                 <p className="text-sm mb-4">No puedes planificar actividades sin un equipo.</p>
                 <button onClick={() => setActiveTab('CONFIG')} className="text-blue-600 font-medium hover:underline">
                    Ir a Configuración →
                 </button>
             </div>
        )
    }

    return (
      <div className="space-y-6">
        {/* Day Selector */}
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-x-auto">
            <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day, idx) => (
                    <button 
                        key={day}
                        onClick={() => setSelectedDay(idx as DayOfWeek)}
                        className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedDay === idx ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* LEFT COLUMN: NEW ASSIGNMENT FORM */}
            <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Plus className="text-blue-600" size={20}/> Nueva Asignación
                </h3>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Actividad (Catálogo)</label>
                        <select 
                            value={selectedActivityType}
                            onChange={(e) => setSelectedActivityType(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            {activityTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        {activityTypes.length === 0 && <p className="text-xs text-red-500 mt-1">Agrega actividades en la pestaña Configuración</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Asignar A</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400" size={16} />
                            <select 
                                value={selectedCollabId}
                                onChange={(e) => setSelectedCollabId(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                            >
                                {collaborators.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.shift === 'MATUTINO' ? 'Mat' : 'Vesp'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Inicio</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <select 
                                    value={startTime}
                                    onChange={(e) => {
                                        setStartTime(e.target.value);
                                        // Auto adjust end time to start + 30m if needed
                                        // const idx = ALL_TIME_SLOTS.indexOf(e.target.value);
                                        // if (idx !== -1 && idx < ALL_TIME_SLOTS.length - 1) setEndTime(ALL_TIME_SLOTS[idx+1]);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                >
                                    {ALL_TIME_SLOTS.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fin</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <select 
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                >
                                    {ALL_TIME_SLOTS.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleCreateAssignment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                    >
                        <Plus size={20} /> Asignar Tarea
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: AGENDA LIST */}
            <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Agenda del Día</h3>
                    <div className="text-sm text-gray-500">{dailyActivities.length} actividades programadas</div>
                </div>

                {dailyActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                        <Briefcase size={48} className="mb-4 opacity-20" />
                        <p>No hay actividades programadas.</p>
                        <p className="text-sm">Usa el formulario para agregar la primera.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {dailyActivities.map(activity => {
                            const collab = collaborators.find(c => c.id === activity.collaboratorId);
                            const isLunch = isLunchTime(activity.time, collab?.shift || 'MATUTINO');

                            return (
                                <div key={activity.id} className={`group flex items-center p-4 rounded-xl border transition-all hover:shadow-md ${activity.completed ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                                    {/* Time Column */}
                                    <div className="w-24 flex flex-col items-center justify-center border-r border-gray-100 pr-4 mr-4">
                                        <span className="text-lg font-bold text-gray-800">{activity.time}</span>
                                        <span className="text-xs text-gray-400">{activity.endTime || '?'}</span>
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-base ${activity.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                            {activity.description}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                {collab?.avatarInitials}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-600">{collab?.name}</span>
                                                <span className="text-[10px] text-gray-400">{collab?.roleTitle} • {collab?.shift}</span>
                                            </div>
                                            {isLunch && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-2">Comida</span>}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleOpenModal(activity)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => deleteActivity(activity.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  };

  const StatsView = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>('DAY');

    if (collaborators.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 bg-white border rounded-xl shadow-sm p-8">
                 <BarChart2 size={48} className="mb-4 opacity-30"/>
                 <h3 className="text-lg font-bold text-gray-600">No hay datos para mostrar</h3>
                 <p className="text-sm mb-4">Agrega colaboradores para ver sus estadísticas.</p>
                 <button onClick={() => setActiveTab('CONFIG')} className="text-blue-600 font-medium hover:underline">
                    Ir a Configuración →
                 </button>
             </div>
        );
    }

    // Helper to calculate stats per collaborator
    const statsData = useMemo(() => {
        return collaborators.map(collab => {
            // Filter by collaborator AND time range
            const filteredActivities = activities.filter(a => {
                if (a.collaboratorId !== collab.id) return false;
                if (timeRange === 'DAY') return a.day === currentDate.getDay();
                // For WEEK, MONTH, YEAR in this MVP we assume the current data represents the sample
                // In a real app, you would check a.date vs range.
                return true; 
            });

            const total = filteredActivities.length;
            const completed = filteredActivities.filter(a => a.completed).length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Most executed (Frequency)
            const counts: Record<string, number> = {};
            filteredActivities.forEach(a => {
                counts[a.description] = (counts[a.description] || 0) + 1;
            });
            const mostExecuted = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

            // Best Executed (Highest completion rate for a type)
            // Group by description -> count total vs completed
            const typeStats: Record<string, {total: number, completed: number}> = {};
            filteredActivities.forEach(a => {
                if(!typeStats[a.description]) typeStats[a.description] = {total: 0, completed: 0};
                typeStats[a.description].total++;
                if(a.completed) typeStats[a.description].completed++;
            });
            
            // Sort by completion rate, then by total volume
            const bestExecuted = Object.entries(typeStats)
                .sort((a, b) => {
                    const rateA = a[1].completed / a[1].total;
                    const rateB = b[1].completed / b[1].total;
                    if (rateA === rateB) return b[1].total - a[1].total;
                    return rateB - rateA;
                })[0]?.[0] || 'N/A';

            return {
                ...collab,
                total,
                completed,
                percentage,
                mostExecuted,
                bestExecuted
            };
        });
    }, [collaborators, activities, timeRange, currentDate]);

    // Global Stats
    const globalTotal = statsData.reduce((acc, curr) => acc + curr.total, 0);
    const globalCompleted = statsData.reduce((acc, curr) => acc + curr.completed, 0);
    const globalPercentage = globalTotal > 0 ? Math.round((globalCompleted / globalTotal) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header / Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                        <PieChart size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Rendimiento del Equipo</h2>
                        <p className="text-sm text-gray-500">Cumplimiento Global: <span className={`font-bold ${globalPercentage > 80 ? 'text-green-600' : 'text-blue-600'}`}>{globalPercentage}%</span></p>
                    </div>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as TimeRange[]).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timeRange === range ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {range === 'DAY' ? 'HOY' : range === 'WEEK' ? 'SEMANA' : range === 'MONTH' ? 'MES' : 'AÑO'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Collaborator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statsData.map(stat => {
                    let alertType: 'success' | 'warning' | 'neutral' = 'neutral';
                    let alertMessage = "Desempeño Regular";
                    
                    if (stat.percentage >= 90) {
                        alertType = 'success';
                        alertMessage = "🏆 ¡Excelente Desempeño!";
                    } else if (stat.total > 0 && stat.percentage < 60) {
                        alertType = 'warning';
                        alertMessage = "⚠️ Requiere Atención";
                    } else {
                        alertMessage = "✅ Buen Desempeño";
                    }

                    return (
                        <div key={stat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Card Header */}
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600">
                                        {stat.avatarInitials}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{stat.name}</h3>
                                        <p className="text-xs text-gray-500">{stat.roleTitle}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
                                    ${alertType === 'success' ? 'bg-green-100 text-green-700' : 
                                      alertType === 'warning' ? 'bg-red-100 text-red-700' : 
                                      'bg-blue-50 text-blue-700'}`}>
                                    {alertType === 'success' && <Award size={14} />}
                                    {alertType === 'warning' && <AlertCircle size={14} />}
                                    {alertMessage}
                                </div>
                            </div>

                            {/* Metrics Body */}
                            <div className="p-5 space-y-5">
                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Tasa de Cumplimiento</span>
                                        <span className="font-bold text-gray-800">{stat.completed}/{stat.total} ({stat.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className={`h-2.5 rounded-full transition-all duration-500 ${
                                                stat.percentage > 85 ? 'bg-green-500' : 
                                                stat.percentage < 50 ? 'bg-red-500' : 'bg-blue-500'
                                            }`} 
                                            style={{ width: `${stat.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Detailed Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={16} className="text-blue-600" />
                                            <span className="text-xs font-bold text-blue-800 uppercase">Más Ejecuta</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 truncate" title={stat.mostExecuted}>
                                            {stat.mostExecuted}
                                        </p>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star size={16} className="text-yellow-600" />
                                            <span className="text-xs font-bold text-yellow-800 uppercase">Mejor Ejecuta</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 truncate" title={stat.bestExecuted}>
                                            {stat.bestExecuted}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const ConfigView = () => {
    // Local state for forms
    const [newActivityType, setNewActivityType] = useState('');
    const [localBranchConfig, setLocalBranchConfig] = useState<BranchConfig>(branchConfig);
    const [localShiftConfig, setLocalShiftConfig] = useState<ShiftConfig>(shiftConfig);
    
    // Emergency Contact State
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');

    // Manager Form State
    const [managerForm, setManagerForm] = useState<{id?: number, name: string, employeeNumber: string} | null>(null);

    // Collaborator Form State
    const [collabForm, setCollabForm] = useState<{id?: number, name: string, roleTitle: string, shift: ShiftType, employeeNumber: string, managerId?: number} | null>(null);

    // Filter State for Admin Collab List
    const [managerFilter, setManagerFilter] = useState<number | 'ALL'>('ALL');

    // Update local config state when global config changes (e.g. context switching)
    useEffect(() => {
        if(branchConfig) setLocalBranchConfig(branchConfig);
        if(shiftConfig) setLocalShiftConfig(shiftConfig);
    }, [branchConfig, shiftConfig]);

    const handleSaveBranchConfig = () => {
        updateBranchConfig(localBranchConfig);
        alert("Configuración de sucursal guardada");
    };

    const handleSaveShiftConfig = () => {
        updateShiftConfig(localShiftConfig);
        alert("Configuración de horarios guardada");
    };

    const handleAddContact = () => {
        if(newContactName && newContactPhone) {
            addEmergencyContact(newContactName, newContactPhone);
            setNewContactName('');
            setNewContactPhone('');
        }
    };

    const handleSaveManager = () => {
        if (!managerForm || !managerForm.name || !managerForm.employeeNumber) return;
        
        if (managerForm.id) {
            updateManager(managerForm.id, managerForm);
        } else {
            addManager(managerForm);
        }
        setManagerForm(null);
    };

    const handleSaveCollab = () => {
        if (!collabForm) return;
        if (!collabForm.name || !collabForm.roleTitle || !collabForm.employeeNumber) {
            alert("Por favor completa todos los campos del colaborador");
            return;
        }

        if (isAdmin && !collabForm.managerId) {
             alert("Como administrador, debes asignar un Gerente al colaborador.");
             return;
        }

        if (collabForm.id) {
            updateCollaborator(collabForm.id, collabForm);
        } else {
            addCollaborator(collabForm);
        }
        setCollabForm(null);
    };

    const handleEditCollab = (c: Collaborator) => {
        setCollabForm({
            id: c.id,
            name: c.name,
            roleTitle: c.roleTitle,
            shift: c.shift,
            employeeNumber: c.employeeNumber || '',
            managerId: c.managerId
        });
    };

    const handleEditManager = (m: Manager) => {
        setManagerForm({
            id: m.id,
            name: m.name,
            employeeNumber: m.employeeNumber
        });
    };

    // Filter logic for table
    const filteredCollaboratorsList = collaborators.filter(c => {
        if (managerFilter === 'ALL') return true;
        return c.managerId === managerFilter;
    });

    if (!localShiftConfig || !localShiftConfig.MATUTINO) return <div>Cargando...</div>;

    return (
        <div className="space-y-8 pb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                Configuración del Sistema
                {isAdmin && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">ADMIN ACCESS</span>}
            </h2>

            {/* ADMIN ONLY: MANAGERS MANAGEMENT */}
            {isAdmin && (
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                                <Shield size={20} className="text-red-600"/> Gestión de Gerentes (Admin)
                            </h3>
                            {!managerForm && (
                                <button 
                                    onClick={() => setManagerForm({name: '', employeeNumber: ''})}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus size={16}/> Nuevo Gerente
                                </button>
                            )}
                        </div>

                         {/* Manager Form */}
                        {managerForm && (
                            <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-100 animate-fade-in-up">
                                <h4 className="font-bold text-red-800 mb-3">{managerForm.id ? 'Editar Gerente' : 'Nuevo Gerente'}</h4>
                                
                                {!managerForm.id && (
                                    <div className="bg-yellow-100 text-yellow-800 text-xs p-2 mb-3 rounded border border-yellow-200">
                                        Nota: La contraseña inicial será idéntica al número de empleado.
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <input 
                                        type="text" placeholder="Nombre del Gerente"
                                        value={managerForm.name}
                                        onChange={e => setManagerForm({...managerForm, name: e.target.value})}
                                        className="border border-red-300 rounded-md p-2"
                                    />
                                    <input 
                                        type="text" placeholder="Usuario Login (Empleado)"
                                        value={managerForm.employeeNumber}
                                        onChange={e => setManagerForm({...managerForm, employeeNumber: e.target.value})}
                                        className="border border-red-300 rounded-md p-2"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setManagerForm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md">Cancelar</button>
                                    <button onClick={handleSaveManager} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Guardar Gerente</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {managers.map(m => (
                                 <div key={m.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50 hover:shadow-sm transition-shadow">
                                     <div>
                                         <p className="font-bold text-gray-900">{m.name}</p>
                                         <p className="text-xs text-gray-500">ID: {m.employeeNumber}</p>
                                     </div>
                                     <div className="flex gap-1">
                                         <button onClick={() => handleEditManager(m)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit2 size={16}/></button>
                                         <button onClick={() => deleteManager(m.id)} className="text-red-400 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION 0: BRANCH INFO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building size={20} className="text-blue-600"/> Datos de Sucursal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nombre Sucursal</label>
                        <input 
                            type="text" 
                            value={localBranchConfig.name}
                            onChange={(e) => setLocalBranchConfig({...localBranchConfig, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">CECO</label>
                        <input 
                            type="text" 
                            value={localBranchConfig.ceco}
                            onChange={(e) => setLocalBranchConfig({...localBranchConfig, ceco: e.target.value})}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Región</label>
                        <input 
                            type="text" 
                            value={localBranchConfig.region}
                            onChange={(e) => setLocalBranchConfig({...localBranchConfig, region: e.target.value})}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Territorio</label>
                        <input 
                            type="text" 
                            value={localBranchConfig.territory}
                            onChange={(e) => setLocalBranchConfig({...localBranchConfig, territory: e.target.value})}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSaveBranchConfig} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                        <Save size={16}/> Guardar Datos
                    </button>
                </div>
            </div>

            {/* SECTION 0.5: SHIFT SCHEDULES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-blue-600"/> Configuración de Horarios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Matutino */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">☀️ Turno Matutino</h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-yellow-700 mb-1">Inicio</label>
                                <select 
                                    value={localShiftConfig.MATUTINO.start}
                                    onChange={(e) => setLocalShiftConfig({...localShiftConfig, MATUTINO: {...localShiftConfig.MATUTINO, start: e.target.value}})}
                                    className="w-full border-gray-300 rounded-md p-2 text-sm"
                                >
                                    {ALL_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-yellow-700 mb-1">Fin</label>
                                <select 
                                    value={localShiftConfig.MATUTINO.end}
                                    onChange={(e) => setLocalShiftConfig({...localShiftConfig, MATUTINO: {...localShiftConfig.MATUTINO, end: e.target.value}})}
                                    className="w-full border-gray-300 rounded-md p-2 text-sm"
                                >
                                    {ALL_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Vespertino */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">🌙 Turno Vespertino</h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-indigo-700 mb-1">Inicio</label>
                                <select 
                                    value={localShiftConfig.VESPERTINO.start}
                                    onChange={(e) => setLocalShiftConfig({...localShiftConfig, VESPERTINO: {...localShiftConfig.VESPERTINO, start: e.target.value}})}
                                    className="w-full border-gray-300 rounded-md p-2 text-sm"
                                >
                                    {ALL_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-indigo-700 mb-1">Fin</label>
                                <select 
                                    value={localShiftConfig.VESPERTINO.end}
                                    onChange={(e) => setLocalShiftConfig({...localShiftConfig, VESPERTINO: {...localShiftConfig.VESPERTINO, end: e.target.value}})}
                                    className="w-full border-gray-300 rounded-md p-2 text-sm"
                                >
                                    {ALL_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSaveShiftConfig} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                        <Save size={16}/> Guardar Horarios
                    </button>
                </div>
            </div>

            {/* SECTION 0.7: EMERGENCY CONTACTS */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone size={20} className="text-blue-600"/> Contactos de Emergencia
                </h3>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input 
                        type="text" 
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Nombre / Área (ej: Policía, Soporte)"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input 
                        type="text" 
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="Número de Teléfono"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        onClick={handleAddContact}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                        Agregar
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {emergencyContacts.map(contact => (
                        <div key={contact.id} className="bg-red-50 text-red-900 px-4 py-3 rounded-lg flex items-center justify-between border border-red-100">
                            <div>
                                <p className="font-bold text-sm">{contact.name}</p>
                                <p className="text-xs">{contact.phone}</p>
                            </div>
                            <button 
                                onClick={() => deleteEmergencyContact(contact.id)}
                                className="text-red-300 hover:text-red-500 transition-colors"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 1: ACTIVITY TYPES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-600"/> Catálogo de Actividades
                </h3>
                <div className="flex gap-4 mb-6">
                    <input 
                        type="text" 
                        value={newActivityType}
                        onChange={(e) => setNewActivityType(e.target.value)}
                        placeholder="Nueva actividad (ej: Corte de Caja)"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        onClick={() => {
                            if(newActivityType) { addActivityType(newActivityType); setNewActivityType(''); }
                        }}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                        Agregar
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activityTypes.map(type => (
                        <div key={type} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 group">
                            {type}
                            <button 
                                onClick={() => deleteActivityType(type)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XCircle size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 2: COLLABORATORS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <User size={20} className="text-blue-600"/> Gestión de Colaboradores
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        {/* ADMIN: FILTER BY MANAGER */}
                        {isAdmin && (
                            <div className="relative">
                                <Filter className="absolute left-2 top-2.5 text-gray-400" size={16}/>
                                <select 
                                    value={managerFilter}
                                    onChange={(e) => setManagerFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                    className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48"
                                >
                                    <option value="ALL">Todos los Gerentes</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {!collabForm && (
                            <button 
                                onClick={() => setCollabForm({name: '', roleTitle: '', shift: 'MATUTINO', employeeNumber: '', managerId: isAdmin ? managers[0]?.id : undefined})}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16}/> Nuevo Colaborador
                            </button>
                        )}
                    </div>
                </div>

                {/* Collaborator Form */}
                {collabForm && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 animate-fade-in-up">
                        <h4 className="font-bold text-blue-800 mb-3">{collabForm.id ? 'Editar Colaborador' : 'Nuevo Colaborador'}</h4>
                        
                        {/* ALERT FOR PASSWORD */}
                        {!collabForm.id && (
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 text-sm" role="alert">
                                <p className="font-bold">Nota de Seguridad:</p>
                                <p>Se asignará la contraseña temporal <strong>"123"</strong>. El colaborador deberá cambiarla en su primer inicio de sesión.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input 
                                type="text" placeholder="Nombre Completo"
                                value={collabForm.name}
                                onChange={e => setCollabForm({...collabForm, name: e.target.value})}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <input 
                                type="text" placeholder="Puesto / Rol"
                                value={collabForm.roleTitle}
                                onChange={e => setCollabForm({...collabForm, roleTitle: e.target.value})}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <input 
                                type="text" placeholder="No. Empleado (Login)"
                                value={collabForm.employeeNumber}
                                onChange={e => setCollabForm({...collabForm, employeeNumber: e.target.value})}
                                className="border border-gray-300 rounded-md p-2"
                            />
                            <select
                                value={collabForm.shift}
                                onChange={e => setCollabForm({...collabForm, shift: e.target.value as ShiftType})}
                                className="border border-gray-300 rounded-md p-2 bg-white"
                            >
                                <option value="MATUTINO">Matutino</option>
                                <option value="VESPERTINO">Vespertino</option>
                            </select>
                            
                            {/* ADMIN ONLY: ASSIGN MANAGER */}
                            {isAdmin && (
                                <div className="md:col-span-2 bg-white p-3 rounded border border-gray-300">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asignar a Gerente</label>
                                    <select
                                        value={collabForm.managerId || ''}
                                        onChange={e => setCollabForm({...collabForm, managerId: Number(e.target.value)})}
                                        className="w-full border-gray-300 rounded-md p-2 bg-gray-50"
                                    >
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setCollabForm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md">Cancelar</button>
                            <button onClick={handleSaveCollab} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
                        </div>
                    </div>
                )}

                {/* Collaborators List */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-3">Empleado</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3">Turno</th>
                                {isAdmin && <th className="p-3">Gerente</th>}
                                <th className="p-3">ID Login</th>
                                <th className="p-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCollaboratorsList.length > 0 ? (
                                filteredCollaboratorsList.map(c => {
                                    // Find manager name if admin
                                    const mgr = isAdmin ? managers.find(m => m.id === c.managerId) : null;
                                    return (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{c.name}</td>
                                        <td className="p-3 text-gray-600">{c.roleTitle}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.shift === 'MATUTINO' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {c.shift}
                                            </span>
                                        </td>
                                        {isAdmin && <td className="p-3 text-sm text-blue-600">{mgr?.name || 'Sin Asignar'}</td>}
                                        <td className="p-3 text-gray-400 font-mono text-xs">{c.employeeNumber}</td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleEditCollab(c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteCollaborator(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md ml-1"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-400 italic">
                                        No se encontraron colaboradores para el filtro seleccionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {isAdmin ? 'Panel de Administración' : 'Panel del Gerente'}
                {isAdmin && <Shield size={24} className="text-red-500" />}
            </h1>
            <p className="text-gray-500 text-sm">Gestión de Actividades {isAdmin && 'Global'}</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200 overflow-x-auto w-full md:w-auto">
            <button onClick={() => setActiveTab('LIVE')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'LIVE' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                <div className="flex items-center justify-center gap-2"><ActivityIcon size={16}/> En Vivo</div>
            </button>
            <button onClick={() => setActiveTab('PLANNING')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'PLANNING' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                <div className="flex items-center justify-center gap-2"><Calendar size={16}/> Planificación</div>
            </button>
            <button onClick={() => setActiveTab('STATS')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'STATS' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                <div className="flex items-center justify-center gap-2"><BarChart2 size={16}/> Stats</div>
            </button>
            <button onClick={() => setActiveTab('CONFIG')} className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'CONFIG' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                <div className="flex items-center justify-center gap-2"><Settings size={16}/> Config</div>
            </button>
        </div>
      </div>

      {activeTab === 'LIVE' && <LiveView />}
      {activeTab === 'PLANNING' && <PlanningView />}
      {activeTab === 'STATS' && <StatsView />}
      {activeTab === 'CONFIG' && <ConfigView />}

      {/* Reusable Modal Form (Only used for Edit in Live view or List view now) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Actividad">
         <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                <select 
                    value={formData.collaboratorId} 
                    onChange={e => setFormData({...formData, collaboratorId: Number(e.target.value)})}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                >
                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                    <select 
                        value={formData.time} 
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    >
                        {ALL_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                    <select 
                        value={formData.endTime} 
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    >
                        {ALL_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actividad</label>
                <select
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                >
                     {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Cancelar</button>
                <button onClick={handleSaveModal} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Cambios</button>
            </div>
         </div>
      </Modal>

    </div>
  );
};