import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Home, Calendar, BookOpen, Wallet, Heart, User, Plus, Search, Bell,
  Sun, Moon, Check, CheckCircle2, Circle, Trash2, Edit3, Clock, AlertCircle,
  Droplets, Flame, TrendingUp, Award, Book, Sparkles, ShieldCheck, Cloud,
  CloudOff, RefreshCw, Download, Upload, LogOut, LogIn, ChevronRight,
  ChevronLeft, X, Briefcase, GraduationCap, Utensils, Smartphone, FileText,
  BarChart2, Target, Backpack, Coffee, Smile, Frown, Meh, Star, Settings,
  Volume2, Info, ExternalLink, Filter, Tag, Layers, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

// Firebase Modular SDK Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  deleteUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  enableIndexedDbPersistence,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// ============================================================================
// 1. CONSTANTS, THEME TOKENS & BUILT-IN INDIAN STUDENT FOOD DATABASE
// ============================================================================

const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'oviverse-student-app';

const DEFAULT_FIREBASE_CONFIG = (() => {
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.warn('Environment firebase config not parsed:', e);
  }
  return null;
})();

const INDIAN_FOOD_DATABASE = [
  { id: 'idli', name: 'Idli (2 pcs) + Sambar', unit: 'plate', calories: 220, protein: 7, carbs: 42, fat: 2.5 },
  { id: 'masala_dosa', name: 'Masala Dosa + Chutney', unit: '1 dosa', calories: 380, protein: 8, carbs: 58, fat: 13 },
  { id: 'plain_dosa', name: 'Plain Dosa', unit: '1 dosa', calories: 195, protein: 4.5, carbs: 32, fat: 5.5 },
  { id: 'poha', name: 'Kanda Poha (1 bowl)', unit: 'bowl', calories: 250, protein: 5, carbs: 44, fat: 6 },
  { id: 'upma', name: 'Rava Upma (1 bowl)', unit: 'bowl', calories: 240, protein: 6, carbs: 38, fat: 7 },
  { id: 'roti', name: 'Whole Wheat Roti / Chapati', unit: '1 roti', calories: 105, protein: 3.5, carbs: 20, fat: 1.2 },
  { id: 'paratha_aloo', name: 'Aloo Paratha + Curd', unit: '1 paratha', calories: 330, protein: 8, carbs: 46, fat: 12 },
  { id: 'steamed_rice', name: 'Steamed White Rice (1 cup)', unit: 'cup', calories: 205, protein: 4.2, carbs: 45, fat: 0.4 },
  { id: 'dal_tadka', name: 'Dal Tadka (1 bowl)', unit: 'bowl', calories: 185, protein: 9.5, carbs: 24, fat: 6 },
  { id: 'rajma', name: 'Rajma Masala (1 bowl)', unit: 'bowl', calories: 230, protein: 11, carbs: 32, fat: 6.5 },
  { id: 'chole', name: 'Chole / Chickpea Curry', unit: 'bowl', calories: 245, protein: 10.5, carbs: 34, fat: 7.5 },
  { id: 'paneer_bhurji', name: 'Paneer Bhurji (100g)', unit: 'serving', calories: 280, protein: 16, carbs: 6, fat: 21 },
  { id: 'chicken_curry', name: 'Homestyle Chicken Curry', unit: 'bowl', calories: 290, protein: 26, carbs: 8, fat: 17 },
  { id: 'egg_bhurji', name: 'Egg Bhurji (2 Eggs)', unit: 'serving', calories: 210, protein: 13, carbs: 3, fat: 16 },
  { id: 'boiled_eggs', name: 'Boiled Eggs (2 Whole)', unit: '2 eggs', calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6 },
  { id: 'curd', name: 'Fresh Dahi / Curd (1 bowl)', unit: 'bowl', calories: 110, protein: 5.5, carbs: 7, fat: 6.5 },
  { id: 'milk', name: 'Toned Milk (1 glass 250ml)', unit: 'glass', calories: 150, protein: 8, carbs: 12, fat: 7.5 },
  { id: 'banana', name: 'Banana (1 medium)', unit: '1 fruit', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: 'peanut_butter_bread', name: '2 Brown Bread + 1 tbsp Peanut Butter', unit: '2 slices', calories: 245, protein: 9.5, carbs: 29, fat: 10 },
  { id: 'oats_milk', name: 'Masala / Milk Oats (1 bowl)', unit: 'bowl', calories: 260, protein: 9.5, carbs: 42, fat: 6 },
  { id: 'chai', name: 'Indian Chai with Milk & Sugar', unit: '1 cup', calories: 90, protein: 2, carbs: 13, fat: 3 },
  { id: 'sprouts', name: 'Moong Sprouts Chaat (1 bowl)', unit: 'bowl', calories: 140, protein: 9.5, carbs: 24, fat: 0.8 },
  { id: 'paneer_tikka', name: 'Grilled Paneer / Tofu (100g)', unit: '100g', calories: 255, protein: 18, carbs: 4, fat: 19 },
  { id: 'idiyappam', name: 'Idiyappam (3 pcs) + Stew', unit: 'plate', calories: 275, protein: 5, carbs: 50, fat: 6 }
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EXPENSE_CATEGORIES = [
  'Food & Mess', 'Transport', 'Books & Stationery', 'Rent / Hostel',
  'Pocket Money', 'Freelance / Allowance', 'Health & Wellness', 'Subscriptions', 'Personal / Other'
];

const TASK_CATEGORIES = ['Study', 'College', 'Personal', 'Health', 'Errands'];

// Utility date helpers
const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDayName = (dateStr = getTodayStr()) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long' });
};

const formatDisplayDate = (dateStr = getTodayStr()) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const playGentleChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // Calming 528Hz tone
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  } catch (e) {
    // Ignore audio context autoplay restrictions
  }
};

// ============================================================================
// 2. REUSABLE UI COMPONENTS
// ============================================================================

