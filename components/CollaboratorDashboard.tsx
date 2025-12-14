import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Collaborator, DayOfWeek } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { getActivityStatus, getCurrentTimeSlot, isLunchTime, timeToMinutes } from '../utils';
import { ClipboardList, Users, Info, CheckCircle, Clock, MapPin, Globe } from 'lucide-react';

interface Props {
  user: Collaborator;
}

type CollabTab = 'AGENDA' | 'TEAM' | 'INFO';

export const CollaboratorDashboard: React.FC<Props> = ({ user }) => {
  const { activities, currentDate, updateActivity, collaborators, branchConfig, emergencyContacts } = useApp();
  const [activeTab, setActiveTab] = useState<CollabTab>('AGENDA');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDate.getDay() as DayOfWeek);

  const MyAgenda = () => {
    // Filter my activities for the selected day
    const myActivities = activities
        .filter(a => a.collaboratorId === user.id && a.day === selectedDay)
        .sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    // Determine current one for highlight
    const currentTimeSlot = getCurrentTimeSlot(currentDate);
    const dayOfWeek = currentDate.getDay();
    const isToday = selectedDay === dayOfWeek;

    const currentAct = isToday ? myActivities.find(a => getActivityStatus(a, currentDate) === 'CURRENT' || getActivityStatus(a, currentDate) === 'LATE') : null;
    
    // Grouping
    const completedActs = myActivities.filter(a => a.completed);
    const upcomingActs = myActivities.filter(a => !a.completed && a !== currentAct);

    return (
        <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {DAYS_OF_WEEK.map((day, idx) => (
                  <button 
                    key={day}
                    onClick={() => setSelectedDay(idx as DayOfWeek)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedDay === idx ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'}`}
                  >
                      {day}
                  </button>
              ))}
            </div>

            {/* Current Activity Highlight */}
            {isToday && currentAct && (
                <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">AHORA</div>
                    <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-2">Actividad Actual ({currentAct.time})</h3>
                    <p className="text-2xl font-bold text-gray-900 mb-4">{currentAct.description}</p>
                    <button 
                        onClick={() => updateActivity(currentAct.id, { completed: true })}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20} /> Marcar como Completada
                    </button>
                </div>
            )}

            {isToday && isLunchTime(currentTimeSlot, user.shift) && (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm text-center">
                    <span className="text-4xl mb-2 block">🍽️</span>
                    <h3 className="text-xl font-bold text-yellow-800">Hora de Comida</h3>
                    <p className="text-yellow-700">Buen provecho, regresa recargado.</p>
                 </div>
            )}

            {/* List */}
            <div className="space-y-3">
                <h4 className="font-bold text-gray-700 flex items-center gap-2"><Clock size={18}/> Agenda del Día</h4>
                
                {upcomingActs.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {upcomingActs.map(act => (
                            <div key={act.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <div className="text-sm font-mono font-bold text-gray-500 w-12">{act.time}</div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{act.description}</p>
                                </div>
                                <button 
                                    onClick={() => isToday && updateActivity(act.id, { completed: true })}
                                    disabled={!isToday}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isToday ? 'border-gray-300 hover:border-green-500 hover:text-green-500' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                                >
                                    <CheckCircle size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {completedActs.length > 0 && (
                    <div className="mt-6">
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Completadas</h5>
                        <div className="opacity-60 bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
                            {completedActs.map(act => (
                                <div key={act.id} className="p-3 flex items-center gap-4">
                                    <div className="text-sm font-mono text-gray-400 w-12 line-through">{act.time}</div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-500 line-through">{act.description}</p>
                                    </div>
                                    <CheckCircle size={16} className="text-green-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {myActivities.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <p>No tienes actividades asignadas para este día.</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const MyTeam = () => {
    const dayOfWeek = currentDate.getDay();
    const currentTimeSlot = getCurrentTimeSlot(currentDate);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Estado del Equipo (En Vivo)</h3>
            <div className="grid grid-cols-1 gap-4">
                {collaborators.filter(c => c.id !== user.id).map(collab => {
                     // Find current activity
                    const todaysActivities = activities.filter(a => a.collaboratorId === collab.id && a.day === dayOfWeek);
                    const currentAct = todaysActivities.find(a => getActivityStatus(a, currentDate) === 'CURRENT' || getActivityStatus(a, currentDate) === 'LATE');
                    const isLunch = isLunchTime(currentTimeSlot, collab.shift);
                    
                    return (
                        <div key={collab.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                                {collab.avatarInitials}
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-900">{collab.name}</h4>
                                    <span className="text-xs text-gray-400">{collab.roleTitle}</span>
                                </div>
                                {isLunch ? (
                                    <p className="text-sm text-yellow-600 font-medium mt-1">🍽️ En hora de comida</p>
                                ) : currentAct ? (
                                    <p className="text-sm text-blue-600 font-medium mt-1">🔨 {currentAct.description}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic mt-1">Disponible / Sin actividad</p>
                                )}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const InfoView = () => {
    if (!branchConfig) return <div className="p-4">Cargando información...</div>;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="text-center pb-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">{branchConfig.name}</h3>
              <div className="mt-2 text-sm text-gray-500 flex flex-col items-center gap-1">
                  <span className="flex items-center gap-1"><MapPin size={14}/> CECO: {branchConfig.ceco}</span>
                  <span className="flex items-center gap-1"><Globe size={14}/> {branchConfig.region} • {branchConfig.territory}</span>
              </div>
          </div>
          
          <div>
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">🚨 Contactos de Emergencia</h4>
              {emergencyContacts.length > 0 ? (
                  <ul className="space-y-3">
                    {emergencyContacts.map(contact => (
                        <li key={contact.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                            <span className="text-gray-900 font-medium text-sm">{contact.name}</span>
                            <a href={`tel:${contact.phone}`} className="text-red-600 font-bold text-sm bg-white px-3 py-1 rounded border border-red-200 shadow-sm">
                                {contact.phone}
                            </a>
                        </li>
                    ))}
                  </ul>
              ) : (
                  <p className="text-sm text-gray-400 italic">No hay contactos configurados por el gerente.</p>
              )}
          </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-24">
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
           <div>
               <h1 className="text-xl font-bold text-gray-900">Hola, {user.name.split(' ')[0]}</h1>
               <p className="text-sm text-gray-500">{user.roleTitle} • {user.shift === 'MATUTINO' ? '☀️' : '🌙'}</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
               {user.avatarInitials}
           </div>
       </div>

       {activeTab === 'AGENDA' && <MyAgenda />}
       {activeTab === 'TEAM' && <MyTeam />}
       {activeTab === 'INFO' && <InfoView />}

       {/* Bottom Navigation */}
       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-20 shadow-lg md:max-w-md md:mx-auto md:rounded-t-xl">
           <button onClick={() => setActiveTab('AGENDA')} className={`flex flex-col items-center gap-1 ${activeTab === 'AGENDA' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
               <ClipboardList size={24} />
               <span className="text-[10px] font-medium">Mi Agenda</span>
           </button>
           <button onClick={() => setActiveTab('TEAM')} className={`flex flex-col items-center gap-1 ${activeTab === 'TEAM' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
               <Users size={24} />
               <span className="text-[10px] font-medium">Equipo</span>
           </button>
           <button onClick={() => setActiveTab('INFO')} className={`flex flex-col items-center gap-1 ${activeTab === 'INFO' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
               <Info size={24} />
               <span className="text-[10px] font-medium">Sucursal</span>
           </button>
       </div>
    </div>
  );
};