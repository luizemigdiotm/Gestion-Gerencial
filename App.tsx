import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { ManagerDashboard } from './components/ManagerDashboard';
import { CollaboratorDashboard } from './components/CollaboratorDashboard';
import { LogOut, Lock, User, Key, Shield } from 'lucide-react';
import { DAYS_OF_WEEK } from './constants';
import { Collaborator } from './types';

const DebugControls = () => {
    const { currentDate, setSimulatedDate } = useApp();

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const newDate = new Date(currentDate);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        setSimulatedDate(newDate);
    };

    const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDayIndex = Number(e.target.value);
        const newDate = new Date(currentDate);
        const currentDayIndex = newDate.getDay();
        const diff = newDayIndex - currentDayIndex;
        newDate.setDate(newDate.getDate() + diff);
        setSimulatedDate(newDate);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg opacity-90 hover:opacity-100 transition-opacity text-xs w-64">
            <h4 className="font-bold mb-2 text-yellow-400 uppercase tracking-wider">🛠️ Debug / Simulation</h4>
            <div className="space-y-2">
                <div>
                    <label className="block text-gray-400 mb-1">Time Travel:</label>
                    <input
                        type="time"
                        value={currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        onChange={handleTimeChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1"
                    />
                </div>
                <div>
                    <label className="block text-gray-400 mb-1">Day Travel:</label>
                    <select
                        value={currentDate.getDay()}
                        onChange={handleDayChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1"
                    >
                        {DAYS_OF_WEEK.map((day, idx) => (
                            <option key={day} value={idx}>{day}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

// --- AUTH COMPONENTS ---

const LoginScreen = () => {
    const { login } = useApp();
    const [empNum, setEmpNum] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [isAdminMode, setIsAdminMode] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // The backend logic is the same (login checks all roles), but UI shows different intent
        if (login(empNum, pass)) {
            setError('');
        } else {
            setError('Credenciales inválidas. Verifica tu número de empleado.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className={`bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in-up transition-all ${isAdminMode ? 'border-t-4 border-red-600' : ''}`}>
                <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white transition-colors ${isAdminMode ? 'bg-red-600' : 'bg-blue-600'}`}>
                        {isAdminMode ? <Shield size={32} /> : <Lock size={32} />}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestor Banco</h1>
                    <p className="text-gray-500">
                        {isAdminMode ? 'Acceso Administrativo' : 'Inicia sesión para continuar'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isAdminMode ? 'Usuario Admin' : 'Número de Empleado'}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={empNum}
                                onChange={(e) => setEmpNum(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none ${isAdminMode ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                placeholder={isAdminMode ? "admin" : "Ej: EMP001"}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="password"
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none ${isAdminMode ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                placeholder="••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">{error}</p>}

                    <button type="submit" className={`w-full text-white py-2.5 rounded-lg font-medium transition-colors ${isAdminMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isAdminMode ? 'Ingresar como Admin' : 'Ingresar'}
                    </button>

                    <div className="flex justify-center mt-4">
                        <button
                            type="button"
                            onClick={() => { setIsAdminMode(!isAdminMode); setError(''); setEmpNum(''); setPass(''); }}
                            className="text-sm text-gray-500 hover:text-gray-800 underline"
                        >
                            {isAdminMode ? '← Volver al acceso normal' : 'Entrar como Administrador'}
                        </button>
                    </div>

                    <div className="mt-4 text-center text-xs text-gray-400">
                        <p>Admin Demo: admin / root</p>
                        <p>Gerente Demo: ADMIN01 / admin</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ChangePasswordScreen = () => {
    const { changePassword, logout } = useApp();
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres.');
            return;
        }
        if (newPass !== confirmPass) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        changePassword(newPass);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in-up border-t-4 border-yellow-400">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Primer Acceso</h1>
                    <p className="text-gray-500 text-sm mt-1">Por seguridad, debes personalizar tu contraseña.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                        <input
                            type="password"
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                        <input
                            type="password"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button type="submit" className="w-full bg-yellow-400 text-yellow-900 py-2.5 rounded-lg hover:bg-yellow-500 font-bold transition-colors">
                        Guardar y Continuar
                    </button>
                    <button type="button" onClick={logout} className="w-full text-gray-500 text-sm hover:text-gray-700">
                        Cancelar y Salir
                    </button>
                </form>
            </div>
        </div>
    );
};

const Main = () => {
    const { currentUser, logout } = useApp();

    // 1. Not Logged In
    if (!currentUser) {
        return <LoginScreen />;
    }

    // 2. First Login (Change Password)
    if (currentUser.isFirstLogin) {
        return <ChangePasswordScreen />;
    }

    // 3. Authenticated Dashboard
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-blue-600">Gestor Banco</span>
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">MVP</span>
                            {currentUser.role === 'ADMIN' && (
                                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <Shield size={10} /> ADMIN
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-900">
                                    {currentUser.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {currentUser.role === 'MANAGER' ? 'Gerente' : currentUser.role === 'ADMIN' ? 'Administrador' : (currentUser as Collaborator).roleTitle}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {currentUser.role === 'COLLABORATOR' ? (
                    <CollaboratorDashboard user={currentUser as Collaborator} />
                ) : (
                    // Manager and Admin share the Dashboard component, logic inside handles permissions
                    <ManagerDashboard />
                )}
            </main>

            <DebugControls />
        </div>
    );
};

export default function App() {
    return (
        <AppProvider>
            <Main />
        </AppProvider>
    );
}