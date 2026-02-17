import React, { useState, useEffect } from 'react';
import { api } from './services/api';

// Screen Components
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import ApelScreen from './screens/ApelScreen';
import ActivityScreen from './screens/ActivityScreen';
import GeneratorScreen from './screens/GeneratorScreen';
import ProfileScreen from './screens/ProfileScreen';
import StatisticsScreen from './screens/StatisticsScreen';

const App = () => {
    // --- User & Screen State ---
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('sipola_user');
            const parsed = saved ? JSON.parse(saved) : null;
            // Legacy session validation: must have ID for Supabase updates
            if (parsed && !parsed.id) return null;
            return parsed;
        } catch { return null; }
    });

    const [currentScreen, setCurrentScreen] = useState(() => {
        try {
            return localStorage.getItem('sipola_screen') || 'login';
        } catch { return 'login'; }
    });
    const [loading, setLoading] = useState(false);

    // Persist user and screen state
    useEffect(() => {
        if (user) {
            localStorage.setItem('sipola_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('sipola_user');
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem('sipola_screen', currentScreen);
    }, [currentScreen]);

    // Redirect to login if user is not authenticated
    useEffect(() => {
        if (!user && currentScreen !== 'login') {
            setCurrentScreen('login');
        }
    }, [user, currentScreen]);

    // --- App Data State ---
    const [qrDatabase, setQrDatabase] = useState([]);
    const [scanHistory, setScanHistory] = useState([]);
    const [apelHistory, setApelHistory] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [apelInputs, setApelInputs] = useState({});
    const [selectedShift, setSelectedShift] = useState('Pagi');

    // Fetch data on mount if user is logged in
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [qrs, scans, apels, activities] = await Promise.all([
                api.getQrPoints(),
                api.getScanLogs(),
                api.getApelLogs(),
                api.getActivityLogs()
            ]);

            setQrDatabase(qrs || []);

            // Map DB fields back to app state shape
            const mappedScans = (scans || []).map(s => ({
                ...s,
                loc: s.location, // DB: location, App: loc
                desc: s.description, // DB: description, App: desc
                dateISO: s.date_iso
            }));
            setScanHistory(mappedScans);

            const mappedApels = (apels || []).map(a => ({
                ...a,
                dateISO: a.date_iso,
                dateFormatted: a.date_formatted
            }));
            setApelHistory(mappedApels);

            // Activity: DB (user_name) -> App (name / user prop? check ActivityScreen)
            // ActivityScreen uses `item.user` (display) and `item.name`? 
            // Let's check ActivityScreen again later. For now, map likely fields.
            // In data.js dummy: name, desc, time, user, dateISO, images
            // In DB: user_name, description, time, date_iso, images
            const mappedActivities = (activities || []).map(a => ({
                ...a,
                name: a.user_name, // logic used 'name' for "Petugas X" in dummy, 'user' for "Rupam I"
                user: a.user_name, // In new logic, we just use one name (the logged in user)
                desc: a.description,
                dateISO: a.date_iso
            }));
            setActivityLog(mappedActivities);

        } catch (e) {
            console.error("Error loading data:", e);
        } finally {
            setLoading(false);
        }
    };

    // --- Screen Router ---
    // Immediate redirect check: if no user, force login screen
    const screenToRender = (!user && currentScreen !== 'login') ? 'login' : currentScreen;

    switch (screenToRender) {
        case 'login':
            return <LoginScreen setUser={setUser} setCurrentScreen={setCurrentScreen} />;
        case 'home':
            return <HomeScreen user={user} setCurrentScreen={setCurrentScreen} apelHistory={apelHistory} activityLog={activityLog} refreshData={loadData} />;
        case 'scan':
            return <ScanScreen setCurrentScreen={setCurrentScreen} qrDatabase={qrDatabase} setScanHistory={setScanHistory} scanHistory={scanHistory} refreshData={loadData} />;
        case 'apel':
            return (
                <ApelScreen
                    user={user}
                    setCurrentScreen={setCurrentScreen}
                    apelHistory={apelHistory}
                    setApelHistory={setApelHistory}
                    apelInputs={apelInputs}
                    setApelInputs={setApelInputs}
                    selectedShift={selectedShift}
                    setSelectedShift={setSelectedShift}
                    refreshData={loadData}
                />
            );
        case 'activity':
            return <ActivityScreen user={user} setCurrentScreen={setCurrentScreen} activityLog={activityLog} setActivityLog={setActivityLog} refreshData={loadData} />;
        case 'generator':
            return <GeneratorScreen user={user} setCurrentScreen={setCurrentScreen} qrDatabase={qrDatabase} setQrDatabase={setQrDatabase} refreshData={loadData} />;
        case 'profile':
            return <ProfileScreen user={user} setUser={setUser} setCurrentScreen={setCurrentScreen} />;
        case 'statistics':
            return <StatisticsScreen setCurrentScreen={setCurrentScreen} apelHistory={apelHistory} scanHistory={scanHistory} activityLog={activityLog} />;
        default:
            return <LoginScreen setUser={setUser} setCurrentScreen={setCurrentScreen} />;
    }
};

export default App;