const Card = ({ children, className = '', variant = 'default', onClick }) => {
  const variants = {
    default: 'bg-white/85 dark:bg-[#222925] border-[#DCE8DC] dark:border-[#2F3A34]',
    sage: 'bg-[#DCE8DC]/75 dark:bg-[#253129] border-[#B7C9B5]/60 dark:border-[#34463B]',
    lavender: 'bg-[#E8E2F1]/75 dark:bg-[#2A2633] border-[#D5CBE4]/60 dark:border-[#3D374A]',
    ivory: 'bg-[#F7F5EC] dark:bg-[#1C221F] border-[#E4E0D0] dark:border-[#2C3530]'
  };
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 ${variants[variant]} ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-3">
    <div>
      <h2 className="text-base font-semibold tracking-tight text-[#2C332E] dark:text-[#EDEBE3]">{title}</h2>
      {subtitle && <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Badge = ({ children, color = 'sage' }) => {
  const styles = {
    sage: 'bg-[#DCE8DC] text-[#2C332E] dark:bg-[#2E3D34] dark:text-[#D5E6D7]',
    lavender: 'bg-[#E8E2F1] text-[#3B334A] dark:bg-[#362F42] dark:text-[#DFD7EB]',
    eucalyptus: 'bg-[#B7C9B5] text-[#1F2621] dark:bg-[#3A4D3E] dark:text-[#E6F0E7]',
    amber: 'bg-amber-100/90 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
    rose: 'bg-rose-100/80 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${styles[color]}`}>
      {children}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-2xl border border-dashed border-[#B7C9B5] dark:border-[#36443B] bg-white/40 dark:bg-[#1E2421]/60">
    <div className="w-11 h-11 rounded-2xl bg-[#DCE8DC] dark:bg-[#2B3730] flex items-center justify-center text-[#3D4E42] dark:text-[#B7C9B5] mb-3">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-sm font-semibold text-[#2C332E] dark:text-[#EDEBE3]">{title}</h3>
    <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] max-w-xs mt-1 mb-4 leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B7C9B5] hover:bg-[#a7bca5] dark:bg-[#3B5242] dark:hover:bg-[#46614E] text-[#1E2620] dark:text-[#F7F5EC] text-xs font-semibold shadow-sm transition"
      >
        <Plus className="w-3.5 h-3.5" />
        {actionLabel}
      </button>
    )}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#181D1A]/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#F7F5EC] dark:bg-[#1D2420] border border-[#DCE8DC] dark:border-[#2F3B34] p-5 shadow-xl animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DCE8DC] dark:border-[#2C3630]">
          <h3 className="text-base font-semibold text-[#2C332E] dark:text-[#EDEBE3]">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#DCE8DC]/60 dark:bg-[#28322C] text-[#2C332E] dark:text-[#EDEBE3] hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// 3. MAIN APPLICATION: OVIVERSE
// ============================================================================

export default function App() {
  // --- Theme & Navigation State ---
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, planner, college, money, wellness, profile
  const [wellnessSubTab, setWellnessSubTab] = useState('habits'); // habits, nutrition, wellbeing
  const [profileSubTab, setProfileSubTab] = useState('hub'); // hub, reminders, journal, growth, reports, settings

  // --- Global UI Modals & Search ---
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // --- Firebase & Cloud Sync State ---
  const [customFirebaseConfig, setCustomFirebaseConfig] = useState('');
  const [firebaseServices, setFirebaseServices] = useState({ app: null, auth: null, db: null, storage: null });
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('initializing'); // initializing, firebase, local-guest
  const [syncStatus, setSyncStatus] = useState('synced'); // synced, saving, offline, error
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // --- User Settings & Profile Document ---
  const [userProfile, setUserProfile] = useState({
    displayName: 'Student',
    waterTargetMl: 2500,
    hydrationReminderMins: 90,
    weeklyBudget: 1500,
    monthlyBudget: 6000,
    dailyScreenGoalMins: 180,
    nutrition: {
      age: 20,
      heightCm: 170,
      currentWeightKg: 58,
      targetWeightKg: 64,
      activityLevel: 'moderate', // sedentary, light, moderate, active
      gender: 'male'
    }
  });

  // --- Core Real Data Collections (Zero Fake Sample Data) ---
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [scheduleOverrides, setScheduleOverrides] = useState([]); // holidays / special classes
  const [bagChecklistState, setBagChecklistState] = useState({}); // { "2026-11-16_item": true }
  const [assignments, setAssignments] = useState([]);
  const [academicRecords, setAcademicRecords] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [screenTimeLogs, setScreenTimeLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [growthItems, setGrowthItems] = useState([]);

  // Active Study Timer state
  const [activeTimer, setActiveTimer] = useState({ running: false, seconds: 0, subject: 'General Study' });

  const showToast = useCallback((text, type = 'info') => {
    setToastMessage({ text, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev && Date.now() - prev.id >= 2900 ? null : prev));
    }, 3200);
  }, []);

  // Network online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
      showToast('Back online — syncing changes safely', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showToast('Offline mode active — edits queued safely', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Initialize Firebase (supports environment config OR user-supplied config)
  useEffect(() => {
    let activeConfig = DEFAULT_FIREBASE_CONFIG;
    if (customFirebaseConfig.trim()) {
      try {
        activeConfig = JSON.parse(customFirebaseConfig.trim());
      } catch (err) {
        showToast('Invalid Firebase JSON configuration', 'error');
        return;
      }
    }

    if (!activeConfig || !activeConfig.apiKey) {
      setAuthMode('local-guest');
      setUser({ uid: 'local-student', displayName: 'Student (Offline Device)', isGuest: true });
      setSyncStatus('offline');
      return;
    }

    try {
      const app = getApps().length ? getApp() : initializeApp(activeConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const storage = getStorage(app);

      // Enable IndexedDB offline persistence
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence enabled in primary tab.');
        } else if (err.code === 'unimplemented') {
          console.warn('Browser does not support IndexedDB persistence.');
        }
      });

      setFirebaseServices({ app, auth, db, storage });

      const initAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        } catch (authErr) {
          console.warn('Initial auth fallback:', authErr);
        }
      };
      initAuth();

      const unsub = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setAuthMode('firebase');
          if (firebaseUser.displayName) {
            setUserProfile((prev) => ({
              ...prev,
              displayName: prev.displayName === 'Student' ? firebaseUser.displayName : prev.displayName
            }));
          }
          setSyncStatus(navigator.onLine ? 'synced' : 'offline');
        } else {
          setUser(null);
          setAuthMode('firebase');
        }
      });

      return () => unsub();
    } catch (err) {
      console.error('Firebase init error:', err);
      setAuthMode('local-guest');
      setUser({ uid: 'local-student', displayName: 'Student (Local Mode)', isGuest: true });
      setSyncStatus('error');
    }
  }, [customFirebaseConfig, showToast]);

  // Subscribe to Firestore user collections when authenticated
  useEffect(() => {
    const { db } = firebaseServices;
    if (!db || !user || authMode !== 'firebase') return;

    const uid = user.uid;
    const baseCol = (colName) => collection(db, 'artifacts', APP_ID, 'users', uid, colName);
    const unsubs = [];

    const bindCollection = (colName, setter) => {
      const unsub = onSnapshot(
        baseCol(colName),
        { includeMetadataChanges: true },
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setter(items);
          if (snap.metadata.hasPendingWrites) {
            setSyncStatus(navigator.onLine ? 'saving' : 'offline');
          } else {
            setSyncStatus(navigator.onLine ? 'synced' : 'offline');
          }
        },
        (err) => {
          console.error(`Firestore error on ${colName}:`, err);
          setSyncStatus('error');
        }
      );
      unsubs.push(unsub);
    };

    // Profile settings doc
    const profileDocRef = doc(db, 'artifacts', APP_ID, 'users', uid, 'meta', 'profile');
    const unsubProfile = onSnapshot(
      profileDocRef,
      (snap) => {
        if (snap.exists()) {
          setUserProfile((prev) => ({ ...prev, ...snap.data() }));
        }
      },
      (err) => console.error('Profile sync error:', err)
    );
    unsubs.push(unsubProfile);

    bindCollection('tasks', setTasks);
    bindCollection('subjects', setSubjects);
    bindCollection('timetable', setTimetable);
    bindCollection('scheduleOverrides', setScheduleOverrides);
    bindCollection('assignments', setAssignments);
    bindCollection('academicRecords', setAcademicRecords);
    bindCollection('transactions', setTransactions);
    bindCollection('savingsGoals', setSavingsGoals);
    bindCollection('habits', setHabits);
    bindCollection('waterLogs', setWaterLogs);
    bindCollection('foodLogs', setFoodLogs);
    bindCollection('weightLogs', setWeightLogs);
    bindCollection('studySessions', setStudySessions);
    bindCollection('screenTimeLogs', setScreenTimeLogs);
    bindCollection('reminders', setReminders);
    bindCollection('journalEntries', setJournalEntries);
    bindCollection('growthItems', setGrowthItems);

    return () => unsubs.forEach((u) => u());
  }, [firebaseServices, user, authMode]);

  // ============================================================================
  // 4. UNIFIED CLOUD CRUD HELPERS (Firestore + Honest Save States)
  // ============================================================================

  const stateMap = {
    tasks: setTasks,
    subjects: setSubjects,
    timetable: setTimetable,
    scheduleOverrides: setScheduleOverrides,
    assignments: setAssignments,
    academicRecords: setAcademicRecords,
    transactions: setTransactions,
    savingsGoals: setSavingsGoals,
    habits: setHabits,
    waterLogs: setWaterLogs,
    foodLogs: setFoodLogs,
    weightLogs: setWeightLogs,
    studySessions: setStudySessions,
    screenTimeLogs: setScreenTimeLogs,
    reminders: setReminders,
    journalEntries: setJournalEntries,
    growthItems: setGrowthItems
  };

  const createRecord = async (colName, payload) => {
    const record = {
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (authMode === 'firebase' && firebaseServices.db && user) {
      setSyncStatus('saving');
      try {
        const colRef = collection(firebaseServices.db, 'artifacts', APP_ID, 'users', user.uid, colName);
        const docRef = await addDoc(colRef, record);
        setSyncStatus(isOnline ? 'synced' : 'offline');
        return docRef.id;
      } catch (err) {
        console.error(`Error saving to ${colName}:`, err);
        setSyncStatus('error');
        showToast('Cloud save failed — check connection', 'error');
        return null;
      }
    } else {
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const setter = stateMap[colName];
      if (setter) setter((prev) => [{ id: localId, ...record }, ...prev]);
      return localId;
    }
  };

  const updateRecord = async (colName, id, updates) => {
    const patch = { ...updates, updatedAt: new Date().toISOString() };
    if (authMode === 'firebase' && firebaseServices.db && user) {
      setSyncStatus('saving');
      try {
        const docRef = doc(firebaseServices.db, 'artifacts', APP_ID, 'users', user.uid, colName, id);
        await updateDoc(docRef, patch);
        setSyncStatus(isOnline ? 'synced' : 'offline');
      } catch (err) {
        console.error(`Error updating ${colName}/${id}:`, err);
        setSyncStatus('error');
        showToast('Failed to update record', 'error');
      }
    } else {
      const setter = stateMap[colName];
      if (setter) setter((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    }
  };

  const deleteRecord = async (colName, id) => {
    if (authMode === 'firebase' && firebaseServices.db && user) {
      setSyncStatus('saving');
      try {
        const docRef = doc(firebaseServices.db, 'artifacts', APP_ID, 'users', user.uid, colName, id);
        await deleteDoc(docRef);
        setSyncStatus(isOnline ? 'synced' : 'offline');
        showToast('Record deleted permanently', 'info');
      } catch (err) {
        console.error(`Error deleting ${colName}/${id}:`, err);
        setSyncStatus('error');
        showToast('Could not delete record', 'error');
      }
    } else {
      const setter = stateMap[colName];
      if (setter) setter((prev) => prev.filter((item) => item.id !== id));
      showToast('Record deleted', 'info');
    }
  };

  const saveProfileSettings = async (newProfile) => {
    setUserProfile(newProfile);
    if (authMode === 'firebase' && firebaseServices.db && user) {
      setSyncStatus('saving');
      try {
        const profileDocRef = doc(firebaseServices.db, 'artifacts', APP_ID, 'users', user.uid, 'meta', 'profile');
        await setDoc(profileDocRef, newProfile, { merge: true });
        setSyncStatus(isOnline ? 'synced' : 'offline');
        showToast('Profile & goals saved to cloud', 'success');
      } catch (err) {
        setSyncStatus('error');
        showToast('Failed to save profile settings', 'error');
      }
    } else {
      showToast('Profile settings updated', 'success');
    }
  };

  // ============================================================================
  // 5. REMINDER ENGINE & STUDY TIMER TICKER
  // ============================================================================

  useEffect(() => {
    if (!activeTimer.running) return;
    const interval = setInterval(() => {
      setActiveTimer((prev) => ({ ...prev, seconds: prev.seconds + 1 }));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer.running]);

  // Check active reminders every 30 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = getTodayStr();

      reminders.forEach((rem) => {
        if (rem.completed && rem.repeat === 'none') return;
        if (rem.lastTriggeredDate === `${todayStr}_${currentHHMM}`) return;

        const targetTime = rem.snoozedUntil || rem.time;
        const isDateMatch = rem.repeat === 'daily' || rem.date === todayStr;

        if (isDateMatch && targetTime === currentHHMM) {
          playGentleChime();
          showToast(`Reminder: ${rem.title}`, 'info');
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('OviVerse Reminder', {
              body: `${rem.title} (${rem.category || 'Personal'})`,
              tag: rem.id
            });
          }
          updateRecord('reminders', rem.id, {
            lastTriggeredDate: `${todayStr}_${currentHHMM}`,
            snoozedUntil: null
          });
        }
      });
    };

    const timer = setInterval(checkReminders, 20000);
    return () => clearInterval(timer);
  }, [reminders]);

  const requestNotificationAccess = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser notifications are not supported on this device', 'error');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      playGentleChime();
      new Notification('OviVerse Notifications Enabled', {
        body: 'You will receive gentle reminders for classes, water, and tasks.'
      });
      showToast('Notifications enabled!', 'success');
    } else {
      showToast('Notification permission denied in browser settings', 'error');
    }
  };

  // ============================================================================
  // 6. DERIVED METRICS (100% FROM REAL SAVED RECORDS)
  // ============================================================================

  const todayStr = getTodayStr();
  const todayDayName = getDayName(todayStr);

  // Today's Tasks
  const todaysTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr || t.recurrence === 'daily');
  }, [tasks, todayStr]);

  const completedTasksTodayCount = useMemo(() => {
    return todaysTasks.filter((t) =>
      t.recurrence === 'daily' ? t.completedDates?.includes(todayStr) : t.completed
    ).length;
  }, [todaysTasks, todayStr]);

  // Today's College Classes & Smart Bag Checklist
  const todayOverride = useMemo(
    () => scheduleOverrides.find((o) => o.date === todayStr),
    [scheduleOverrides, todayStr]
  );

  const todaysClasses = useMemo(() => {
    if (todayOverride?.type === 'holiday') return [];
    const targetDay = todayOverride?.type === 'special' && todayOverride.followDay ? todayOverride.followDay : todayDayName;
    return timetable
      .filter((slot) => slot.day === targetDay)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [timetable, todayDayName, todayOverride]);

  const todaysBagChecklist = useMemo(() => {
    const items = new Set();
    todaysClasses.forEach((cls) => {
      const subj = subjects.find((s) => s.id === cls.subjectId || s.name === cls.subjectName);
      if (subj?.materials) {
        subj.materials
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
          .forEach((m) => items.add(m));
      }
    });
    return Array.from(items);
  }, [todaysClasses, subjects]);

  // Study Hours Today
  const studyMinutesToday = useMemo(() => {
    const logged = studySessions
      .filter((s) => s.date === todayStr)
      .reduce((acc, s) => acc + (Number(s.minutes) || 0), 0);
    return logged + Math.floor(activeTimer.seconds / 60);
  }, [studySessions, todayStr, activeTimer.seconds]);

  // Money Summary
  const currentMonthPrefix = todayStr.slice(0, 7);
  const spendingToday = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && tx.date === todayStr)
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [transactions, todayStr]);

  const spendingThisMonth = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && (tx.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [transactions, currentMonthPrefix]);

  const incomeThisMonth = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'income' && (tx.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [transactions, currentMonthPrefix]);

  const remainingMonthlyBudget = Math.max(0, (Number(userProfile.monthlyBudget) || 0) - spendingThisMonth);

  // Water Intake Today
  const waterTodayMl = useMemo(() => {
    return waterLogs
      .filter((w) => w.date === todayStr)
      .reduce((sum, w) => sum + Number(w.amountMl || 0), 0);
  }, [waterLogs, todayStr]);

  // Food & Nutrition Today + Calorie Surplus Goal Calculation
  const nutritionTargets = useMemo(() => {
    const { age = 20, heightCm = 170, currentWeightKg = 58, targetWeightKg = 64, activityLevel = 'moderate', gender = 'male' } =
      userProfile.nutrition || {};
    // Mifflin-St Jeor Equation
    const baseBmr =
      gender === 'female'
        ? 10 * currentWeightKg + 6.25 * heightCm - 5 * age - 161
        : 10 * currentWeightKg + 6.25 * heightCm - 5 * age + 5;
    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = Math.round(baseBmr * (multipliers[activityLevel] || 1.55));
    const surplus = targetWeightKg > currentWeightKg ? 300 : targetWeightKg < currentWeightKg ? -300 : 0;
    const targetCalories = Math.max(1400, tdee + surplus);
    const targetProtein = Math.round(currentWeightKg * 1.6); // 1.6g/kg for healthy student muscle/weight gain
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    const targetCarbs = Math.round((targetCalories - targetProtein * 4 - targetFat * 9) / 4);
    return { tdee, surplus, targetCalories, targetProtein, targetCarbs, targetFat };
  }, [userProfile.nutrition]);

  const nutritionToday = useMemo(() => {
    return foodLogs
      .filter((f) => f.date === todayStr)
      .reduce(
        (acc, item) => ({
          calories: acc.calories + Number(item.calories || 0),
          protein: acc.protein + Number(item.protein || 0),
          carbs: acc.carbs + Number(item.carbs || 0),
          fat: acc.fat + Number(item.fat || 0)
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
  }, [foodLogs, todayStr]);

  // Habits Today
  const habitsCompletedToday = useMemo(() => {
    return habits.filter((h) => h.completedDates?.includes(todayStr)).length;
  }, [habits, todayStr]);

  // Overall Daily Progress %
  const overallDailyProgress = useMemo(() => {
    const scores = [];
    if (todaysTasks.length > 0) scores.push((completedTasksTodayCount / todaysTasks.length) * 100);
    if (habits.length > 0) scores.push((habitsCompletedToday / habits.length) * 100);
    if (userProfile.waterTargetMl > 0) scores.push(Math.min(100, (waterTodayMl / userProfile.waterTargetMl) * 100));
    if (nutritionTargets.targetCalories > 0 && nutritionToday.calories > 0) {
      scores.push(Math.min(100, (nutritionToday.calories / nutritionTargets.targetCalories) * 100));
    }
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [todaysTasks, completedTasksTodayCount, habits, habitsCompletedToday, waterTodayMl, userProfile.waterTargetMl, nutritionToday.calories, nutritionTargets.targetCalories]);

  // ============================================================================
  // 7. QUICK LOGGING ACTIONS
  // ============================================================================

  const handleQuickWater = async (amountMl = 250) => {
    await createRecord('waterLogs', {
      date: todayStr,
      time: new Date().toTimeString().slice(0, 5),
      amountMl
    });
    showToast(`+${amountMl}ml water logged`, 'success');
  };

  const handleStopAndSaveStudyTimer = async () => {
    const mins = Math.max(1, Math.round(activeTimer.seconds / 60));
    await createRecord('studySessions', {
      date: todayStr,
      subject: activeTimer.subject,
      minutes: mins
    });
    setActiveTimer({ running: false, seconds: 0, subject: activeTimer.subject });
    showToast(`Saved ${mins} mins of ${activeTimer.subject}`, 'success');
  };

  // ============================================================================
  // 8. GLOBAL SEARCH RESULTS
  // ============================================================================

  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];

    tasks.forEach((t) => {
      if ((t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)) {
        results.push({ type: 'Task', title: t.title, sub: `${t.category} • Due ${t.dueDate || 'Anytime'}`, tab: 'planner' });
      }
    });
    subjects.forEach((s) => {
      if ((s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)) {
        results.push({ type: 'Subject', title: s.name, sub: s.code || 'College Subject', tab: 'college' });
      }
    });
    assignments.forEach((a) => {
      if ((a.title || '').toLowerCase().includes(q) || (a.subjectName || '').toLowerCase().includes(q)) {
        results.push({ type: 'Assignment', title: a.title, sub: `${a.subjectName} • Due ${a.dueDate}`, tab: 'college' });
      }
    });
    transactions.forEach((tx) => {
      if ((tx.description || '').toLowerCase().includes(q) || (tx.category || '').toLowerCase().includes(q)) {
        results.push({ type: 'Money', title: `${tx.description || tx.category} (₹${tx.amount})`, sub: `${tx.type} • ${tx.date}`, tab: 'money' });
      }
    });
    foodLogs.forEach((f) => {
      if ((f.name || '').toLowerCase().includes(q)) {
        results.push({ type: 'Food', title: f.name, sub: `${f.calories} kcal • ${f.mealType} (${f.date})`, tab: 'wellness', subTab: 'nutrition' });
      }
    });
    journalEntries.forEach((j) => {
      const combined = `${j.grateful1} ${j.grateful2} ${j.grateful3} ${j.bestMoment} ${j.diary}`.toLowerCase();
      if (combined.includes(q)) {
        results.push({ type: 'Journal', title: `Journal (${j.date})`, sub: j.bestMoment || j.grateful1 || 'Entry', tab: 'profile', pSub: 'journal' });
      }
    });
    growthItems.forEach((g) => {
      if ((g.title || '').toLowerCase().includes(q) || (g.notes || '').toLowerCase().includes(q)) {
        results.push({ type: 'Growth', title: g.title, sub: g.category, tab: 'profile', pSub: 'growth' });
      }
    });

    return results.slice(0, 20);
  }, [globalSearchQuery, tasks, subjects, assignments, transactions, foodLogs, journalEntries, growthItems]);

  // ============================================================================
  // 9. GREETING HELPER
  // ============================================================================

  const greetingText = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ============================================================================
  // 10. RENDER MODULE VIEWS
  // ============================================================================

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#F7F5EC] dark:bg-[#181D1A] text-[#2C332E] dark:text-[#EDEBE3] font-sans transition-colors duration-200 pb-24">
        {/* TOP APP BAR */}
        <header className="sticky top-0 z-30 bg-[#F7F5EC]/90 dark:bg-[#181D1A]/90 backdrop-blur-md border-b border-[#DCE8DC] dark:border-[#27312B]">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#B7C9B5] to-[#8FA98D] dark:from-[#3B5242] dark:to-[#2A3B30] flex items-center justify-center text-[#1F2621] dark:text-[#F7F5EC] font-bold text-sm shadow-xs">
                OV
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-base tracking-tight">OviVerse</span>
                  {/* Honest Sync Badge */}
                  <span
                    title={`Sync status: ${syncStatus}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      syncStatus === 'synced'
                        ? 'bg-[#DCE8DC] text-[#2C332E] dark:bg-[#27382D] dark:text-[#B7C9B5]'
                        : syncStatus === 'saving'
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : syncStatus === 'offline'
                        ? 'bg-[#E8E2F1] text-[#3B334A] dark:bg-[#312B3D] dark:text-[#D5CBE4]'
                        : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
                    }`}
                  >
                    {syncStatus === 'synced' && <Cloud className="w-2.5 h-2.5" />}
                    {syncStatus === 'saving' && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                    {syncStatus === 'offline' && <CloudOff className="w-2.5 h-2.5" />}
                    {syncStatus === 'error' && <AlertCircle className="w-2.5 h-2.5" />}
                    {syncStatus === 'synced' ? 'Synced' : syncStatus === 'saving' ? 'Saving' : syncStatus === 'offline' ? 'Local/Offline' : 'Sync Error'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setGlobalSearchOpen(true)}
                aria-label="Global Search"
                className="p-2 rounded-xl bg-[#DCE8DC]/60 dark:bg-[#232B26] text-[#2C332E] dark:text-[#EDEBE3] hover:bg-[#DCE8DC] transition"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setProfileSubTab('reminders');
                }}
                aria-label="Reminders"
                className="relative p-2 rounded-xl bg-[#DCE8DC]/60 dark:bg-[#232B26] text-[#2C332E] dark:text-[#EDEBE3] hover:bg-[#DCE8DC] transition"
              >
                <Bell className="w-4 h-4" />
                {reminders.filter((r) => !r.completed).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle Theme"
                className="p-2 rounded-xl bg-[#E8E2F1]/70 dark:bg-[#2A2633] text-[#2C332E] dark:text-[#EDEBE3] transition"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setQuickAddOpen(true)}
                aria-label="Quick Add"
                className="p-2 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-[#1E2620] dark:text-[#F7F5EC] font-medium shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#2C332E] dark:bg-[#EDEBE3] text-[#F7F5EC] dark:text-[#181D1A] text-xs font-medium shadow-lg flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#B7C9B5] dark:text-[#3B5242]" />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* MAIN CONTENT CONTAINER */}
        <main className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
          {activeTab === 'home' && (
            <HomeDashboard
              userProfile={userProfile}
              greetingText={greetingText}
              todayStr={todayStr}
              overallDailyProgress={overallDailyProgress}
              todaysTasks={todaysTasks}
              completedTasksTodayCount={completedTasksTodayCount}
              todaysClasses={todaysClasses}
              todayOverride={todayOverride}
              todaysBagChecklist={todaysBagChecklist}
              bagChecklistState={bagChecklistState}
              setBagChecklistState={setBagChecklistState}
              studyMinutesToday={studyMinutesToday}
              activeTimer={activeTimer}
              setActiveTimer={setActiveTimer}
              handleStopAndSaveStudyTimer={handleStopAndSaveStudyTimer}
              spendingToday={spendingToday}
              remainingMonthlyBudget={remainingMonthlyBudget}
              waterTodayMl={waterTodayMl}
              handleQuickWater={handleQuickWater}
              nutritionToday={nutritionToday}
              nutritionTargets={nutritionTargets}
              habits={habits}
              habitsCompletedToday={habitsCompletedToday}
              reminders={reminders}
              assignments={assignments}
              setActiveTab={setActiveTab}
              setWellnessSubTab={setWellnessSubTab}
              setProfileSubTab={setProfileSubTab}
              setQuickAddOpen={setQuickAddOpen}
              updateRecord={updateRecord}
            />
          )}

          {activeTab === 'planner' && (
            <DailyPlannerModule
              tasks={tasks}
              todayStr={todayStr}
              createRecord={createRecord}
              updateRecord={updateRecord}
              deleteRecord={deleteRecord}
              showToast={showToast}
            />
          )}

          {activeTab === 'college' && (
            <CollegeManagerModule
              subjects={subjects}
              timetable={timetable}
              scheduleOverrides={scheduleOverrides}
              assignments={assignments}
              academicRecords={academicRecords}
              todayStr={todayStr}
              todayDayName={todayDayName}
              todaysClasses={todaysClasses}
              todaysBagChecklist={todaysBagChecklist}
              bagChecklistState={bagChecklistState}
              setBagChecklistState={setBagChecklistState}
              createRecord={createRecord}
              updateRecord={updateRecord}
              deleteRecord={deleteRecord}
              showToast={showToast}
            />
          )}

          {activeTab === 'money' && (
            <MoneyManagerModule
              transactions={transactions}
              savingsGoals={savingsGoals}
              userProfile={userProfile}
              saveProfileSettings={saveProfileSettings}
              spendingToday={spendingToday}
              spendingThisMonth={spendingThisMonth}
              incomeThisMonth={incomeThisMonth}
              remainingMonthlyBudget={remainingMonthlyBudget}
              todayStr={todayStr}
              createRecord={createRecord}
              updateRecord={updateRecord}
              deleteRecord={deleteRecord}
              showToast={showToast}
            />
          )}

          {activeTab === 'wellness' && (
            <WellnessSuiteModule
              subTab={wellnessSubTab}
              setSubTab={setWellnessSubTab}
              habits={habits}
              waterLogs={waterLogs}
              waterTodayMl={waterTodayMl}
              handleQuickWater={handleQuickWater}
              foodLogs={foodLogs}
              weightLogs={weightLogs}
              nutritionToday={nutritionToday}
              nutritionTargets={nutritionTargets}
              screenTimeLogs={screenTimeLogs}
              studyMinutesToday={studyMinutesToday}
              userProfile={userProfile}
              saveProfileSettings={saveProfileSettings}
              todayStr={todayStr}
              createRecord={createRecord}
              updateRecord={updateRecord}
              deleteRecord={deleteRecord}
              showToast={showToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileAndHubModule
              subTab={profileSubTab}
              setSubTab={setProfileSubTab}
              user={user}
              authMode={authMode}
              firebaseServices={firebaseServices}
              customFirebaseConfig={customFirebaseConfig}
              setCustomFirebaseConfig={setCustomFirebaseConfig}
              userProfile={userProfile}
              saveProfileSettings={saveProfileSettings}
              notifPermission={notifPermission}
              requestNotificationAccess={requestNotificationAccess}
              reminders={reminders}
              journalEntries={journalEntries}
              growthItems={growthItems}
              allData={{
                userProfile,
                tasks,
                subjects,
                timetable,
                scheduleOverrides,
                assignments,
                academicRecords,
                transactions,
                savingsGoals,
                habits,
                waterLogs,
                foodLogs,
                weightLogs,
                studySessions,
                screenTimeLogs,
                reminders,
                journalEntries,
                growthItems
              }}
              todayStr={todayStr}
              createRecord={createRecord}
              updateRecord={updateRecord}
              deleteRecord={deleteRecord}
              showToast={showToast}
            />
          )}
        </main>

        {/* BOTTOM MOBILE NAVIGATION BAR */}
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#F7F5EC]/95 dark:bg-[#181D1A]/95 backdrop-blur-md border-t border-[#DCE8DC] dark:border-[#27312B] safe-area-pb">
          <div className="max-w-2xl mx-auto px-2 h-16 grid grid-cols-6 items-center">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'planner', label: 'Planner', icon: Calendar },
              { id: 'college', label: 'College', icon: BookOpen },
              { id: 'money', label: 'Money', icon: Wallet },
              { id: 'wellness', label: 'Wellness', icon: Heart },
              { id: 'profile', label: 'Profile', icon: User }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'profile') setProfileSubTab('hub');
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
                    isActive
                      ? 'text-[#233026] dark:text-[#EDEBE3] font-semibold'
                      : 'text-[#5C665E] dark:text-[#8E9B91]'
                  }`}
                >
                  <div
                    className={`px-3 py-1 rounded-full transition ${
                      isActive ? 'bg-[#B7C9B5]/70 dark:bg-[#364D3E]' : 'bg-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* GLOBAL SEARCH MODAL */}
        <Modal isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} title="Search OviVerse">
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#5C665E]" />
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search tasks, subjects, expenses, meals, journal..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm focus:outline-none"
              />
            </div>
            {globalSearchQuery.trim() === '' ? (
              <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] text-center py-6">
                Type a keyword to search across all your personal records.
              </p>
            ) : globalSearchResults.length === 0 ? (
              <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] text-center py-6">
                No matching records found for "{globalSearchQuery}".
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {globalSearchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTab(res.tab);
                      if (res.subTab) setWellnessSubTab(res.subTab);
                      if (res.pSub) setProfileSubTab(res.pSub);
                      setGlobalSearchOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-xl bg-white/80 dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#323F38] flex items-center justify-between hover:border-[#B7C9B5]"
                  >
                    <div>
                      <p className="text-xs font-semibold">{res.title}</p>
                      <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F]">{res.sub}</p>
                    </div>
                    <Badge color="sage">{res.type}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>

        {/* QUICK ADD MODAL */}
        <QuickAddModal
          isOpen={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          todayStr={todayStr}
          createRecord={createRecord}
          handleQuickWater={handleQuickWater}
          showToast={showToast}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 11. QUICK ADD UNIVERSAL MODAL
// ============================================================================

function QuickAddModal({ isOpen, onClose, todayStr, createRecord, handleQuickWater, showToast }) {
  const [mode, setMode] = useState('task');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Study');
  const [mealType, setMealType] = useState('Lunch');
  const [selectedFoodId, setSelectedFoodId] = useState(INDIAN_FOOD_DATABASE[0].id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'task') {
      if (!title.trim()) return;
      await createRecord('tasks', {
        title: title.trim(),
        priority: 'Medium',
        dueDate: todayStr,
        category,
        recurrence: 'none',
        completed: false
      });
      showToast('Task added to today', 'success');
    } else if (mode === 'expense') {
      if (!amount || Number(amount) <= 0) return;
      await createRecord('transactions', {
        type: 'expense',
        amount: Number(amount),
        date: todayStr,
        category: 'Food & Mess',
        description: title.trim() || 'Quick Expense',
        paymentMethod: 'UPI'
      });
      showToast(`Expense ₹${amount} logged`, 'success');
    } else if (mode === 'food') {
      const food = INDIAN_FOOD_DATABASE.find((f) => f.id === selectedFoodId) || INDIAN_FOOD_DATABASE[0];
      await createRecord('foodLogs', {
        date: todayStr,
        mealType,
        name: food.name,
        portions: 1,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat
      });
      showToast(`${food.name} logged`, 'success');
    }
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'task', label: 'Task', icon: CheckCircle2 },
            { id: 'expense', label: 'Expense', icon: Wallet },
            { id: 'food', label: 'Meal', icon: Utensils },
            { id: 'water', label: '+250ml', icon: Droplets }
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={async () => {
                  if (btn.id === 'water') {
                    await handleQuickWater(250);
                    onClose();
                  } else {
                    setMode(btn.id);
                  }
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition ${
                  mode === btn.id
                    ? 'bg-[#B7C9B5] dark:bg-[#3B5242] border-[#96B094] text-[#1E2620] dark:text-white'
                    : 'bg-white/80 dark:bg-[#252E29] border-[#DCE8DC] dark:border-[#334038]'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                {btn.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'task' && (
            <>
              <input
                type="text"
                required
                placeholder="What needs to be done today?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}

          {mode === 'expense' && (
            <>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="Amount in ₹ (e.g., 60)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              />
              <input
                type="text"
                placeholder="Note (e.g., Canteen lunch, Auto)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              />
            </>
          )}

          {mode === 'food' && (
            <>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              >
                {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              >
                {INDIAN_FOOD_DATABASE.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.calories} kcal, {f.protein}g P)
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#B7C9B5] hover:bg-[#a6bba4] dark:bg-[#3B5242] text-[#1E2620] dark:text-[#F7F5EC] font-semibold text-sm transition"
          >
            Save Entry
          </button>
        </form>
      </div>
    </Modal>
  );
}

// ============================================================================
// 12. MODULE 1: HOME DASHBOARD (100% REAL SAVED DATA)
// ============================================================================

function HomeDashboard({
  userProfile,
  greetingText,
  todayStr,
  overallDailyProgress,
  todaysTasks,
  completedTasksTodayCount,
  todaysClasses,
  todayOverride,
  todaysBagChecklist,
  bagChecklistState,
  setBagChecklistState,
  studyMinutesToday,
  activeTimer,
  setActiveTimer,
  handleStopAndSaveStudyTimer,
  spendingToday,
  remainingMonthlyBudget,
  waterTodayMl,
  handleQuickWater,
  nutritionToday,
  nutritionTargets,
  habits,
  habitsCompletedToday,
  reminders,
  assignments,
  setActiveTab,
  setWellnessSubTab,
  setProfileSubTab,
  setQuickAddOpen,
  updateRecord
}) {
  const upcomingAssignments = useMemo(
    () => assignments.filter((a) => !a.completed && a.dueDate >= todayStr).slice(0, 2),
    [assignments, todayStr]
  );

  const activeReminders = useMemo(
    () => reminders.filter((r) => !r.completed).slice(0, 2),
    [reminders]
  );

  const formatTimer = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-4">
      {/* HERO GREETING & DAILY PROGRESS CARD */}
      <Card variant="sage" className="relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#4A584E] dark:text-[#B7C9B5]">{formatDisplayDate(todayStr)}</p>
            <h1 className="text-xl font-bold tracking-tight mt-0.5">
              {greetingText}, {userProfile.displayName}
            </h1>
            <p className="text-xs text-[#4D5950] dark:text-[#B4C0B7] mt-1">
              {todaysTasks.length === 0 && habits.length === 0
                ? 'Your calm space is ready. Add a task or habit to begin.'
                : `${completedTasksTodayCount}/${todaysTasks.length} tasks & ${habitsCompletedToday}/${habits.length} habits completed today`}
            </p>
          </div>

          {/* Progress Ring */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/60 dark:text-[#1D2621]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#4B6B53] dark:text-[#8FB998] transition-all duration-500"
                  strokeDasharray={`${overallDailyProgress}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold">{overallDailyProgress}%</span>
            </div>
          </div>
        </div>

        {/* QUICK ACTION PILLS */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs font-medium shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            Quick Entry
          </button>
          <button
            onClick={() => handleQuickWater(250)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs font-medium shadow-2xs"
          >
            <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            +250ml Water
          </button>
          <button
            onClick={() => {
              setActiveTab('wellness');
              setWellnessSubTab('nutrition');
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs font-medium shadow-2xs"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            Log Meal
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setProfileSubTab('journal');
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs font-medium shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
            Gratitude
          </button>
        </div>
      </Card>

      {/* FOCUS STUDY TIMER & TODAY'S STUDY HOURS */}
      <Card variant="lavender" className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#1F1C26] flex items-center justify-center text-[#5A4E75] dark:text-[#C8BBE0]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold">
              Study Today: {Math.floor(studyMinutesToday / 60)}h {studyMinutesToday % 60}m
            </p>
            <p className="text-[11px] text-[#5C665E] dark:text-[#A9A2B8]">
              {activeTimer.running ? `Focusing: ${formatTimer(activeTimer.seconds)}` : 'Start a live focus session'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {activeTimer.seconds > 0 && (
            <button
              onClick={handleStopAndSaveStudyTimer}
              className="px-3 py-1.5 rounded-xl bg-[#2C332E] dark:bg-[#EDEBE3] text-white dark:text-[#181D1A] text-xs font-semibold"
            >
              Save
            </button>
          )}
          <button
            onClick={() => setActiveTimer((prev) => ({ ...prev, running: !prev.running }))}
            className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#352F42] text-xs font-semibold"
          >
            {activeTimer.running ? 'Pause' : 'Start Focus'}
          </button>
        </div>
      </Card>

      {/* 2x2 LIVE SUMMARY GRID (WATER, NUTRITION, MONEY, HABITS) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Water Card */}
        <Card onClick={() => { setActiveTab('wellness'); setWellnessSubTab('habits'); }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#5C665E] dark:text-[#9CA89F]">Water Intake</span>
            <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-lg font-bold">
            {waterTodayMl} <span className="text-xs font-normal text-[#5C665E]">/ {userProfile.waterTargetMl} ml</span>
          </p>
          <div className="w-full h-1.5 rounded-full bg-[#DCE8DC] dark:bg-[#2C3731] mt-2 overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (waterTodayMl / (userProfile.waterTargetMl || 2500)) * 100)}%` }}
            />
          </div>
        </Card>

        {/* Nutrition Card */}
        <Card onClick={() => { setActiveTab('wellness'); setWellnessSubTab('nutrition'); }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#5C665E] dark:text-[#9CA89F]">Nutrition</span>
            <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-lg font-bold">
            {Math.round(nutritionToday.calories)}{' '}
            <span className="text-xs font-normal text-[#5C665E]">/ {nutritionTargets.targetCalories} kcal</span>
          </p>
          <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F] mt-1">
            P: {Math.round(nutritionToday.protein)}g • C: {Math.round(nutritionToday.carbs)}g • F: {Math.round(nutritionToday.fat)}g
          </p>
        </Card>

        {/* Money Card */}
        <Card onClick={() => setActiveTab('money')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#5C665E] dark:text-[#9CA89F]">Spent Today</span>
            <Wallet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-bold">₹{spendingToday.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F] mt-1">
            ₹{remainingMonthlyBudget.toLocaleString('en-IN')} left this month
          </p>
        </Card>

        {/* Habits Card */}
        <Card onClick={() => { setActiveTab('wellness'); setWellnessSubTab('habits'); }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#5C665E] dark:text-[#9CA89F]">Daily Habits</span>
            <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-lg font-bold">
            {habitsCompletedToday} <span className="text-xs font-normal text-[#5C665E]">/ {habits.length} done</span>
          </p>
          <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F] mt-1">
            {habits.length === 0 ? 'Create your first habit' : 'Keep your gentle streak'}
          </p>
        </Card>
      </div>

      {/* TODAY'S COLLEGE TIMETABLE & SMART BAG CHECKLIST */}
      <Card>
        <SectionHeader
          title="Today's College & Bag Checklist"
          subtitle={
            todayOverride?.type === 'holiday'
              ? `Holiday: ${todayOverride.note || 'No classes scheduled'}`
              : `${todaysClasses.length} classes scheduled today`
          }
          action={
            <button
              onClick={() => setActiveTab('college')}
              className="text-xs font-semibold text-[#486850] dark:text-[#B7C9B5] flex items-center"
            >
              Timetable <ChevronRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        {todaysClasses.length === 0 ? (
          <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] py-2">
            {todayOverride?.type === 'holiday'
              ? 'Enjoy your holiday! Rest and recharge.'
              : 'No classes listed for today. Add your subjects and weekly timetable in College.'}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {todaysClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D] border border-[#DCE8DC] dark:border-[#2C3731]"
                >
                  <div>
                    <p className="text-xs font-semibold">{cls.subjectName}</p>
                    <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F]">
                      {cls.startTime} – {cls.endTime} {cls.room ? `• Room ${cls.room}` : ''}
                    </p>
                  </div>
                  <Badge color="sage">{cls.type || 'Lecture'}</Badge>
                </div>
              ))}
            </div>

            {todaysBagChecklist.length > 0 && (
              <div className="pt-2 border-t border-[#DCE8DC] dark:border-[#2C3731]">
                <p className="text-[11px] font-semibold text-[#4B6352] dark:text-[#B7C9B5] flex items-center gap-1.5 mb-2">
                  <Backpack className="w-3.5 h-3.5" /> Morning Bag Checklist
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {todaysBagChecklist.map((item) => {
                    const key = `${todayStr}_${item}`;
                    const checked = !!bagChecklistState[key];
                    return (
                      <button
                        key={item}
                        onClick={() => setBagChecklistState((prev) => ({ ...prev, [key]: !checked }))}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition ${
                          checked
                            ? 'bg-[#B7C9B5]/60 dark:bg-[#314537] border-[#96B094] line-through opacity-75'
                            : 'bg-white dark:bg-[#252E29] border-[#DCE8DC] dark:border-[#34423A]'
                        }`}
                      >
                        {checked ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* TODAY'S TASKS */}
      <Card>
        <SectionHeader
          title="Today's Tasks"
          subtitle={`${completedTasksTodayCount} of ${todaysTasks.length} completed`}
          action={
            <button
              onClick={() => setActiveTab('planner')}
              className="text-xs font-semibold text-[#486850] dark:text-[#B7C9B5] flex items-center"
            >
              Planner <ChevronRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        {todaysTasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Clear schedule today"
            description="Add your study goals, errands, or daily tasks in the Planner."
            actionLabel="Add Task"
            onAction={() => setActiveTab('planner')}
          />
        ) : (
          <div className="space-y-2">
            {todaysTasks.slice(0, 5).map((task) => {
              const isDone =
                task.recurrence === 'daily' ? task.completedDates?.includes(todayStr) : !!task.completed;
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    if (task.recurrence === 'daily') {
                      const list = task.completedDates || [];
                      const next = isDone ? list.filter((d) => d !== todayStr) : [...list, todayStr];
                      updateRecord('tasks', task.id, { completedDates: next });
                    } else {
                      updateRecord('tasks', task.id, { completed: !isDone });
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D] border border-[#DCE8DC] dark:border-[#2C3731] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#5C665E] shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${isDone ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <Badge color={task.priority === 'High' ? 'rose' : task.priority === 'Medium' ? 'lavender' : 'sage'}>
                    {task.priority}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* UPCOMING DEADLINES & REMINDERS */}
      {(upcomingAssignments.length > 0 || activeReminders.length > 0) && (
        <Card variant="ivory">
          <SectionHeader title="Upcoming Deadlines & Reminders" />
          <div className="space-y-2">
            {upcomingAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/80 dark:bg-[#232B26]">
                <span>
                  <strong>{a.title}</strong> ({a.subjectName})
                </span>
                <Badge color="amber">Due {a.dueDate}</Badge>
              </div>
            ))}
            {activeReminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/80 dark:bg-[#232B26]">
                <span>{r.title}</span>
                <Badge color="lavender">{r.time}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 13. MODULE 2: DAILY PLANNER (TASKS + CALENDAR VIEW)
// ============================================================================

function DailyPlannerModule({ tasks, todayStr, createRecord, updateRecord, deleteRecord, showToast }) {
  const [viewMode, setViewMode] = useState('list'); // list, calendar
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('');
  const [category, setCategory] = useState('Study');
  const [recurrence, setRecurrence] = useState('none');
  const [reminderEnabled, setReminderEnabled] = useState(false);

  // Calendar navigation
  const [calMonth, setCalMonth] = useState(() => {
    const [y, m] = todayStr.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle('');
    setPriority('Medium');
    setDueDate(selectedDate || todayStr);
    setDueTime('');
    setCategory('Study');
    setRecurrence('none');
    setReminderEnabled(false);
    setModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setPriority(task.priority || 'Medium');
    setDueDate(task.dueDate || todayStr);
    setDueTime(task.dueTime || '');
    setCategory(task.category || 'Study');
    setRecurrence(task.recurrence || 'none');
    setReminderEnabled(!!task.reminderEnabled);
    setModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      priority,
      dueDate,
      dueTime,
      category,
      recurrence,
      reminderEnabled
    };

    if (editingTask) {
      await updateRecord('tasks', editingTask.id, payload);
      showToast('Task updated', 'success');
    } else {
      await createRecord('tasks', { ...payload, completed: false, completedDates: [] });
      if (reminderEnabled && dueTime) {
        await createRecord('reminders', {
          title: `Task: ${title.trim()}`,
          date: dueDate,
          time: dueTime,
          category: 'Task',
          repeat: recurrence === 'daily' ? 'daily' : 'none',
          completed: false
        });
      }
      showToast('Task created', 'success');
    }
    setModalOpen(false);
  };

  const isTaskCompletedOnDate = (task, dateStr) => {
    if (task.recurrence === 'daily') return (task.completedDates || []).includes(dateStr);
    return !!task.completed;
  };

  const toggleTaskCompletion = async (task, dateStr = selectedDate) => {
    if (task.recurrence === 'daily') {
      const list = task.completedDates || [];
      const done = list.includes(dateStr);
      const next = done ? list.filter((d) => d !== dateStr) : [...list, dateStr];
      await updateRecord('tasks', task.id, { completedDates: next });
    } else {
      await updateRecord('tasks', task.id, { completed: !task.completed });
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (viewMode === 'calendar') {
          return t.dueDate === selectedDate || t.recurrence === 'daily';
        }
        return true;
      })
      .filter((t) => {
        const done = isTaskCompletedOnDate(t, selectedDate);
        if (filterStatus === 'pending') return !done;
        if (filterStatus === 'completed') return done;
        return true;
      })
      .sort((a, b) => {
        const pOrder = { High: 0, Medium: 1, Low: 2 };
        return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
      });
  }, [tasks, viewMode, selectedDate, filterStatus]);

  // Build calendar grid days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay();
    const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasTasks = tasks.some((t) => t.dueDate === ds);
      cells.push({ day: d, dateStr: ds, hasTasks });
    }
    return cells;
  }, [calMonth, tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Daily Planner</h1>
          <p className="text-xs text-[#5C665E] dark:text-[#9CA89F]">Organise your schedule, priorities & routines</p>
        </div>
        <button
          onClick={openNewTaskModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-[#1E2620] dark:text-[#F7F5EC] text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* VIEW & FILTER BAR */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex p-1 rounded-xl bg-[#DCE8DC]/70 dark:bg-[#232B26]">
          {['list', 'calendar'].map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                viewMode === v ? 'bg-white dark:bg-[#36473D] shadow-2xs' : 'text-[#5C665E]'
              }`}
            >
              {v} View
            </button>
          ))}
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#E8E2F1]/70 dark:bg-[#2A2633]">
          {['all', 'pending', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition ${
                filterStatus === st ? 'bg-white dark:bg-[#3D374A] shadow-2xs' : 'text-[#5C665E]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDAR GRID WHEN IN CALENDAR MODE */}
      {viewMode === 'calendar' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() =>
                setCalMonth((prev) =>
                  prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
                )
              }
              className="p-1.5 rounded-lg bg-[#DCE8DC]/60 dark:bg-[#2A352F]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold">
              {new Date(calMonth.year, calMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() =>
                setCalMonth((prev) =>
                  prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
                )
              }
              className="p-1.5 rounded-lg bg-[#DCE8DC]/60 dark:bg-[#2A352F]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#5C665E] mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) =>
              !cell ? (
                <div key={idx} />
              ) : (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs relative transition ${
                    selectedDate === cell.dateStr
                      ? 'bg-[#B7C9B5] dark:bg-[#3B5242] font-bold'
                      : cell.dateStr === todayStr
                      ? 'border border-[#B7C9B5]'
                      : 'hover:bg-[#DCE8DC]/40'
                  }`}
                >
                  <span>{cell.day}</span>
                  {cell.hasTasks && <span className="w-1 h-1 rounded-full bg-emerald-700 dark:bg-emerald-300 mt-0.5" />}
                </button>
              )
            )}
          </div>
        </Card>
      )}

      {/* TASK LIST */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={viewMode === 'calendar' ? `No tasks on ${formatDisplayDate(selectedDate)}` : 'No tasks yet'}
          description="Break down your assignments, revision chapters, and daily goals into calm, achievable steps."
          actionLabel="Create Task"
          onAction={openNewTaskModal}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const done = isTaskCompletedOnDate(task, selectedDate);
            return (
              <Card key={task.id} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <button onClick={() => toggleTaskCompletion(task, selectedDate)} className="mt-0.5">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#5C665E]" />
                    )}
                  </button>
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${done ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge color={task.priority === 'High' ? 'rose' : task.priority === 'Medium' ? 'lavender' : 'sage'}>
                        {task.priority}
                      </Badge>
                      <Badge color="eucalyptus">{task.category}</Badge>
                      {task.dueDate && (
                        <span className="text-[11px] text-[#5C665E] dark:text-[#9CA89F]">
                          {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}
                        </span>
                      )}
                      {task.recurrence !== 'none' && <Badge color="lavender">Repeats {task.recurrence}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditTaskModal(task)}
                    className="p-1.5 rounded-lg text-[#5C665E] hover:bg-[#DCE8DC]/50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRecord('tasks', task.id)}
                    className="p-1.5 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-100/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTask ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSaveTask} className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Data Structures Lab Record"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Time (Optional)</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-xs font-medium block mb-1">Recurrence</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] dark:border-[#34423A] text-sm"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium pt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="rounded"
              />
              Set Reminder Alert
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-[#1E2620] dark:text-[#F7F5EC] font-semibold text-sm"
          >
            {editingTask ? 'Save Changes' : 'Add Task'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 14. MODULE 3: COLLEGE MANAGER (TIMETABLE, BAG CHECKLIST, EXAMS, GPA, ATTENDANCE)
// ============================================================================

function CollegeManagerModule({
  subjects,
  timetable,
  scheduleOverrides,
  assignments,
  academicRecords,
  todayStr,
  todayDayName,
  todaysClasses,
  todaysBagChecklist,
  bagChecklistState,
  setBagChecklistState,
  createRecord,
  updateRecord,
  deleteRecord,
  showToast
}) {
  const [subTab, setSubTab] = useState('today'); // today, subjects, assignments, grades
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK.includes(todayDayName) ? todayDayName : 'Monday');

  // Modals
  const [subjectModal, setSubjectModal] = useState(false);
  const [slotModal, setSlotModal] = useState(false);
  const [overrideModal, setOverrideModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);

  // Subject form
  const [sName, setSName] = useState('');
  const [sCode, setSCode] = useState('');
  const [sProf, setSProf] = useState('');
  const [sMaterials, setSMaterials] = useState('');
  const [sCredits, setSCredits] = useState('4');

  // Slot form
  const [slotDay, setSlotDay] = useState(selectedDay);
  const [slotSubjName, setSlotSubjName] = useState('');
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('10:00');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotType, setSlotType] = useState('Lecture');

  // Holiday / Override form
  const [ovDate, setOvDate] = useState(todayStr);
  const [ovType, setOvType] = useState('holiday');
  const [ovFollowDay, setOvFollowDay] = useState('Monday');
  const [ovNote, setOvNote] = useState('');

  // Assignment/Exam form
  const [aTitle, setATitle] = useState('');
  const [aSubj, setASubj] = useState('');
  const [aType, setAType] = useState('Assignment');
  const [aDue, setADue] = useState(todayStr);
  const [aDesc, setADesc] = useState('');

  // Grade form
  const [gSem, setGSem] = useState('Semester 1');
  const [gSubj, setGSubj] = useState('');
  const [gInternal, setGInternal] = useState('');
  const [gExternal, setGExternal] = useState('');
  const [gGradePoint, setGGradePoint] = useState('9');
  const [gCredits, setGCredits] = useState('4');

  // Calculate CGPA
  const cgpa = useMemo(() => {
    if (academicRecords.length === 0) return null;
    let totalPoints = 0;
    let totalCredits = 0;
    academicRecords.forEach((rec) => {
      const cr = Number(rec.credits) || 0;
      const gp = Number(rec.gradePoint) || 0;
      totalPoints += cr * gp;
      totalCredits += cr;
    });
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  }, [academicRecords]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">College Manager</h1>
          <p className="text-xs text-[#5C665E] dark:text-[#9CA89F]">Timetable, bag checklist, attendance & GPA</p>
        </div>
        {cgpa && <Badge color="eucalyptus">CGPA: {cgpa}</Badge>}
      </div>

      {/* SUB-TABS */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#DCE8DC]/70 dark:bg-[#232B26]">
        {[
          { id: 'today', label: 'Timetable' },
          { id: 'subjects', label: 'Subjects' },
          { id: 'assignments', label: 'Exams/Work' },
          { id: 'grades', label: 'GPA/Marks' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`py-1.5 rounded-xl text-xs font-medium transition ${
              subTab === t.id ? 'bg-white dark:bg-[#36473D] shadow-2xs' : 'text-[#5C665E]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: TIMETABLE & MORNING BAG CHECKLIST */}
      {subTab === 'today' && (
        <div className="space-y-4">
          {/* Morning Smart Bag Checklist Card */}
          <Card variant="sage">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Backpack className="w-4 h-4 text-[#2C332E] dark:text-[#B7C9B5]" />
                <h3 className="text-xs font-bold">Morning Bag Checklist ({todayDayName})</h3>
              </div>
              <button
                onClick={() => setOverrideModal(true)}
                className="text-[11px] font-semibold underline text-[#3C5743] dark:text-[#B7C9B5]"
              >
                Holiday / Override
              </button>
            </div>
            {todaysBagChecklist.length === 0 ? (
              <p className="text-xs text-[#4D5950] dark:text-[#B4C0B7]">
                Add required materials (Textbook, Calculator, Lab Coat) to your subjects to auto-generate your morning bag checklist.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {todaysBagChecklist.map((item) => {
                  const key = `${todayStr}_${item}`;
                  const checked = !!bagChecklistState[key];
                  return (
                    <button
                      key={item}
                      onClick={() => setBagChecklistState((prev) => ({ ...prev, [key]: !checked }))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        checked
                          ? 'bg-[#B7C9B5] dark:bg-[#354B3C] line-through opacity-75'
                          : 'bg-white/90 dark:bg-[#1E2622] border-[#B7C9B5]'
                      }`}
                    >
                      {checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Day Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {DAYS_OF_WEEK.slice(0, 6).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
                  selectedDay === day
                    ? 'bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold'
                    : 'bg-white/80 dark:bg-[#232B26] border border-[#DCE8DC] dark:border-[#313D36]'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
            <button
              onClick={() => {
                setSlotDay(selectedDay);
                setSlotSubjName(subjects[0]?.name || '');
                setSlotModal(true);
              }}
              className="ml-auto shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2C332E] dark:bg-[#EDEBE3] text-white dark:text-[#181D1A] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Class
            </button>
          </div>

          {/* Timetable Slots for Selected Day */}
          {timetable.filter((s) => s.day === selectedDay).length === 0 ? (
            <EmptyState
              icon={Clock}
              title={`No classes on ${selectedDay}`}
              description="Add your lecture and lab timings for this day."
              actionLabel="Add Class Slot"
              onAction={() => {
                setSlotDay(selectedDay);
                setSlotModal(true);
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {timetable
                .filter((s) => s.day === selectedDay)
                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                .map((slot) => (
                  <Card key={slot.id} className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{slot.subjectName}</span>
                        <Badge color="lavender">{slot.type}</Badge>
                      </div>
                      <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] mt-0.5">
                        {slot.startTime} – {slot.endTime} {slot.room ? `• Room ${slot.room}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteRecord('timetable', slot.id)}
                      className="p-2 rounded-xl text-rose-700 dark:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Card>
                ))}
            </div>
          )}

          {/* Holidays & Special Overrides List */}
          {scheduleOverrides.length > 0 && (
            <Card variant="ivory">
              <SectionHeader title="Holidays & Special Schedules" />
              <div className="space-y-2">
                {scheduleOverrides.map((ov) => (
                  <div key={ov.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/80 dark:bg-[#232B26]">
                    <div>
                      <span className="font-semibold">{ov.date}</span> —{' '}
                      {ov.type === 'holiday' ? `Holiday (${ov.note || 'Off'})` : `Follows ${ov.followDay} timetable`}
                    </div>
                    <button onClick={() => deleteRecord('scheduleOverrides', ov.id)} className="text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* SUBTAB 2: SUBJECTS & ATTENDANCE TRACKER */}
      {subTab === 'subjects' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setSubjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          {subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects added"
              description="Add your semester subjects, required books/materials, and track class attendance."
              actionLabel="Add Subject"
              onAction={() => setSubjectModal(true)}
            />
          ) : (
            subjects.map((subj) => {
              const attended = Number(subj.attendedClasses) || 0;
              const total = Number(subj.totalClasses) || 0;
              const pct = total > 0 ? Math.round((attended / total) * 100) : 100;
              return (
                <Card key={subj.id} className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{subj.name}</h3>
                        {subj.code && <Badge color="sage">{subj.code}</Badge>}
                      </div>
                      {subj.professor && <p className="text-xs text-[#5C665E]">Prof. {subj.professor}</p>}
                      {subj.materials && (
                        <p className="text-[11px] text-[#4A6351] dark:text-[#B7C9B5] mt-1">
                          Bag items: {subj.materials}
                        </p>
                      )}
                    </div>
                    <button onClick={() => deleteRecord('subjects', subj.id)} className="text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Attendance Bar & Quick Buttons */}
                  <div className="pt-2 border-t border-[#DCE8DC] dark:border-[#2C3731] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold">
                        Attendance: {attended}/{total} ({pct}%)
                      </span>
                      {total > 0 && pct < 75 && (
                        <span className="ml-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          Below 75%!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          updateRecord('subjects', subj.id, {
                            attendedClasses: attended + 1,
                            totalClasses: total + 1
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#DCE8DC] dark:bg-[#2F4036] text-[11px] font-semibold"
                      >
                        + Present
                      </button>
                      <button
                        onClick={() =>
                          updateRecord('subjects', subj.id, {
                            totalClasses: total + 1
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 text-[11px] font-semibold"
                      >
                        + Absent
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 3: ASSIGNMENTS & EXAMS */}
      {subTab === 'assignments' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setASubj(subjects[0]?.name || '');
                setAssignModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Assignment / Exam
            </button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No assignments or exams tracked"
              description="Keep track of lab submissions, internals, and semester exam dates."
              actionLabel="Add Deadline"
              onAction={() => setAssignModal(true)}
            />
          ) : (
            assignments.map((item) => (
              <Card key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => updateRecord('assignments', item.id, { completed: !item.completed })}
                    className="mt-0.5"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#5C665E]" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${item.completed ? 'line-through opacity-60' : ''}`}>
                        {item.title}
                      </span>
                      <Badge color={item.type === 'Exam' ? 'rose' : 'lavender'}>{item.type}</Badge>
                    </div>
                    <p className="text-xs text-[#5C665E] dark:text-[#9CA89F]">
                      {item.subjectName} • Due {item.dueDate}
                    </p>
                    {item.description && <p className="text-xs mt-1 opacity-85">{item.description}</p>}
                  </div>
                </div>
                <button onClick={() => deleteRecord('assignments', item.id)} className="text-rose-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* SUBTAB 4: ACADEMIC RECORDS, MARKS & GPA */}
      {subTab === 'grades' && (
        <div className="space-y-3">
          <Card variant="lavender" className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#5C665E] dark:text-[#B4ADC4]">Cumulative GPA (10-Point Scale)</p>
              <p className="text-2xl font-bold mt-0.5">{cgpa || '—'}</p>
            </div>
            <button
              onClick={() => setGradeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#362F42] text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </Card>

          {academicRecords.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No semester marks recorded"
              description="Log internal marks, semester scores, and credits to calculate your GPA automatically."
              actionLabel="Add Subject Grade"
              onAction={() => setGradeModal(true)}
            />
          ) : (
            academicRecords.map((rec) => (
              <Card key={rec.id} className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{rec.subjectName}</span>
                    <Badge color="sage">{rec.semester}</Badge>
                  </div>
                  <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] mt-0.5">
                    Internal: {rec.internalMarks || '—'} • External: {rec.externalMarks || '—'} • Credits: {rec.credits} • GP: {rec.gradePoint}
                  </p>
                </div>
                <button onClick={() => deleteRecord('academicRecords', rec.id)} className="text-rose-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MODAL: ADD SUBJECT */}
      <Modal isOpen={subjectModal} onClose={() => setSubjectModal(false)} title="Add Subject">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!sName.trim()) return;
            await createRecord('subjects', {
              name: sName.trim(),
              code: sCode.trim(),
              professor: sProf.trim(),
              materials: sMaterials.trim(),
              credits: Number(sCredits) || 4,
              attendedClasses: 0,
              totalClasses: 0
            });
            setSName('');
            setSCode('');
            setSProf('');
            setSMaterials('');
            setSubjectModal(false);
            showToast('Subject added', 'success');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            placeholder="Subject Name (e.g., Operating Systems)"
            value={sName}
            onChange={(e) => setSName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Code (e.g., CS302)"
              value={sCode}
              onChange={(e) => setSCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
            <input
              type="text"
              placeholder="Professor Name"
              value={sProf}
              onChange={(e) => setSProf(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Required Bag Materials (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g., OS Notebook, Scientific Calculator, Lab Record"
              value={sMaterials}
              onChange={(e) => setSMaterials(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Subject
          </button>
        </form>
      </Modal>

      {/* MODAL: ADD TIMETABLE SLOT */}
      <Modal isOpen={slotModal} onClose={() => setSlotModal(false)} title="Add Class to Timetable">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!slotSubjName.trim()) return;
            await createRecord('timetable', {
              day: slotDay,
              subjectName: slotSubjName.trim(),
              startTime: slotStart,
              endTime: slotEnd,
              room: slotRoom.trim(),
              type: slotType
            });
            setSlotModal(false);
            showToast('Class added to timetable', 'success');
          }}
          className="space-y-3"
        >
          <select
            value={slotDay}
            onChange={(e) => setSlotDay(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          >
            {DAYS_OF_WEEK.slice(0, 6).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="text"
            required
            list="subjects-datalist"
            placeholder="Subject Name"
            value={slotSubjName}
            onChange={(e) => setSlotSubjName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <datalist id="subjects-datalist">
            {subjects.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
            <input
              type="time"
              value={slotEnd}
              onChange={(e) => setSlotEnd(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Room / Lab No."
              value={slotRoom}
              onChange={(e) => setSlotRoom(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
            <select
              value={slotType}
              onChange={(e) => setSlotType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              <option value="Lecture">Lecture</option>
              <option value="Lab">Lab</option>
              <option value="Tutorial">Tutorial</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Class Slot
          </button>
        </form>
      </Modal>

      {/* MODAL: HOLIDAY / SCHEDULE OVERRIDE */}
      <Modal isOpen={overrideModal} onClose={() => setOverrideModal(false)} title="Holiday or Special Schedule">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await createRecord('scheduleOverrides', {
              date: ovDate,
              type: ovType,
              followDay: ovFollowDay,
              note: ovNote.trim()
            });
            setOverrideModal(false);
            showToast('Schedule exception saved', 'success');
          }}
          className="space-y-3"
        >
          <input
            type="date"
            value={ovDate}
            onChange={(e) => setOvDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <select
            value={ovType}
            onChange={(e) => setOvType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          >
            <option value="holiday">College Holiday (No Classes)</option>
            <option value="special">Day Order Swap (Follow Another Day)</option>
          </select>
          {ovType === 'special' && (
            <select
              value={ovFollowDay}
              onChange={(e) => setOvFollowDay(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              {DAYS_OF_WEEK.slice(0, 6).map((d) => (
                <option key={d} value={d}>Follow {d} Timetable</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Reason / Note (e.g., Festival Holiday, Day Order 2)"
            value={ovNote}
            onChange={(e) => setOvNote(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Override
          </button>
        </form>
      </Modal>

      {/* MODAL: ASSIGNMENT / EXAM */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Add Assignment or Exam">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!aTitle.trim()) return;
            await createRecord('assignments', {
              title: aTitle.trim(),
              subjectName: aSubj.trim() || 'General',
              type: aType,
              dueDate: aDue,
              description: aDesc.trim(),
              completed: false
            });
            // Automatically schedule a morning reminder on due date
            await createRecord('reminders', {
              title: `${aType} Due: ${aTitle.trim()} (${aSubj || 'College'})`,
              date: aDue,
              time: '08:00',
              category: 'College',
              repeat: 'none',
              completed: false
            });
            setATitle('');
            setADesc('');
            setAssignModal(false);
            showToast(`${aType} & reminder saved`, 'success');
          }}
          className="space-y-3"
        >
          <select
            value={aType}
            onChange={(e) => setAType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          >
            <option value="Assignment">Assignment / Lab Record</option>
            <option value="Exam">Internal / Semester Exam</option>
          </select>
          <input
            type="text"
            required
            placeholder="Title (e.g., DBMS Mini Project / Mid-Sem Exam)"
            value={aTitle}
            onChange={(e) => setATitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <input
            type="text"
            placeholder="Subject Name"
            value={aSubj}
            onChange={(e) => setASubj(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <input
            type="date"
            value={aDue}
            onChange={(e) => setADue(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <textarea
            rows={2}
            placeholder="Syllabus portions or submission instructions..."
            value={aDesc}
            onChange={(e) => setADesc(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save {aType}
          </button>
        </form>
      </Modal>

      {/* MODAL: ADD ACADEMIC GRADE */}
      <Modal isOpen={gradeModal} onClose={() => setGradeModal(false)} title="Add Academic Record">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!gSubj.trim()) return;
            await createRecord('academicRecords', {
              semester: gSem,
              subjectName: gSubj.trim(),
              internalMarks: gInternal,
              externalMarks: gExternal,
              gradePoint: Number(gGradePoint) || 0,
              credits: Number(gCredits) || 3
            });
            setGSubj('');
            setGInternal('');
            setGExternal('');
            setGradeModal(false);
            showToast('Academic record saved', 'success');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            placeholder="Semester (e.g., Semester 3)"
            value={gSem}
            onChange={(e) => setGSem(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <input
            type="text"
            required
            placeholder="Subject Name"
            value={gSubj}
            onChange={(e) => setGSubj(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Internal Marks (e.g., 44/50)"
              value={gInternal}
              onChange={(e) => setGInternal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
            <input
              type="text"
              placeholder="Semester Marks (e.g., 82/100)"
              value={gExternal}
              onChange={(e) => setGExternal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1">Grade Point (0-10)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={gGradePoint}
                onChange={(e) => setGGradePoint(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="10"
                value={gCredits}
                onChange={(e) => setGCredits(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Grade
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 15. MODULE 4: MONEY MANAGER (BUDGETS, EXPENSES, SAVINGS, ANALYTICS)
// ============================================================================

function MoneyManagerModule({
  transactions,
  savingsGoals,
  userProfile,
  saveProfileSettings,
  spendingToday,
  spendingThisMonth,
  incomeThisMonth,
  remainingMonthlyBudget,
  todayStr,
  createRecord,
  updateRecord,
  deleteRecord,
  showToast
}) {
  const [txModal, setTxModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [budgetModal, setBudgetModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // Transaction form
  const [txType, setTxType] = useState('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayStr);
  const [txCat, setTxCat] = useState('Food & Mess');
  const [txDesc, setTxDesc] = useState('');
  const [txMethod, setTxMethod] = useState('UPI');

  // Goal form
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  // Budget form
  const [weeklyB, setWeeklyB] = useState(userProfile.weeklyBudget || 1500);
  const [monthlyB, setMonthlyB] = useState(userProfile.monthlyBudget || 6000);

  // Category Breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const map = {};
    const monthPrefix = todayStr.slice(0, 7);
    transactions
      .filter((t) => t.type === 'expense' && (t.date || '').startsWith(monthPrefix))
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions, todayStr]);

  const filteredTx = useMemo(() => {
    return transactions
      .filter((t) => (catFilter === 'All' ? true : t.category === catFilter))
      .filter((t) =>
        searchTerm.trim() === ''
          ? true
          : (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, catFilter, searchTerm]);

  const budgetPct = Math.min(
    100,
    userProfile.monthlyBudget > 0 ? Math.round((spendingThisMonth / userProfile.monthlyBudget) * 100) : 0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Money Manager</h1>
          <p className="text-xs text-[#5C665E] dark:text-[#9CA89F]">Mindful student budgeting & pocket money tracker</p>
        </div>
        <button
          onClick={() => setTxModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" /> Log Entry
        </button>
      </div>

      {/* MONTHLY BUDGET OVERVIEW CARD */}
      <Card variant="sage">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#4A584E] dark:text-[#B7C9B5]">Remaining Monthly Budget</p>
            <p className="text-2xl font-bold mt-0.5">₹{remainingMonthlyBudget.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-[#4D5950] dark:text-[#B4C0B7] mt-1">
              Spent ₹{spendingThisMonth.toLocaleString('en-IN')} of ₹{(userProfile.monthlyBudget || 0).toLocaleString('en-IN')} • Income: ₹{incomeThisMonth.toLocaleString('en-IN')}
            </p>
          </div>
          <button
            onClick={() => {
              setWeeklyB(userProfile.weeklyBudget || 1500);
              setMonthlyB(userProfile.monthlyBudget || 6000);
              setBudgetModal(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-[#1E2622] text-[11px] font-semibold"
          >
            Edit Budget
          </button>
        </div>

        <div className="w-full h-2 rounded-full bg-white/70 dark:bg-[#1C2420] mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              budgetPct > 85 ? 'bg-rose-500' : 'bg-[#4B6B53] dark:bg-[#8FB998]'
            }`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </Card>

      {/* SPENDING BREAKDOWN CHART */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <SectionHeader title="Monthly Spending Breakdown" />
          <div className="space-y-2">
            {categoryBreakdown.map(([cat, amt]) => {
              const pct = spendingThisMonth > 0 ? Math.round((amt / spendingThisMonth) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{cat}</span>
                    <span className="font-semibold">
                      ₹{amt.toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#DCE8DC] dark:bg-[#2C3731]">
                    <div className="h-full rounded-full bg-[#7A9A7E]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* SAVINGS GOALS */}
      <Card variant="lavender">
        <SectionHeader
          title="Savings Goals"
          action={
            <button
              onClick={() => setGoalModal(true)}
              className="text-xs font-semibold text-[#4B3F66] dark:text-[#D5CBE4] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Goal
            </button>
          }
        />
        {savingsGoals.length === 0 ? (
          <p className="text-xs text-[#5C665E] dark:text-[#A9A2B8]">
            Saving for a laptop, trip, or emergency fund? Create a savings goal.
          </p>
        ) : (
          <div className="space-y-2.5">
            {savingsGoals.map((g) => {
              const saved = Number(g.savedAmount) || 0;
              const target = Number(g.targetAmount) || 1;
              const pct = Math.min(100, Math.round((saved / target) * 100));
              return (
                <div key={g.id} className="p-3 rounded-xl bg-white/80 dark:bg-[#1F1C26] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{g.name}</p>
                      <p className="text-[11px] text-[#5C665E]">
                        ₹{saved.toLocaleString('en-IN')} / ₹{target.toLocaleString('en-IN')} ({pct}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          updateRecord('savingsGoals', g.id, { savedAmount: saved + 100 })
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#E8E2F1] dark:bg-[#362F42] text-[11px] font-semibold"
                      >
                        +₹100
                      </button>
                      <button onClick={() => deleteRecord('savingsGoals', g.id)} className="text-rose-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E8E2F1] dark:bg-[#2F2A3B]">
                    <div className="h-full rounded-full bg-purple-600 dark:bg-purple-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* TRANSACTION SEARCH & HISTORY */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#5C665E]" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/90 dark:bg-[#222925] border border-[#DCE8DC] dark:border-[#313D36] text-xs"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/90 dark:bg-[#222925] border border-[#DCE8DC] dark:border-[#313D36] text-xs"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filteredTx.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No transactions recorded"
            description="Log your daily meals, travel, pocket money, or allowance manually. No bank connection required."
            actionLabel="Record Expense / Income"
            onAction={() => setTxModal(true)}
          />
        ) : (
          filteredTx.map((tx) => (
            <Card key={tx.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type === 'income'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-[#DCE8DC] text-[#2C332E] dark:bg-[#2C3831] dark:text-[#EDEBE3]'
                  }`}
                >
                  {tx.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-semibold">{tx.description || tx.category}</p>
                  <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F]">
                    {tx.category} • {tx.paymentMethod} • {tx.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold ${
                    tx.type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : ''
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </span>
                <button onClick={() => deleteRecord('transactions', tx.id)} className="text-rose-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* TRANSACTION MODAL */}
      <Modal isOpen={txModal} onClose={() => setTxModal(false)} title="Record Expense or Income">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!txAmount || Number(txAmount) <= 0) return;
            await createRecord('transactions', {
              type: txType,
              amount: Number(txAmount),
              date: txDate,
              category: txCat,
              description: txDesc.trim(),
              paymentMethod: txMethod
            });
            setTxAmount('');
            setTxDesc('');
            setTxModal(false);
            showToast('Transaction recorded', 'success');
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize border ${
                  txType === t ? 'bg-[#B7C9B5] dark:bg-[#3B5242] border-[#96B094]' : 'bg-white dark:bg-[#252E29]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="number"
            required
            min="1"
            step="any"
            placeholder="Amount in ₹"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={txCat}
              onChange={(e) => setTxCat(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={txMethod}
              onChange={(e) => setTxMethod(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              {['UPI', 'Cash', 'Debit/Credit Card', 'Bank Transfer'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <input
            type="text"
            placeholder="Description (e.g., Mess fee, Metro card recharge)"
            value={txDesc}
            onChange={(e) => setTxDesc(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Transaction
          </button>
        </form>
      </Modal>

      {/* SAVINGS GOAL MODAL */}
      <Modal isOpen={goalModal} onClose={() => setGoalModal(false)} title="Create Savings Goal">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!goalName.trim() || !goalTarget) return;
            await createRecord('savingsGoals', {
              name: goalName.trim(),
              targetAmount: Number(goalTarget),
              savedAmount: 0
            });
            setGoalName('');
            setGoalTarget('');
            setGoalModal(false);
            showToast('Savings goal added', 'success');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            placeholder="Goal Name (e.g., New Headphones, Emergency Fund)"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <input
            type="number"
            required
            min="1"
            placeholder="Target Amount in ₹"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Create Goal
          </button>
        </form>
      </Modal>

      {/* BUDGET TARGETS MODAL */}
      <Modal isOpen={budgetModal} onClose={() => setBudgetModal(false)} title="Set Budget Targets">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await saveProfileSettings({
              ...userProfile,
              weeklyBudget: Number(weeklyB) || 1500,
              monthlyBudget: Number(monthlyB) || 6000
            });
            setBudgetModal(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-xs font-medium block mb-1">Weekly Budget (₹)</label>
            <input
              type="number"
              value={weeklyB}
              onChange={(e) => setWeeklyB(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Monthly Budget (₹)</label>
            <input
              type="number"
              value={monthlyB}
              onChange={(e) => setMonthlyB(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Update Budgets
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 16. MODULE 5: WELLNESS, NUTRITION & DIGITAL WELLBEING
// ============================================================================

function WellnessSuiteModule({
  subTab,
  setSubTab,
  habits,
  waterLogs,
  waterTodayMl,
  handleQuickWater,
  foodLogs,
  weightLogs,
  nutritionToday,
  nutritionTargets,
  screenTimeLogs,
  studyMinutesToday,
  userProfile,
  saveProfileSettings,
  todayStr,
  createRecord,
  updateRecord,
  deleteRecord,
  showToast
}) {
  // Habit Modal
  const [habitModal, setHabitModal] = useState(false);
  const [hTitle, setHTitle] = useState('');
  const [hCategory, setHCategory] = useState('Health');
  const [hFreq, setHFreq] = useState('Daily');

  // Food Modal
  const [foodModal, setFoodModal] = useState(false);
  const [fMeal, setFMeal] = useState('Breakfast');
  const [fMode, setFMode] = useState('indian'); // indian, custom
  const [fDbId, setFDbId] = useState(INDIAN_FOOD_DATABASE[0].id);
  const [fPortion, setFPortion] = useState('1');
  const [fCustomName, setFCustomName] = useState('');
  const [fCal, setFCal] = useState('');
  const [fPro, setFPro] = useState('');
  const [fCarb, setFCarb] = useState('');
  const [fFat, setFFat] = useState('');

  // Nutrition Profile & Weight Log Modal
  const [nutProfileModal, setNutProfileModal] = useState(false);
  const [weightModal, setWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [nutForm, setNutForm] = useState(userProfile.nutrition || {});

  // Digital Wellbeing Screen Log Modal
  const [screenModal, setScreenModal] = useState(false);
  const [appName, setAppName] = useState('');
  const [appMins, setAppMins] = useState('');

  // Calculate last 7 days strings for habit dot matrix
  const last7Days = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      arr.push(`${y}-${m}-${day}`);
    }
    return arr;
  }, []);

  const calcHabitStreak = (habit) => {
    const dates = new Set(habit.completedDates || []);
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dates.has(ds)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Frequently eaten foods derived from user's own foodLogs
  const frequentFoods = useMemo(() => {
    const counts = {};
    foodLogs.forEach((f) => {
      if (!counts[f.name]) counts[f.name] = { count: 0, sample: f };
      counts[f.name].count += 1;
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((x) => x.sample);
  }, [foodLogs]);

  const todaysScreenLogs = useMemo(
    () => screenTimeLogs.filter((s) => s.date === todayStr),
    [screenTimeLogs, todayStr]
  );

  const totalLoggedScreenMinsToday = useMemo(
    () => todaysScreenLogs.reduce((acc, s) => acc + (Number(s.minutes) || 0), 0),
    [todaysScreenLogs]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Wellness & Balance</h1>
        <p className="text-xs text-[#5C665E] dark:text-[#9CA89F]">Habits, hydration, nutrition & mindful screen time</p>
      </div>

      {/* SUB-TABS */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#DCE8DC]/70 dark:bg-[#232B26]">
        {[
          { id: 'habits', label: 'Habits & Water' },
          { id: 'nutrition', label: 'Food & Weight' },
          { id: 'wellbeing', label: 'Screen Time' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`py-1.5 rounded-xl text-xs font-medium transition ${
              subTab === t.id ? 'bg-white dark:bg-[#36473D] shadow-2xs' : 'text-[#5C665E]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SUBTAB A: HABITS & WATER */}
      {subTab === 'habits' && (
        <div className="space-y-4">
          {/* Hydration Card */}
          <Card variant="sage">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold">Hydration Tracker</h3>
              </div>
              <span className="text-xs font-semibold">
                {waterTodayMl} / {userProfile.waterTargetMl} ml
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/80 dark:bg-[#1C2420] mb-3 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (waterTodayMl / (userProfile.waterTargetMl || 2500)) * 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[250, 500, 750].map((ml) => (
                <button
                  key={ml}
                  onClick={() => handleQuickWater(ml)}
                  className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs font-semibold shadow-2xs"
                >
                  +{ml} ml
                </button>
              ))}
              <button
                onClick={async () => {
                  await createRecord('reminders', {
                    title: 'Drink a glass of water',
                    date: todayStr,
                    time: new Date(Date.now() + 60 * 60000).toTimeString().slice(0, 5),
                    category: 'Water',
                    repeat: 'daily',
                    completed: false
                  });
                  showToast('Daily hydration reminder added', 'success');
                }}
                className="ml-auto px-3 py-1.5 rounded-xl bg-[#B7C9B5] dark:bg-[#364D3E] text-xs font-medium"
              >
                + Hydration Alert
              </button>
            </div>
          </Card>

          {/* Habits Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Daily & Weekly Habits</h3>
            <button
              onClick={() => setHabitModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> New Habit
            </button>
          </div>

          {habits.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="Build gentle daily habits"
              description="Track exercise, waking early, reading, English practice, or coding skill sessions."
              actionLabel="Create First Habit"
              onAction={() => setHabitModal(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {habits.map((h) => {
                const doneToday = (h.completedDates || []).includes(todayStr);
                const streak = calcHabitStreak(h);
                return (
                  <Card key={h.id} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const list = h.completedDates || [];
                            const next = doneToday ? list.filter((d) => d !== todayStr) : [...list, todayStr];
                            updateRecord('habits', h.id, { completedDates: next });
                          }}
                        >
                          {doneToday ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#5C665E]" />
                          )}
                        </button>
                        <div>
                          <p className="text-sm font-semibold">{h.title}</p>
                          <p className="text-[11px] text-[#5C665E]">
                            {h.category} • {h.frequency} • {streak} day streak
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deleteRecord('habits', h.id)} className="text-rose-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 7-Day Dot Matrix */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#DCE8DC] dark:border-[#2C3731]">
                      <span className="text-[10px] text-[#5C665E]">Last 7 days</span>
                      <div className="flex gap-1.5">
                        {last7Days.map((ds) => {
                          const completed = (h.completedDates || []).includes(ds);
                          return (
                            <span
                              key={ds}
                              title={ds}
                              className={`w-3.5 h-3.5 rounded-full ${
                                completed ? 'bg-[#5A8364] dark:bg-[#8FB998]' : 'bg-[#DCE8DC] dark:bg-[#2C3731]'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB B: FOOD, NUTRITION & WEIGHT GAIN TRACKER */}
      {subTab === 'nutrition' && (
        <div className="space-y-4">
          {/* Disclaimer Banner */}
          <div className="p-3 rounded-2xl bg-[#E8E2F1]/70 dark:bg-[#2A2633] text-[11px] text-[#3B334A] dark:text-[#D5CBE4] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Nutrition values and calorie targets are educational estimates based on standard Indian food averages and Mifflin-St Jeor equations—not medical or clinical dietary advice.
            </span>
          </div>

          {/* Daily Calorie & Macro Summary Card */}
          <Card variant="sage">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-medium text-[#4A584E] dark:text-[#B7C9B5]">
                  Daily Target ({nutritionTargets.surplus > 0 ? `+${nutritionTargets.surplus} kcal gradual gain` : 'Maintenance'})
                </p>
                <p className="text-xl font-bold mt-0.5">
                  {Math.round(nutritionToday.calories)} / {nutritionTargets.targetCalories} kcal
                </p>
              </div>
              <button
                onClick={() => {
                  setNutForm(userProfile.nutrition || {});
                  setNutProfileModal(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/85 dark:bg-[#1E2622] text-[11px] font-semibold"
              >
                Body Profile
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#B7C9B5]/50 text-center">
              <div className="p-2 rounded-xl bg-white/70 dark:bg-[#1E2622]">
                <p className="text-[10px] text-[#5C665E]">Protein</p>
                <p className="text-xs font-bold">
                  {Math.round(nutritionToday.protein)}g / {nutritionTargets.targetProtein}g
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-[#1E2622]">
                <p className="text-[10px] text-[#5C665E]">Carbs</p>
                <p className="text-xs font-bold">
                  {Math.round(nutritionToday.carbs)}g / {nutritionTargets.targetCarbs}g
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/70 dark:bg-[#1E2622]">
                <p className="text-[10px] text-[#5C665E]">Fat</p>
                <p className="text-xs font-bold">
                  {Math.round(nutritionToday.fat)}g / {nutritionTargets.targetFat}g
                </p>
              </div>
            </div>
          </Card>

          {/* Weight Progress Tracker */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold">Weight Progress</h3>
                <p className="text-[11px] text-[#5C665E]">
                  Current: {userProfile.nutrition?.currentWeightKg || '—'} kg • Target: {userProfile.nutrition?.targetWeightKg || '—'} kg
                </p>
              </div>
              <button
                onClick={() => setWeightModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#DCE8DC] dark:bg-[#2E3D34] text-xs font-semibold"
              >
                + Log Weight
              </button>
            </div>
            {weightLogs.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2">
                {weightLogs.slice(-6).map((w) => (
                  <div key={w.id} className="px-2.5 py-1.5 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D] text-center shrink-0">
                    <p className="text-xs font-bold">{w.weightKg} kg</p>
                    <p className="text-[10px] text-[#5C665E]">{w.date.slice(5)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Frequently Eaten Quick-Add */}
          {frequentFoods.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5">Frequently Eaten (1-Tap Add)</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {frequentFoods.map((f, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      await createRecord('foodLogs', {
                        date: todayStr,
                        mealType: f.mealType || 'Snacks',
                        name: f.name,
                        portions: f.portions || 1,
                        calories: f.calories,
                        protein: f.protein,
                        carbs: f.carbs,
                        fat: f.fat
                      });
                      showToast(`Added ${f.name}`, 'success');
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-[#232B26] border border-[#DCE8DC] text-xs font-medium"
                  >
                    + {f.name} ({f.calories} kcal)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meal Sections */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Today's Food Diary</h3>
            <button
              onClick={() => setFoodModal(true)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Food
            </button>
          </div>

          {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((meal) => {
            const entries = foodLogs.filter((f) => f.date === todayStr && f.mealType === meal);
            const mealCal = entries.reduce((sum, e) => sum + Number(e.calories || 0), 0);
            return (
              <Card key={meal} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{meal}</span>
                  <span className="text-xs text-[#5C665E]">{Math.round(mealCal)} kcal</span>
                </div>
                {entries.length === 0 ? (
                  <p className="text-[11px] text-[#5C665E]">No items logged for {meal.toLowerCase()}.</p>
                ) : (
                  entries.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D]">
                      <div>
                        <p className="font-medium">
                          {item.name} {item.portions > 1 ? `(x${item.portions})` : ''}
                        </p>
                        <p className="text-[10px] text-[#5C665E]">
                          {Math.round(item.calories)} kcal • P: {Math.round(item.protein)}g • C: {Math.round(item.carbs)}g • F: {Math.round(item.fat)}g
                        </p>
                      </div>
                      <button onClick={() => deleteRecord('foodLogs', item.id)} className="text-rose-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* SUBTAB C: DIGITAL WELLBEING & SCREEN TIME */}
      {subTab === 'wellbeing' && (
        <div className="space-y-4">
          <Card variant="lavender">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#5C665E] dark:text-[#B4ADC4]">Daily Recreational Screen Goal</p>
                <p className="text-xl font-bold mt-0.5">
                  {totalLoggedScreenMinsToday} / {userProfile.dailyScreenGoalMins || 180} mins
                </p>
                <p className="text-[11px] text-[#5C665E] dark:text-[#A9A2B8] mt-1">
                  Productive Study Time in OviVerse today: {studyMinutesToday} mins
                </p>
              </div>
              <button
                onClick={() => setScreenModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#362F42] text-xs font-semibold"
              >
                + Log App Usage
              </button>
            </div>
            {totalLoggedScreenMinsToday > (userProfile.dailyScreenGoalMins || 180) && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Gentle mindful alert: You have exceeded your daily screen-time goal.</span>
              </div>
            )}
          </Card>

          {/* Honest Android Permission & Limitation Disclosure */}
          <Card variant="ivory" className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Smartphone className="w-4 h-4 text-[#4B6B53]" />
              <span>Android Digital Wellbeing & PWA Transparency</span>
            </div>
            <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F] leading-relaxed">
              Standard web browsers and PWAs cannot silently read other apps' usage or forcefully block third-party Android apps without native Android <code>PACKAGE_USAGE_STATS</code> and Accessibility permissions. Log your daily Digital Wellbeing stats below to track habits honestly.
            </p>
          </Card>

          {todaysScreenLogs.length === 0 ? (
            <EmptyState
              icon={Smartphone}
              title="No app usage logged today"
              description="Check your phone's Digital Wellbeing dashboard and log your top apps to stay mindful."
              actionLabel="Log App Usage"
              onAction={() => setScreenModal(true)}
            />
          ) : (
            <div className="space-y-2">
              {todaysScreenLogs.map((log) => (
                <Card key={log.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">{log.appName}</p>
                    <p className="text-[11px] text-[#5C665E]">{log.minutes} minutes today</p>
                  </div>
                  <button onClick={() => deleteRecord('screenTimeLogs', log.id)} className="text-rose-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD HABIT */}
      <Modal isOpen={habitModal} onClose={() => setHabitModal(false)} title="Create Habit">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!hTitle.trim()) return;
            await createRecord('habits', {
              title: hTitle.trim(),
              category: hCategory,
              frequency: hFreq,
              completedDates: []
            });
            setHTitle('');
            setHabitModal(false);
            showToast('Habit created', 'success');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            placeholder="e.g., Wake up at 6:30 AM, 20 mins English speaking, Read 10 pages"
            value={hTitle}
            onChange={(e) => setHTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={hCategory}
              onChange={(e) => setHCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              {['Health', 'Exercise', 'Sleep', 'Reading', 'English Practice', 'Skill Learning'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={hFreq}
              onChange={(e) => setHFreq(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Habit
          </button>
        </form>
      </Modal>

      {/* MODAL: LOG FOOD */}
      <Modal isOpen={foodModal} onClose={() => setFoodModal(false)} title="Log Food Entry">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const mult = Math.max(0.25, Number(fPortion) || 1);
            if (fMode === 'indian') {
              const item = INDIAN_FOOD_DATABASE.find((x) => x.id === fDbId) || INDIAN_FOOD_DATABASE[0];
              await createRecord('foodLogs', {
                date: todayStr,
                mealType: fMeal,
                name: item.name,
                portions: mult,
                calories: Math.round(item.calories * mult),
                protein: +(item.protein * mult).toFixed(1),
                carbs: +(item.carbs * mult).toFixed(1),
                fat: +(item.fat * mult).toFixed(1)
              });
            } else {
              if (!fCustomName.trim()) return;
              await createRecord('foodLogs', {
                date: todayStr,
                mealType: fMeal,
                name: fCustomName.trim(),
                portions: mult,
                calories: Math.round((Number(fCal) || 0) * mult),
                protein: +((Number(fPro) || 0) * mult).toFixed(1),
                carbs: +((Number(fCarb) || 0) * mult).toFixed(1),
                fat: +((Number(fFat) || 0) * mult).toFixed(1)
              });
            }
            setFoodModal(false);
            showToast('Food logged to diary', 'success');
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            {['indian', 'custom'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFMode(m)}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  fMode === m ? 'bg-[#B7C9B5] dark:bg-[#3B5242]' : 'bg-white dark:bg-[#252E29]'
                }`}
              >
                {m === 'indian' ? 'Indian Food List' : 'Custom Food'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={fMeal}
              onChange={(e) => setFMeal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.25"
              min="0.25"
              placeholder="Portion multiplier (1)"
              value={fPortion}
              onChange={(e) => setFPortion(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            />
          </div>

          {fMode === 'indian' ? (
            <select
              value={fDbId}
              onChange={(e) => setFDbId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              {INDIAN_FOOD_DATABASE.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.calories} kcal ({f.protein}g P)
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                type="text"
                required
                placeholder="Food Name"
                value={fCustomName}
                onChange={(e) => setFCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  placeholder="Kcal"
                  value={fCal}
                  onChange={(e) => setFCal(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-xs"
                />
                <input
                  type="number"
                  placeholder="Prot (g)"
                  value={fPro}
                  onChange={(e) => setFPro(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-xs"
                />
                <input
                  type="number"
                  placeholder="Carb (g)"
                  value={fCarb}
                  onChange={(e) => setFCarb(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-xs"
                />
                <input
                  type="number"
                  placeholder="Fat (g)"
                  value={fFat}
                  onChange={(e) => setFFat(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-xs"
                />
              </div>
            </>
          )}

          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Food Entry
          </button>
        </form>
      </Modal>

      {/* MODAL: NUTRITION BODY PROFILE */}
      <Modal isOpen={nutProfileModal} onClose={() => setNutProfileModal(false)} title="Body & Calorie Goal Profile">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await saveProfileSettings({
              ...userProfile,
              nutrition: {
                ...nutForm,
                age: Number(nutForm.age) || 20,
                heightCm: Number(nutForm.heightCm) || 170,
                currentWeightKg: Number(nutForm.currentWeightKg) || 58,
                targetWeightKg: Number(nutForm.targetWeightKg) || 64
              }
            });
            setNutProfileModal(false);
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1">Age (years)</label>
              <input
                type="number"
                value={nutForm.age || ''}
                onChange={(e) => setNutForm({ ...nutForm, age: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Height (cm)</label>
              <input
                type="number"
                value={nutForm.heightCm || ''}
                onChange={(e) => setNutForm({ ...nutForm, heightCm: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={nutForm.currentWeightKg || ''}
                onChange={(e) => setNutForm({ ...nutForm, currentWeightKg: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={nutForm.targetWeightKg || ''}
                onChange={(e) => setNutForm({ ...nutForm, targetWeightKg: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1">Activity Level</label>
            <select
              value={nutForm.activityLevel || 'moderate'}
              onChange={(e) => setNutForm({ ...nutForm, activityLevel: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
            >
              <option value="sedentary">Sedentary (Mostly sitting/studying)</option>
              <option value="light">Lightly Active (Walking to campus)</option>
              <option value="moderate">Moderately Active (Exercise 3-4x/week)</option>
              <option value="active">Very Active (Sports / Daily workout)</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Calculate & Save Targets
          </button>
        </form>
      </Modal>

      {/* MODAL: LOG WEIGHT */}
      <Modal isOpen={weightModal} onClose={() => setWeightModal(false)} title="Log Weight Entry">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newWeight) return;
            const wNum = Number(newWeight);
            await createRecord('weightLogs', { date: todayStr, weightKg: wNum });
            await saveProfileSettings({
              ...userProfile,
              nutrition: { ...(userProfile.nutrition || {}), currentWeightKg: wNum }
            });
            setNewWeight('');
            setWeightModal(false);
          }}
          className="space-y-3"
        >
          <input
            type="number"
            step="0.1"
            required
            placeholder="Weight in kg (e.g., 58.6)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Weight
          </button>
        </form>
      </Modal>

      {/* MODAL: LOG SCREEN TIME */}
      <Modal isOpen={screenModal} onClose={() => setScreenModal(false)} title="Log App Usage">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!appName.trim() || !appMins) return;
            await createRecord('screenTimeLogs', {
              date: todayStr,
              appName: appName.trim(),
              minutes: Number(appMins)
            });
            setAppName('');
            setAppMins('');
            setScreenModal(false);
            showToast('Screen time logged', 'success');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            placeholder="App Name (e.g., Instagram, YouTube, WhatsApp)"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <input
            type="number"
            required
            min="1"
            placeholder="Minutes used today"
            value={appMins}
            onChange={(e) => setAppMins(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
            Save Usage
          </button>
        </form>
      </Modal>
    </div>
  );
}

// ============================================================================
// 17. MODULE 6: PROFILE HUB (REMINDERS, JOURNAL, GROWTH, REPORTS, CLOUD/BACKUP)
// ============================================================================

function ProfileAndHubModule({
  subTab,
  setSubTab,
  user,
  authMode,
  firebaseServices,
  customFirebaseConfig,
  setCustomFirebaseConfig,
  userProfile,
  saveProfileSettings,
  notifPermission,
  requestNotificationAccess,
  reminders,
  journalEntries,
  growthItems,
  allData,
  todayStr,
  createRecord,
  updateRecord,
  deleteRecord,
  showToast
}) {
  // Reminder states
  const [remModal, setRemModal] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState(todayStr);
  const [remTime, setRemTime] = useState('09:00');
  const [remCat, setRemCat] = useState('Personal');
  const [remRepeat, setRemRepeat] = useState('none');

  // Journal states
  const [jDate, setJDate] = useState(todayStr);
  const [jMood, setJMood] = useState('Peaceful');
  const [g1, setG1] = useState('');
  const [g2, setG2] = useState('');
  const [g3, setG3] = useState('');
  const [bestMoment, setBestMoment] = useState('');
  const [lesson, setLesson] = useState('');
  const [tomorrowImp, setTomorrowImp] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [jSearch, setJSearch] = useState('');

  // Personal Growth states
  const [growthModal, setGrowthModal] = useState(false);
  const [gCat, setGCat] = useState('Skill');
  const [gTitle, setGTitle] = useState('');
  const [gNotes, setGNotes] = useState('');
  const [gAttachmentUrl, setGAttachmentUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Settings & Firebase states
  const [nameInput, setNameInput] = useState(userProfile.displayName || 'Student');
  const [waterGoalInput, setWaterGoalInput] = useState(userProfile.waterTargetMl || 2500);
  const [screenGoalInput, setScreenGoalInput] = useState(userProfile.dailyScreenGoalMins || 180);
  const [fbJsonInput, setFbJsonInput] = useState(customFirebaseConfig);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    if (!firebaseServices.auth) {
      showToast('Configure Firebase keys below first to enable Google Sign-In', 'info');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseServices.auth, provider);
      showToast('Signed in with Google!', 'success');
    } catch (err) {
      console.error('Google Sign-In error:', err);
      showToast(`Sign-In notice: ${err.message}`, 'error');
    }
  };

  // JSON Export Backup
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OviVerse_Backup_${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Full JSON backup exported', 'success');
  };

  // JSON Restore Backup
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const collectionsToRestore = [
          'tasks', 'subjects', 'timetable', 'assignments', 'academicRecords',
          'transactions', 'savingsGoals', 'habits', 'waterLogs', 'foodLogs',
          'weightLogs', 'studySessions', 'reminders', 'journalEntries', 'growthItems'
        ];
        for (const col of collectionsToRestore) {
          if (Array.isArray(parsed[col])) {
            for (const item of parsed[col]) {
              const { id, ...rest } = item;
              await createRecord(col, rest);
            }
          }
        }
        if (parsed.userProfile) await saveProfileSettings(parsed.userProfile);
        showToast('Backup restored successfully!', 'success');
      } catch (err) {
        showToast('Invalid backup JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Complete Account & Data Deletion
  const handleCompleteDeletion = async () => {
    try {
      if (authMode === 'firebase' && firebaseServices.db && user) {
        const collections = [
          'tasks', 'subjects', 'timetable', 'scheduleOverrides', 'assignments',
          'academicRecords', 'transactions', 'savingsGoals', 'habits', 'waterLogs',
          'foodLogs', 'weightLogs', 'studySessions', 'screenTimeLogs', 'reminders',
          'journalEntries', 'growthItems'
        ];
        for (const col of collections) {
          const snap = await getDocs(collection(firebaseServices.db, 'artifacts', APP_ID, 'users', user.uid, col));
          for (const d of snap.docs) {
            await deleteDoc(d.ref);
          }
        }
        if (firebaseServices.auth?.currentUser) {
          await deleteUser(firebaseServices.auth.currentUser).catch(() => signOut(firebaseServices.auth));
        }
      }
      setDeleteConfirmModal(false);
      showToast('All personal records deleted', 'info');
    } catch (err) {
      showToast('Error deleting account data', 'error');
    }
  };

  // Upload document attachment to Firebase Storage (or fallback data URL)
  const handleFileAttachment = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      if (authMode === 'firebase' && firebaseServices.storage && user) {
        const sRef = storageRef(firebaseServices.storage, `users/${user.uid}/attachments/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        setGAttachmentUrl(url);
        showToast('Document uploaded to cloud storage', 'success');
      } else {
        if (file.size > 400000) {
          showToast('In local mode, keep attachments under 400KB', 'error');
        } else {
          const reader = new FileReader();
          reader.onload = () => setGAttachmentUrl(reader.result);
          reader.readAsDataURL(file);
          showToast('Document attached locally', 'success');
        }
      }
    } catch (err) {
      showToast('Attachment upload failed', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SUB-NAVIGATION HEADER WHEN INSIDE A PROFILE SECTION */}
      {subTab !== 'hub' && (
        <button
          onClick={() => setSubTab('hub')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#486850] dark:text-[#B7C9B5]"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Profile Hub
        </button>
      )}

      {/* HUB OVERVIEW */}
      {subTab === 'hub' && (
        <div className="space-y-4">
          <Card variant="sage" className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B7C9B5] dark:bg-[#364D3E] flex items-center justify-center text-base font-bold">
                {(userProfile.displayName || 'S')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-base font-bold">{userProfile.displayName}</h1>
                <p className="text-xs text-[#4D5950] dark:text-[#B4C0B7]">
                  {user?.email || (authMode === 'firebase' ? 'Cloud Synced Account' : 'Local-First Mode')}
                </p>
              </div>
            </div>
            {authMode === 'firebase' && user?.isAnonymous && (
              <button
                onClick={handleGoogleSignIn}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E2622] text-xs font-semibold shadow-2xs"
              >
                Google Sign-In
              </button>
            )}
          </Card>

          {/* 5 INTEGRATED LIFE MODULES GRID */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'reminders', title: 'Reminders', sub: `${reminders.filter((r) => !r.completed).length} active`, icon: Bell, variant: 'default' },
              { id: 'journal', title: 'Gratitude Journal', sub: `${journalEntries.length} entries`, icon: Sparkles, variant: 'lavender' },
              { id: 'growth', title: 'Personal Growth', sub: `${growthItems.length} milestones`, icon: Award, variant: 'sage' },
              { id: 'reports', title: 'Life Reports', sub: 'Weekly & Monthly', icon: BarChart2, variant: 'default' },
              { id: 'settings', title: 'Cloud & Backup', sub: 'Firebase, JSON, Reset', icon: Settings, variant: 'ivory' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  variant={item.variant}
                  onClick={() => setSubTab(item.id)}
                  className="flex flex-col justify-between min-h-[96px]"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-[#1E2622] flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{item.title}</p>
                    <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F]">{item.sub}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 1: REMINDERS & ANDROID NOTIFICATIONS */}
      {subTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Reminders & Notifications</h2>
            <button
              onClick={() => setRemModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> New Reminder
            </button>
          </div>

          {/* Honest Android / Browser Notification Permission Card */}
          <Card variant="lavender" className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Device Notification Status: {notifPermission.toUpperCase()}</span>
              {notifPermission !== 'granted' && (
                <button
                  onClick={requestNotificationAccess}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-[#362F42] text-xs font-semibold"
                >
                  Enable Alerts
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#4A4259] dark:text-[#C8BBE0] leading-relaxed">
              On Android Chrome, install OviVerse ("Add to Home Screen") and allow Notifications. Note: Web apps trigger chimes and system banners while active or in background memory; strict Doze-mode wakeups require a native Android wrapper (Capacitor/TWA) with <code>SCHEDULE_EXACT_ALARM</code>.
            </p>
          </Card>

          {reminders.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No reminders scheduled"
              description="Set gentle alerts for water, classes, workouts, and personal routines."
              actionLabel="Add Reminder"
              onAction={() => setRemModal(true)}
            />
          ) : (
            <div className="space-y-2">
              {reminders.map((rem) => (
                <Card key={rem.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => updateRecord('reminders', rem.id, { completed: !rem.completed })}>
                      {rem.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#5C665E]" />
                      )}
                    </button>
                    <div>
                      <p className={`text-xs font-semibold ${rem.completed ? 'line-through opacity-60' : ''}`}>
                        {rem.title}
                      </p>
                      <p className="text-[11px] text-[#5C665E]">
                        {rem.snoozedUntil || rem.time} • {rem.repeat === 'daily' ? 'Daily' : rem.date} • {rem.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!rem.completed && (
                      <button
                        onClick={() => {
                          const d = new Date(Date.now() + 10 * 60000);
                          const snoozeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                          updateRecord('reminders', rem.id, { snoozedUntil: snoozeStr });
                          showToast(`Snoozed until ${snoozeStr}`, 'info');
                        }}
                        className="px-2 py-1 rounded-lg bg-[#E8E2F1] dark:bg-[#362F42] text-[10px] font-semibold"
                      >
                        Snooze 10m
                      </button>
                    )}
                    <button onClick={() => deleteRecord('reminders', rem.id)} className="text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Modal isOpen={remModal} onClose={() => setRemModal(false)} title="Create Reminder">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!remTitle.trim()) return;
                await createRecord('reminders', {
                  title: remTitle.trim(),
                  date: remDate,
                  time: remTime,
                  category: remCat,
                  repeat: remRepeat,
                  completed: false
                });
                setRemTitle('');
                setRemModal(false);
                showToast('Reminder saved', 'success');
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                placeholder="Reminder Title"
                value={remTitle}
                onChange={(e) => setRemTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={remDate}
                  onChange={(e) => setRemDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
                />
                <input
                  type="time"
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={remCat}
                  onChange={(e) => setRemCat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
                >
                  {['Personal', 'College', 'Water', 'Exercise', 'Task', 'Event'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={remRepeat}
                  onChange={(e) => setRemRepeat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
                >
                  <option value="none">One-time</option>
                  <option value="daily">Every Day</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm">
                Save Reminder
              </button>
            </form>
          </Modal>
        </div>
      )}

      {/* SECTION 2: GRATITUDE JOURNAL & PRIVATE DIARY */}
      {subTab === 'journal' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold">Gratitude Journal & Private Diary</h2>

          <Card variant="sage">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await createRecord('journalEntries', {
                  date: jDate,
                  mood: jMood,
                  grateful1: g1.trim(),
                  grateful2: g2.trim(),
                  grateful3: g3.trim(),
                  bestMoment: bestMoment.trim(),
                  lesson: lesson.trim(),
                  tomorrowImprovement: tomorrowImp.trim(),
                  diary: diaryText.trim()
                });
                setG1('');
                setG2('');
                setG3('');
                setBestMoment('');
                setLesson('');
                setTomorrowImp('');
                setDiaryText('');
                showToast('Reflection saved privately', 'success');
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={jDate}
                  onChange={(e) => setJDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
                />
                <select
                  value={jMood}
                  onChange={(e) => setJMood(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
                >
                  {['Peaceful', 'Grateful', 'Focused', 'Happy', 'Tired', 'Stressed'].map((m) => (
                    <option key={m} value={m}>Mood: {m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold">Three things I am grateful for today:</p>
                <input
                  type="text"
                  placeholder="1. First gratitude..."
                  value={g1}
                  onChange={(e) => setG1(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
                />
                <input
                  type="text"
                  placeholder="2. Second gratitude..."
                  value={g2}
                  onChange={(e) => setG2(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
                />
                <input
                  type="text"
                  placeholder="3. Third gratitude..."
                  value={g3}
                  onChange={(e) => setG3(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
                />
              </div>

              <input
                type="text"
                placeholder="Best moment of today..."
                value={bestMoment}
                onChange={(e) => setBestMoment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Lesson learned..."
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
                />
                <input
                  type="text"
                  placeholder="Tomorrow's improvement..."
                  value={tomorrowImp}
                  onChange={(e) => setTomorrowImp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Private diary thoughts..."
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#2C332E] dark:bg-[#EDEBE3] text-white dark:text-[#181D1A] text-xs font-semibold">
                Save Journal Entry
              </button>
            </form>
          </Card>

          <input
            type="text"
            placeholder="Search past journal entries..."
            value={jSearch}
            onChange={(e) => setJSearch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#222925] border border-[#DCE8DC] text-xs"
          />

          <div className="space-y-2.5">
            {journalEntries
              .filter((j) =>
                jSearch.trim() === ''
                  ? true
                  : JSON.stringify(j).toLowerCase().includes(jSearch.toLowerCase())
              )
              .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
              .map((entry) => (
                <Card key={entry.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{entry.date}</span>
                      <Badge color="lavender">{entry.mood}</Badge>
                    </div>
                    <button onClick={() => deleteRecord('journalEntries', entry.id)} className="text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {(entry.grateful1 || entry.grateful2 || entry.grateful3) && (
                    <p className="text-xs text-[#486850] dark:text-[#B7C9B5]">
                      Grateful for: {[entry.grateful1, entry.grateful2, entry.grateful3].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  {entry.bestMoment && <p className="text-xs">Best moment: {entry.bestMoment}</p>}
                  {entry.diary && <p className="text-xs text-[#5C665E] dark:text-[#9CA89F]">{entry.diary}</p>}
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* SECTION 3: PERSONAL GROWTH & PORTFOLIO */}
      {subTab === 'growth' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Personal Growth & Portfolio</h2>
            <button
              onClick={() => setGrowthModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Milestone
            </button>
          </div>

          {growthItems.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Document your growth journey"
              description="Save certificates, internships, skills, English vocabulary, books read, and career goals."
              actionLabel="Add First Entry"
              onAction={() => setGrowthModal(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {growthItems.map((item) => (
                <Card key={item.id} className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{item.title}</span>
                        <Badge color="sage">{item.category}</Badge>
                      </div>
                      {item.notes && <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] mt-1">{item.notes}</p>}
                      {item.attachmentUrl && (
                        <a
                          href={item.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#486850] dark:text-[#B7C9B5] mt-1.5 underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Attached Document
                        </a>
                      )}
                    </div>
                    <button onClick={() => deleteRecord('growthItems', item.id)} className="text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Modal isOpen={growthModal} onClose={() => setGrowthModal(false)} title="Add Personal Growth Milestone">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!gTitle.trim()) return;
                await createRecord('growthItems', {
                  category: gCat,
                  title: gTitle.trim(),
                  notes: gNotes.trim(),
                  attachmentUrl: gAttachmentUrl,
                  date: todayStr
                });
                setGTitle('');
                setGNotes('');
                setGAttachmentUrl('');
                setGrowthModal(false);
                showToast('Growth milestone saved', 'success');
              }}
              className="space-y-3"
            >
              <select
                value={gCat}
                onChange={(e) => setGCat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              >
                {[
                  'Skill', 'Certificate', 'Internship', 'Achievement',
                  'English Vocabulary', 'Book Read', 'Course', 'Career Goal'
                ].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Title (e.g., AWS Cloud Practitioner / Word: Equanimity)"
                value={gTitle}
                onChange={(e) => setGTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
              <textarea
                rows={3}
                placeholder="Meaning, example sentence, key takeaways, or certificate ID..."
                value={gNotes}
                onChange={(e) => setGNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#252E29] border border-[#DCE8DC] text-sm"
              />
              <div>
                <label className="text-xs font-medium block mb-1">Attach Certificate / Document (Optional)</label>
                <input type="file" onChange={handleFileAttachment} className="text-xs" />
                {uploadingFile && <p className="text-[11px] text-amber-700 mt-1">Uploading attachment...</p>}
              </div>
              <button
                type="submit"
                disabled={uploadingFile}
                className="w-full py-2.5 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] font-semibold text-sm"
              >
                Save Milestone
              </button>
            </form>
          </Modal>
        </div>
      )}

      {/* SECTION 4: REPORTS & REFLECTIONS */}
      {subTab === 'reports' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold">Life & Progress Reports</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card variant="sage">
              <p className="text-xs text-[#4A584E] dark:text-[#B7C9B5]">Total Tasks Completed</p>
              <p className="text-2xl font-bold mt-1">
                {allData.tasks.filter((t) => t.completed || (t.completedDates && t.completedDates.length > 0)).length}
              </p>
            </Card>
            <Card variant="lavender">
              <p className="text-xs text-[#5C665E] dark:text-[#B4ADC4]">Total Study Logged</p>
              <p className="text-2xl font-bold mt-1">
                {Math.round(allData.studySessions.reduce((a, s) => a + (Number(s.minutes) || 0), 0) / 60)} hrs
              </p>
            </Card>
            <Card>
              <p className="text-xs text-[#5C665E]">Total Expenses Logged</p>
              <p className="text-xl font-bold mt-1">
                ₹{allData.transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + Number(t.amount || 0), 0).toLocaleString('en-IN')}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-[#5C665E]">Journal Reflections</p>
              <p className="text-xl font-bold mt-1">{journalEntries.length} days</p>
            </Card>
          </div>

          <Card variant="ivory" className="space-y-2">
            <h3 className="text-xs font-bold">Automated Reflection Summary</h3>
            <p className="text-xs text-[#5C665E] dark:text-[#9CA89F] leading-relaxed">
              {allData.tasks.length === 0 && allData.studySessions.length === 0
                ? 'Start logging your daily tasks, meals, study sessions, and expenses to unlock personalized weekly & monthly insights.'
                : `You have tracked ${allData.subjects.length} college subjects, logged ${allData.foodLogs.length} meals, and recorded ${allData.habits.length} personal habits. Consistency in small daily actions compounds peacefully over the semester.`}
            </p>
          </Card>
        </div>
      )}

      {/* SECTION 5: CLOUD SETTINGS, FIREBASE CONFIG, BACKUP & ACCOUNT DELETION */}
      {subTab === 'settings' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold">Settings, Cloud & Data Control</h2>

          {/* Personal Targets */}
          <Card className="space-y-3">
            <h3 className="text-xs font-bold">Personal Preferences</h3>
            <div>
              <label className="text-xs block mb-1">Your Display Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D] border border-[#DCE8DC] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1">Daily Water Target (ml)</label>
                <input
                  type="number"
                  value={waterGoalInput}
                  onChange={(e) => setWaterGoalInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D] border border-[#DCE8DC] text-xs"
                />
              </div>
              <div>
                <label className="text-xs block mb-1">Daily Screen Limit (mins)</label>
                <input
                  type="number"
                  value={screenGoalInput}
                  onChange={(e) => setScreenGoalInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D] border border-[#DCE8DC] text-xs"
                />
              </div>
            </div>
            <button
              onClick={() =>
                saveProfileSettings({
                  ...userProfile,
                  displayName: nameInput.trim() || 'Student',
                  waterTargetMl: Number(waterGoalInput) || 2500,
                  dailyScreenGoalMins: Number(screenGoalInput) || 180
                })
              }
              className="w-full py-2 rounded-xl bg-[#B7C9B5] dark:bg-[#3B5242] text-xs font-semibold"
            >
              Save Preferences
            </button>
          </Card>

          {/* Backup & Restore */}
          <Card variant="sage" className="space-y-3">
            <h3 className="text-xs font-bold">Backup & Restore (JSON)</h3>
            <p className="text-[11px] text-[#4D5950] dark:text-[#B4C0B7]">
              Download an encrypted-ready portable JSON copy of all your OviVerse records anytime, or restore from a previous backup.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJson}
                className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Export Backup
              </button>
              <label className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/90 dark:bg-[#1E2622] text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Restore JSON
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </Card>

          {/* Firebase Project Configuration */}
          <Card className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold">Firebase Cloud Setup</h3>
              <Badge color={authMode === 'firebase' ? 'eucalyptus' : 'amber'}>
                {authMode === 'firebase' ? 'Connected' : 'Local-First Mode'}
              </Badge>
            </div>
            <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F]">
              Paste your Firebase Web App config JSON below to enable Google Sign-In, Cloud Firestore sync across devices, and Firebase Storage attachments.
            </p>
            <textarea
              rows={4}
              placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","appId":"..."}'
              value={fbJsonInput}
              onChange={(e) => setFbJsonInput(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#F7F5EC] dark:bg-[#1A201D] border border-[#DCE8DC] font-mono text-[11px]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCustomFirebaseConfig(fbJsonInput)}
                className="flex-1 py-2 rounded-xl bg-[#2C332E] dark:bg-[#EDEBE3] text-white dark:text-[#181D1A] text-xs font-semibold"
              >
                Connect Firebase
              </button>
              {authMode === 'firebase' && (
                <button
                  onClick={handleGoogleSignIn}
                  className="px-3 py-2 rounded-xl bg-[#DCE8DC] dark:bg-[#2F4036] text-xs font-semibold"
                >
                  Google Sign-In
                </button>
              )}
            </div>
          </Card>

          {/* Danger Zone: Delete Account & All Records */}
          <Card className="border-rose-300 dark:border-rose-900/60 space-y-2">
            <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400">Delete Account & All Data</h3>
            <p className="text-[11px] text-[#5C665E] dark:text-[#9CA89F]">
              Permanently erase all your Firestore collections and remove your account. This action cannot be undone.
            </p>
            <button
              onClick={() => setDeleteConfirmModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
            >
              Delete All My Data
            </button>
          </Card>

          <Modal isOpen={deleteConfirmModal} onClose={() => setDeleteConfirmModal(false)} title="Confirm Permanent Deletion">
            <div className="space-y-4">
              <p className="text-xs leading-relaxed">
                Are you sure you want to permanently delete all your tasks, college records, transactions, nutrition logs, journal entries, and account data? Export a JSON backup first if you wish to keep a copy.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#DCE8DC] dark:bg-[#2A352F] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteDeletion}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                >
                  Yes, Delete Everything
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}