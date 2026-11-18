import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Calendar, BookOpen, Wallet, Heart, User, Plus, X,
  Bell, Moon, Sun, Sparkles, Droplets, Flame, Trash2,
  Send, Volume2, ArrowUpRight, ArrowDownLeft,
  Users, CheckCircle2, Download, Briefcase, Clock, AlertTriangle
} from 'lucide-react';

// --- SAFE LOCALSTORAGE HOOK ---
function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [key, state]);

  return [state, setState];
}

// --- WEB AUDIO SYNTHESIZED RINGTONES ---
const RINGTONES = [
  { id: 'sunrise', name: 'Morning Sunrise Chime', notes: [523.25, 659.25, 783.99, 1046.5] },
  { id: 'temple', name: 'Temple Bell Calm', notes: [440, 554.37, 659.25, 880] },
  { id: 'marimba', name: 'Marimba Breeze', notes: [587.33, 739.99, 880, 1174.66] },
  { id: 'pulse', name: 'Digital Focus Pulse', notes: [880, 880, 1046.5, 880] },
  { id: 'harp', name: 'Soft Harp Arpeggio', notes: [392.0, 493.88, 587.33, 783.99] }
];

function playToneSequence(toneId) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const tone = RINGTONES.find((r) => r.id === toneId) || RINGTONES[0];

    tone.notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = toneId === 'pulse' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.22);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + idx * 0.22 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.22);
      osc.stop(ctx.currentTime + idx * 0.22 + 0.48);
    });
  } catch (e) {
    console.warn('Audio playback blocked until interaction:', e);
  }
}

// --- INDIAN FOOD QUICK DATABASE ---
const INDIAN_FOOD_DB = [
  { name: 'Dosa (1 Plain)', kcal: 133 },
  { name: 'Masala Dosa (1)', kcal: 250 },
  { name: 'Idli (2 pcs)', kcal: 116 },
  { name: 'Sambar (1 bowl)', kcal: 110 },
  { name: 'Coconut Chutney (2 tbsp)', kcal: 75 },
  { name: 'Chapati / Roti (1)', kcal: 104 },
  { name: 'Steamed Rice (1 cup)', kcal: 205 },
  { name: 'Curd Rice (1 bowl)', kcal: 220 },
  { name: 'Pomegranate (1 bowl)', kcal: 120 },
  { name: 'Guava (1 medium)', kcal: 68 },
  { name: 'Banana (1 medium)', kcal: 105 },
  { name: 'Milk (1 cup / 250ml)', kcal: 150 },
  { name: 'Boiled Egg (1)', kcal: 78 },
  { name: 'Filter Coffee / Tea (1 cup)', kcal: 90 },
  { name: 'Upma / Poha (1 bowl)', kcal: 195 },
  { name: 'Dal Tadka (1 bowl)', kcal: 160 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = usePersistentState('oviverse_dark', false);
  const todayStr = new Date().toISOString().split('T')[0];

  // User Profile
  const [profile, setProfile] = usePersistentState('oviverse_profile', {
    name: 'Ovi',
    waterGoal: 2500,
    calorieGoal: 1800,
    geminiApiKey: ''
  });

  // ================= COLLEGE: DAY ORDER TIMETABLE, BAG MATERIALS, COMPONENTS & EXAMS =================
  const [currentDayOrder, setCurrentDayOrder] = usePersistentState('oviverse_current_do', 'Day Order 1');
  const [selectedDoView, setSelectedDoView] = useState('Day Order 1');
  const [collegeSubTab, setCollegeSubTab] = useState('timetable'); // 'timetable' | 'components' | 'exams' | 'subjects'

  // Day Order Timetable + Bag Materials
  const [dayOrderSchedule, setDayOrderSchedule] = usePersistentState('oviverse_do_schedule', {
    'Day Order 1': [
      { id: 'do1_1', period: '1st Hour (8:30 AM)', subject: 'Financial Management', materials: 'Calculator, FM Notebook' },
      { id: 'do1_2', period: '2nd Hour (9:30 AM)', subject: 'Business Law', materials: 'Law Bare Act / Notes' }
    ],
    'Day Order 2': [
      { id: 'do2_1', period: '1st Hour (8:30 AM)', subject: 'Marketing Management', materials: 'Case Study File' }
    ],
    'Day Order 3': [],
    'Day Order 4': [],
    'Day Order 5': [],
    'Day Order 6': []
  });
  const [packedToday, setPackedToday] = usePersistentState('oviverse_packed_today', {});
  const [newPeriodTime, setNewPeriodTime] = useState('');
  const [newPeriodSubject, setNewPeriodSubject] = useState('');
  const [newPeriodMaterials, setNewPeriodMaterials] = useState('');

  // Components (Activities / Assignments per Subject with Reminders)
  const [components, setComponents] = usePersistentState('oviverse_components', [
    {
      id: 'c1',
      subject: 'Financial Management',
      title: 'Component 1: Capital Budgeting Assignment',
      dueDate: '2026-11-22',
      reminderTime: '07:30',
      done: false
    },
    {
      id: 'c2',
      subject: 'Business Law',
      title: 'Component 2: Sales of Goods Act Case Presentation',
      dueDate: '2026-11-25',
      reminderTime: '08:00',
      done: false
    }
  ]);
  const [compSubject, setCompSubject] = useState('');
  const [compTitle, setCompTitle] = useState('');
  const [compDueDate, setCompDueDate] = useState('');
  const [compReminderTime, setCompReminderTime] = useState('07:30');

  // Exam Timetable & Countdown
  const [exams, setExams] = usePersistentState('oviverse_exams', [
    { id: 'ex1', subject: 'Financial Management', date: '2026-12-02', session: 'FN (9:30 AM)', syllabus: 'Units 1 to 4 (Cost of Capital, Capital Budgeting)' },
    { id: 'ex2', subject: 'Business Law', date: '2026-12-05', session: 'FN (9:30 AM)', syllabus: 'Sales of Goods Act & Contract Essentials' }
  ]);
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examSession, setExamSession] = useState('FN (9:30 AM)');
  const [examSyllabus, setExamSyllabus] = useState('');

  // Subjects & Revision Status
  const [subjects, setSubjects] = usePersistentState('oviverse_subjects', [
    { id: 1, name: 'Financial Management', status: 'Revised', nextReview: 'In 3 days' },
    { id: 2, name: 'Business Law (Sales of Goods Act)', status: 'First Read', nextReview: 'Tomorrow' }
  ]);
  const [newSubject, setNewSubject] = useState('');

  // ================= MONTHLY TO-DO MATRIX =================
  const now = new Date();
  const [matrixYear, setMatrixYear] = useState(now.getFullYear());
  const [matrixMonth, setMatrixMonth] = useState(now.getMonth());
  const [matrixTasks, setMatrixTasks] = usePersistentState('oviverse_matrix_tasks', [
    { id: 'm1', title: 'Wake up before 6:30 AM' },
    { id: 'm2', title: 'Drink 2.5L Water' },
    { id: 'm3', title: '1 Hr Financial Mgmt / BBA Study' },
    { id: 'm4', title: 'Eat Fruits & Healthy Meals' },
    { id: 'm5', title: 'Evening Walk / Stretch (20m)' }
  ]);
  const [matrixLogs, setMatrixLogs] = usePersistentState('oviverse_matrix_logs', {});
  const [newMatrixTask, setNewMatrixTask] = useState('');

  const [tasks, setTasks] = usePersistentState('oviverse_tasks', [
    { id: 1, title: 'Revise Capital Budgeting 5-mark notes', done: false }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // ================= MONEY MANAGER =================
  const [startingBalance, setStartingBalance] = usePersistentState('oviverse_start_balance', 2000);
  const [monthlyBudget, setMonthlyBudget] = usePersistentState('oviverse_budget', 3000);
  const [transactions, setTransactions] = usePersistentState('oviverse_transactions', [
    { id: 1, type: 'income', title: 'Pocket Money from Parents', amount: 1500, date: '2026-11-15' },
    { id: 2, type: 'expense', title: 'College Canteen & Fruit Juice', amount: 120, date: '2026-11-16' }
  ]);
  const [txType, setTxType] = useState('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');

  const [ious, setIous] = usePersistentState('oviverse_ious', [
    { id: 1, person: 'College Friend', reason: 'Auto & Printouts split', amount: 80, settled: false }
  ]);
  const [iouPerson, setIouPerson] = useState('');
  const [iouReason, setIouReason] = useState('');
  const [iouAmount, setIouAmount] = useState('');

  // ================= FOOD & HYDRATION =================
  const [foodLogs, setFoodLogs] = usePersistentState('oviverse_food_logs', []);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [mealTag, setMealTag] = useState('Breakfast');
  const [pendingMealItems, setPendingMealItems] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(INDIAN_FOOD_DB[0].name);
  const [presetQty, setPresetQty] = useState(1);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodKcal, setCustomFoodKcal] = useState('');

  const [waterLogs, setWaterLogs] = usePersistentState('oviverse_water', {});
  const todayWater = waterLogs[todayStr] || 0;

  // ================= FULL-SCREEN ALARMS =================
  const [alarms, setAlarms] = usePersistentState('oviverse_alarms', [
    { id: 1, time: '06:30', label: 'Morning College Prep & Bag Check', tone: 'sunrise', snoozeMins: 10, active: true },
    { id: 2, time: '19:30', label: 'Daily BBA Component & Exam Prep', tone: 'temple', snoozeMins: 5, active: true }
  ]);
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [newAlarmTone, setNewAlarmTone] = useState('sunrise');
  const [newAlarmSnooze, setNewAlarmSnooze] = useState(10);
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const [lastTriggeredMinute, setLastTriggeredMinute] = useState('');
  const ringIntervalRef = useRef(null);

  // ================= OVIAI CHATBOT =================
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = usePersistentState('oviverse_chat', [
    {
      role: 'assistant',
      text: 'Vanakkam Ovi! Ask me about today’s Day Order classes, materials to pack, upcoming exams, pending components, or your cash balance!'
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- ALARM CHECKER ---
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;

      if (currentHHMM !== lastTriggeredMinute) {
        const match = alarms.find((a) => a.active && a.time === currentHHMM);
        if (match) {
          setLastTriggeredMinute(currentHHMM);
          triggerFullScreenAlarm(match);
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [alarms, lastTriggeredMinute]);

  const triggerFullScreenAlarm = (alarmObj) => {
    setRingingAlarm(alarmObj);
    playToneSequence(alarmObj.tone || 'sunrise');
    if (navigator.vibrate) navigator.vibrate([500, 250, 500, 250, 700]);

    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = setInterval(() => {
      playToneSequence(alarmObj.tone || 'sunrise');
      if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
    }, 2600);
  };

  const stopAlarmSound = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);
    setRingingAlarm(null);
  };

  const snoozeAlarm = () => {
    if (!ringingAlarm) return;
    const mins = Number(ringingAlarm.snoozeMins) || 5;
    const future = new Date(Date.now() + mins * 60000);
    const snoozeHHMM = `${String(future.getHours()).padStart(2, '0')}:${String(future.getMinutes()).padStart(2, '0')}`;
    setAlarms((prev) => [
      ...prev,
      {
        id: Date.now(),
        time: snoozeHHMM,
        label: `Snoozed: ${ringingAlarm.label}`,
        tone: ringingAlarm.tone,
        snoozeMins: mins,
        active: true
      }
    ]);
    stopAlarmSound();
  };

  // --- HELPER CALCULATIONS ---
  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const todaysClasses = dayOrderSchedule[currentDayOrder] || [];
  const pendingComponents = components.filter((c) => !c.done);
  const sortedExams = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const currentBalance = Number(startingBalance || 0) + totalIncome - totalExpense;

  const todayFoods = foodLogs.filter((f) => f.date === todayStr);
  const todayCalories = todayFoods.reduce((s, f) => s + Number(f.totalKcal || 0), 0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // --- MONTHLY MATRIX HELPERS ---
  const daysInSelectedMonth = new Date(matrixYear, matrixMonth + 1, 0).getDate();
  const monthKey = `${matrixYear}-${String(matrixMonth + 1).padStart(2, '0')}`;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const toggleMatrixCell = (taskId, dayNum) => {
    setMatrixLogs((prev) => {
      const mData = prev[monthKey] || {};
      const tData = mData[taskId] || {};
      return {
        ...prev,
        [monthKey]: { ...mData, [taskId]: { ...tData, [dayNum]: !tData[dayNum] } }
      };
    });
  };

  const isPastDay = (dayNum) => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return new Date(matrixYear, matrixMonth, dayNum) < todayDate;
  };

  // --- FOOD MODAL HANDLERS ---
  const addPresetToPending = () => {
    const found = INDIAN_FOOD_DB.find((item) => item.name === selectedPreset);
    if (!found) return;
    const qty = Math.max(0.5, Number(presetQty) || 1);
    setPendingMealItems((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name: `${qty} × ${found.name}`, kcal: Math.round(found.kcal * qty) }
    ]);
  };

  const addCustomToPending = () => {
    if (!customFoodName.trim() || !customFoodKcal) return;
    setPendingMealItems((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), name: customFoodName.trim(), kcal: Math.round(Number(customFoodKcal)) }
    ]);
    setCustomFoodName('');
    setCustomFoodKcal('');
  };

  const saveCompleteMeal = () => {
    if (pendingMealItems.length === 0) return;
    const totalKcal = pendingMealItems.reduce((s, i) => s + i.kcal, 0);
    setFoodLogs((prev) => [{ id: Date.now(), date: todayStr, mealTag, items: pendingMealItems, totalKcal }, ...prev]);
    setPendingMealItems([]);
    setShowFoodModal(false);
  };

  // --- MONEY HANDLERS ---
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || Number(txAmount) <= 0) return;
    setTransactions((prev) => [
      { id: Date.now(), type: txType, title: txTitle.trim(), amount: Number(txAmount), date: todayStr },
      ...prev
    ]);
    setTxTitle('');
    setTxAmount('');
  };

  const settleIou = (id) => {
    const target = ious.find((i) => i.id === id);
    if (!target || target.settled) return;
    setIous((prev) => prev.map((i) => (i.id === id ? { ...i, settled: true } : i)));
    setTransactions((prev) => [
      { id: Date.now(), type: 'income', title: `Split Settled: ${target.person}`, amount: Number(target.amount), date: todayStr },
      ...prev
    ]);
  };

  // --- OVIAI CHATBOT ---
  const handleSendChat = async (e) => {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q) return;
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setIsAiLoading(true);

    const lower = q.toLowerCase();
    let reply = '';

    if (lower.includes('day order') || lower.includes('timetable') || lower.includes('bag') || lower.includes('material') || lower.includes('class')) {
      if (todaysClasses.length === 0) {
        reply = `Today is set to ${currentDayOrder}, and no classes are added yet. Go to College → Timetable to add your periods & materials!`;
      } else {
        const list = todaysClasses.map((c) => `• ${c.period}: ${c.subject} (Pack: ${c.materials || 'Standard notes'})`).join('\n');
        reply = `Today is ${currentDayOrder}:\n${list}`;
      }
    } else if (lower.includes('component') || lower.includes('assignment')) {
      reply =
        pendingComponents.length > 0
          ? `You have ${pendingComponents.length} pending components:\n` +
            pendingComponents.map((c) => `• ${c.subject}: ${c.title} (Due: ${c.dueDate}, ${getDaysLeft(c.dueDate)} days left)`).join('\n')
          : 'All college components/assignments are completed!';
    } else if (lower.includes('exam')) {
      reply =
        sortedExams.length > 0
          ? `Upcoming Exams:\n` +
            sortedExams.map((ex) => `• ${ex.subject} on ${ex.date} (${getDaysLeft(ex.date)} days left)`).join('\n')
          : 'No exam dates added yet. Add them in College → Exam Timetable!';
    } else if (lower.includes('balance') || lower.includes('money')) {
      reply = `Your current cash balance is ₹${currentBalance} (Income: +₹${totalIncome}, Expenses: -₹${totalExpense}).`;
    } else if (lower.includes('calorie') || lower.includes('food')) {
      reply = `Today's intake: ${todayCalories} / ${profile.calorieGoal} kcal (${Math.max(0, profile.calorieGoal - todayCalories)} kcal left).`;
    } else {
      reply = `Here is your live snapshot, ${profile.name}:\n• ${currentDayOrder}: ${todaysClasses.length} classes scheduled\n• Pending Components: ${pendingComponents.length}\n• Cash Balance: ₹${currentBalance}\n• Calories: ${todayCalories}/${profile.calorieGoal} kcal`;
    }

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsAiLoading(false);
    }, 200);
  };

  const exportBackup = () => {
    const payload = {
      profile, currentDayOrder, dayOrderSchedule, components, exams, subjects,
      matrixTasks, matrixLogs, tasks, startingBalance, monthlyBudget, transactions, ious, foodLogs, waterLogs, alarms
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OviVerse_Backup_${todayStr}.json`;
    a.click();
  };

  const bgMain = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F3F8F6] text-slate-900';
  const cardBg = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm';

  return (
    <div className={`min-h-screen pb-24 transition-colors duration-200 ${bgMain}`}>
      {/* FULL-SCREEN ALARM OVERLAY */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-br from-indigo-700 via-teal-600 to-emerald-600 p-8 text-white">
          <div className="mt-10 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md animate-bounce">
              <Bell className="h-12 w-12 text-amber-300" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">OviVerse Reminder</p>
            <h1 className="mt-2 text-6xl font-extrabold tracking-tight">{ringingAlarm.time}</h1>
            <p className="mt-4 text-xl font-medium text-white/95">{ringingAlarm.label || 'Reminder Alert'}</p>
          </div>

          <div className="w-full max-w-sm space-y-4 mb-8">
            <button
              onClick={snoozeAlarm}
              className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-bold text-slate-950 shadow-lg"
            >
              Snooze ({ringingAlarm.snoozeMins || 5} mins)
            </button>
            <button
              onClick={stopAlarmSound}
              className="w-full rounded-2xl bg-white py-4 text-lg font-bold text-emerald-800 shadow-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className={`sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/70'}`}>
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-teal-500 to-emerald-400 font-extrabold text-white shadow-sm">
              Ovi
            </div>
            <div>
              <span className="font-bold tracking-tight text-base">OviVerse</span>
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Saved Offline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> OviAI
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-full p-2 ${darkMode ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-700'}`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        {/* ================= HOME TAB ================= */}
        {activeTab === 'home' && (
          <>
            {/* Greeting Hero */}
            <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-500 p-5 text-white shadow-md">
              <p className="text-xs font-medium text-indigo-100">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold">
                {getGreeting()}, {profile.name} ✨
              </h1>

              {/* Active Day Order Selector Bar */}
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/15 px-3.5 py-2 backdrop-blur-sm">
                <span className="text-xs font-bold">Today’s College Day Order:</span>
                <select
                  value={currentDayOrder}
                  onChange={(e) => {
                    setCurrentDayOrder(e.target.value);
                    setSelectedDoView(e.target.value);
                  }}
                  className="rounded-xl bg-white px-2.5 py-1 text-xs font-extrabold text-indigo-800 outline-none"
                >
                  {['Day Order 1', 'Day Order 2', 'Day Order 3', 'Day Order 4', 'Day Order 5', 'Day Order 6'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TODAY'S DAY ORDER CLASSES & BAG MATERIALS REMINDER */}
            <div className={`rounded-2xl border border-violet-200/80 p-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-violet-600" />
                  <h2 className="text-sm font-extrabold text-violet-700">
                    {currentDayOrder} — Classes & Bag Materials
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('college');
                    setCollegeSubTab('timetable');
                  }}
                  className="text-xs font-bold text-violet-600 underline"
                >
                  Edit Timetable
                </button>
              </div>

              {todaysClasses.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No periods added for {currentDayOrder} yet. Tap "Edit Timetable" to add subjects & materials to pack!
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {todaysClasses.map((cls) => {
                    const packKey = `${todayStr}_${cls.id}`;
                    const isPacked = !!packedToday[packKey];
                    return (
                      <div
                        key={cls.id}
                        onClick={() => setPackedToday((p) => ({ ...p, [packKey]: !isPacked }))}
                        className={`cursor-pointer rounded-xl border p-3 transition ${
                          isPacked
                            ? 'border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30'
                            : 'border-violet-100 bg-violet-50/50 dark:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-violet-800 dark:text-violet-300">
                            {cls.period} • {cls.subject}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isPacked ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                            {isPacked ? 'Bag Packed ✓' : 'Tap when packed'}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          🎒 Take: <b>{cls.materials || 'Regular Notebook'}</b>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* UPCOMING COMPONENT REMINDERS & NEXT EXAM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pending Components Card */}
              <div
                onClick={() => {
                  setActiveTab('college');
                  setCollegeSubTab('components');
                }}
                className="cursor-pointer rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-rose-950 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-rose-700">Component Reminders</span>
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                {pendingComponents.length === 0 ? (
                  <p className="mt-2 text-xs font-semibold text-rose-800">All components submitted! 🎉</p>
                ) : (
                  <div className="mt-2 space-y-1">
                    {pendingComponents.slice(0, 2).map((c) => (
                      <p key={c.id} className="text-xs font-bold truncate">
                        • {c.subject}: {c.title} ({getDaysLeft(c.dueDate)}d left)
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Next Exam Countdown Card */}
              <div
                onClick={() => {
                  setActiveTab('college');
                  setCollegeSubTab('exams');
                }}
                className="cursor-pointer rounded-2xl border border-indigo-200/80 bg-indigo-50/80 p-4 text-indigo-950 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-indigo-700">Next Exam Countdown</span>
                  <Clock className="h-4 w-4 text-indigo-600" />
                </div>
                {sortedExams.length === 0 ? (
                  <p className="mt-2 text-xs font-semibold text-indigo-800">Tap to add exam dates</p>
                ) : (
                  <div className="mt-2">
                    <p className="text-lg font-extrabold text-indigo-900">
                      {getDaysLeft(sortedExams[0].date)} Days Left
                    </p>
                    <p className="text-xs font-medium text-indigo-700 truncate">
                      {sortedExams[0].subject} ({sortedExams[0].date})
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Money & Calories Quick Row */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setActiveTab('money')}
                className="cursor-pointer rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-4 text-emerald-950 shadow-sm"
              >
                <span className="text-xs font-bold uppercase text-emerald-700">Cash Balance</span>
                <p className="mt-1 text-2xl font-extrabold text-emerald-900">₹{currentBalance}</p>
                <p className="text-[11px] text-emerald-700">+₹{totalIncome} • -₹{totalExpense}</p>
              </div>

              <div
                onClick={() => setActiveTab('wellness')}
                className="cursor-pointer rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-950 shadow-sm"
              >
                <span className="text-xs font-bold uppercase text-amber-700">Calories Today</span>
                <p className="mt-1 text-2xl font-extrabold text-amber-900">
                  {todayCalories} <span className="text-xs font-medium">/ {profile.calorieGoal}</span>
                </p>
                <p className="text-[11px] text-amber-700">Tap to log meal →</p>
              </div>
            </div>
          </>
        )}

        {/* ================= COLLEGE TAB (TIMETABLE + COMPONENTS + EXAMS + SUBJECTS) ================= */}
        {activeTab === 'college' && (
          <div className="space-y-4">
            {/* Sub-Navigation Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'timetable', label: 'Day Order & Bag' },
                { id: 'components', label: `Components (${pendingComponents.length})` },
                { id: 'exams', label: 'Exam Timetable' },
                { id: 'subjects', label: 'Revision' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setCollegeSubTab(st.id)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-extrabold transition ${
                    collegeSubTab === st.id
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-violet-100/80 text-violet-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* 1. DAY ORDER TIMETABLE & MATERIALS */}
            {collegeSubTab === 'timetable' && (
              <div className={`rounded-2xl border p-4 ${cardBg}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-violet-600">Day Order Timetable & Materials</h2>
                    <p className="text-xs text-slate-500">Set subjects & items to take for Day Order 1 to 6.</p>
                  </div>
                  <select
                    value={selectedDoView}
                    onChange={(e) => setSelectedDoView(e.target.value)}
                    className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-extrabold text-violet-900"
                  >
                    {['Day Order 1', 'Day Order 2', 'Day Order 3', 'Day Order 4', 'Day Order 5', 'Day Order 6'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Add Class & Material Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPeriodSubject.trim()) return;
                    const entry = {
                      id: 'do_' + Date.now(),
                      period: newPeriodTime.trim() || 'Period',
                      subject: newPeriodSubject.trim(),
                      materials: newPeriodMaterials.trim() || 'Notebook & Pen'
                    };
                    setDayOrderSchedule((prev) => ({
                      ...prev,
                      [selectedDoView]: [...(prev[selectedDoView] || []), entry]
                    }));
                    setNewPeriodTime('');
                    setNewPeriodSubject('');
                    setNewPeriodMaterials('');
                  }}
                  className="mt-3 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Hour / Time (e.g., 1st Hr 8:30)"
                      value={newPeriodTime}
                      onChange={(e) => setNewPeriodTime(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Subject (e.g., Financial Mgmt)"
                      value={newPeriodSubject}
                      onChange={(e) => setNewPeriodSubject(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Materials to take (e.g., Calculator, Record Note, Textbook)"
                      value={newPeriodMaterials}
                      onChange={(e) => setNewPeriodMaterials(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                    />
                    <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white">
                      + Add
                    </button>
                  </div>
                </form>

                {/* Timetable Table */}
                <div className="mt-4 overflow-x-auto rounded-xl border border-violet-200/70">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-violet-600 text-white">
                      <tr>
                        <th className="px-3 py-2">Hour</th>
                        <th className="px-3 py-2">Subject</th>
                        <th className="px-3 py-2">Materials to Take</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dayOrderSchedule[selectedDoView] || []).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-3 py-4 text-center text-slate-400">
                            No classes added for {selectedDoView} yet.
                          </td>
                        </tr>
                      ) : (
                        (dayOrderSchedule[selectedDoView] || []).map((row) => (
                          <tr key={row.id} className="border-t border-violet-100 dark:border-slate-800">
                            <td className="px-3 py-2.5 font-bold text-violet-700">{row.period}</td>
                            <td className="px-3 py-2.5 font-semibold">{row.subject}</td>
                            <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">🎒 {row.materials}</td>
                            <td className="px-2 py-2.5 text-right">
                              <button
                                onClick={() =>
                                  setDayOrderSchedule((prev) => ({
                                    ...prev,
                                    [selectedDoView]: prev[selectedDoView].filter((item) => item.id !== row.id)
                                  }))
                                }
                                className="text-rose-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. COMPONENT (ASSIGNMENT / ACTIVITY) REMINDERS */}
            {collegeSubTab === 'components' && (
              <div className={`rounded-2xl border p-4 ${cardBg}`}>
                <h2 className="text-base font-extrabold text-rose-600">Subject Components & Activity Reminders</h2>
                <p className="text-xs text-slate-500">Track CIA components, assignments & seminars with due dates and alarm alerts.</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!compSubject.trim() || !compTitle.trim() || !compDueDate) return;
                    const newComp = {
                      id: 'c_' + Date.now(),
                      subject: compSubject.trim(),
                      title: compTitle.trim(),
                      dueDate: compDueDate,
                      reminderTime: compReminderTime,
                      done: false
                    };
                    setComponents((p) => [newComp, ...p]);
                    // Also add an automatic alarm for the reminder time
                    setAlarms((p) => [
                      ...p,
                      {
                        id: Date.now() + 1,
                        time: compReminderTime,
                        label: `Component Due (${compDueDate}): ${compSubject.trim()} - ${compTitle.trim()}`,
                        tone: 'sunrise',
                        snoozeMins: 10,
                        active: true
                      }
                    ]);
                    setCompSubject('');
                    setCompTitle('');
                  }}
                  className="mt-3 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Subject (e.g., Business Law)"
                      value={compSubject}
                      onChange={(e) => setCompSubject(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Component / Activity Name"
                      value={compTitle}
                      onChange={(e) => setCompTitle(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="date"
                      value={compDueDate}
                      onChange={(e) => setCompDueDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-2.5 py-2 text-xs font-bold"
                      required
                    />
                    <input
                      type="time"
                      value={compReminderTime}
                      onChange={(e) => setCompReminderTime(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-2.5 py-2 text-xs font-bold"
                    />
                    <button type="submit" className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white">
                      + Add & Set Alarm
                    </button>
                  </div>
                </form>

                <div className="mt-4 space-y-2.5">
                  {components.map((c) => {
                    const days = getDaysLeft(c.dueDate);
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded-xl border border-rose-200/70 bg-rose-50/40 dark:bg-slate-800/70 p-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-800">
                              {c.subject}
                            </span>
                            <span className={`font-extrabold ${days <= 2 ? 'text-rose-600' : 'text-amber-700'}`}>
                              {c.done ? 'Submitted ✓' : days < 0 ? 'Overdue' : `${days} days left`}
                            </span>
                          </div>
                          <p className={`mt-1 font-bold ${c.done ? 'line-through text-slate-400' : ''}`}>{c.title}</p>
                          <p className="text-[10px] text-slate-500">Due: {c.dueDate} • Alarm: {c.reminderTime}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setComponents((p) => p.map((item) => (item.id === c.id ? { ...item, done: !item.done } : item)))}
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${c.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'}`}
                          >
                            {c.done ? 'Done ✓' : 'Mark Done'}
                          </button>
                          <button onClick={() => setComponents((p) => p.filter((item) => item.id !== c.id))} className="text-slate-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. EXAM TIMETABLE & DAYS-LEFT COUNTDOWN */}
            {collegeSubTab === 'exams' && (
              <div className={`rounded-2xl border p-4 ${cardBg}`}>
                <h2 className="text-base font-extrabold text-indigo-600">Exam Timetable & Days-Left Countdown</h2>
                <p className="text-xs text-slate-500">Add your CIA or Semester exam dates to see live countdowns.</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!examSubject.trim() || !examDate) return;
                    setExams((p) => [
                      ...p,
                      {
                        id: 'ex_' + Date.now(),
                        subject: examSubject.trim(),
                        date: examDate,
                        session: examSession,
                        syllabus: examSyllabus.trim() || 'Full Portion'
                      }
                    ]);
                    setExamSubject('');
                    setExamSyllabus('');
                  }}
                  className="mt-3 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Exam Subject"
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                      required
                    />
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={examSession}
                      onChange={(e) => setExamSession(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-transparent px-2.5 py-2 text-xs font-bold"
                    >
                      <option value="FN (9:30 AM)" className="text-slate-900">FN (9:30 AM)</option>
                      <option value="AN (1:30 PM)" className="text-slate-900">AN (1:30 PM)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Portion / Units"
                      value={examSyllabus}
                      onChange={(e) => setExamSyllabus(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                    />
                    <button type="submit" className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white">
                      + Exam
                    </button>
                  </div>
                </form>

                <div className="mt-4 space-y-2.5">
                  {sortedExams.map((ex) => {
                    const days = getDaysLeft(ex.date);
                    return (
                      <div key={ex.id} className="flex items-center justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:bg-slate-800/70 p-3 text-xs">
                        <div>
                          <p className="font-extrabold text-sm">{ex.subject}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            📅 {ex.date} • {ex.session}
                          </p>
                          <p className="text-[10px] text-slate-500">Portion: {ex.syllabus}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-xl px-3 py-1.5 text-center font-extrabold ${
                              days <= 3 ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                            }`}
                          >
                            {days < 0 ? 'Done' : days === 0 ? 'TODAY' : `${days} Days Left`}
                          </span>
                          <button onClick={() => setExams((p) => p.filter((item) => item.id !== ex.id))} className="text-slate-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. SUBJECTS & REVISION STATUS */}
            {collegeSubTab === 'subjects' && (
              <div className={`rounded-2xl border p-4 ${cardBg}`}>
                <h2 className="text-base font-extrabold text-violet-600">Syllabus & 5-Mark Revision Tracker</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newSubject.trim()) return;
                    setSubjects((p) => [...p, { id: Date.now(), name: newSubject.trim(), status: 'Not Started', nextReview: 'Scheduled' }]);
                    setNewSubject('');
                  }}
                  className="mt-3 flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Add chapter or topic..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                  />
                  <button type="submit" className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white">
                    + Add
                  </button>
                </form>

                <div className="mt-4 space-y-2">
                  {subjects.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between rounded-xl bg-violet-50/40 dark:bg-slate-800/60 p-3 text-xs">
                      <div>
                        <p className="font-bold">{sub.name}</p>
                        <p className="text-[10px] text-slate-500">Next recall: {sub.nextReview}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sub.status}
                          onChange={(e) =>
                            setSubjects((p) =>
                              p.map((s) =>
                                s.id === sub.id
                                  ? { ...s, status: e.target.value, nextReview: e.target.value === 'Revised' ? 'In 3 days' : 'Tomorrow' }
                                  : s
                              )
                            )
                          }
                          className="rounded-lg bg-violet-600 px-2 py-1 text-[11px] font-bold text-white"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="First Read">First Read</option>
                          <option value="Revised">Revised ✓</option>
                        </select>
                        <button onClick={() => setSubjects((p) => p.filter((s) => s.id !== sub.id))} className="text-slate-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PLANNER TAB (MONTHLY MATRIX + ALARMS) ================= */}
        {activeTab === 'planner' && (
          <>
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-indigo-600">Monthly To-Do Matrix</h2>
                  <p className="text-xs text-slate-500">Tap to tick (✓). Missed past days mark wrong (✕).</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={matrixMonth}
                    onChange={(e) => setMatrixMonth(Number(e.target.value))}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-800"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={matrixYear}
                    onChange={(e) => setMatrixYear(Number(e.target.value))}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-800"
                  >
                    {[2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newMatrixTask.trim()) return;
                  setMatrixTasks((p) => [...p, { id: 'm' + Date.now(), title: newMatrixTask.trim() }]);
                  setNewMatrixTask('');
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Add daily row (e.g., Read 10 pages)..."
                  value={newMatrixTask}
                  onChange={(e) => setNewMatrixTask(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                />
                <button type="submit" className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
                  + Row
                </button>
              </form>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-indigo-600 text-white">
                      <th className="sticky left-0 z-10 min-w-[140px] bg-indigo-600 px-3 py-2 font-bold">
                        To-Do ({matrixTasks.length})
                      </th>
                      {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((day) => (
                        <th key={day} className="min-w-[30px] border-l border-indigo-500 px-1 py-2 text-center font-semibold">
                          {day}
                        </th>
                      ))}
                      <th className="min-w-[56px] border-l border-indigo-500 px-2 py-2 text-center font-bold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixTasks.map((task) => {
                      const rowLogs = matrixLogs[monthKey]?.[task.id] || {};
                      const completedCount = Object.values(rowLogs).filter(Boolean).length;
                      return (
                        <tr key={task.id} className="border-t border-slate-200 dark:border-slate-800">
                          <td className={`sticky left-0 z-10 flex items-center justify-between gap-1 px-2.5 py-2 font-medium ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                            <span className="truncate max-w-[110px]">{task.title}</span>
                            <button onClick={() => setMatrixTasks((p) => p.filter((t) => t.id !== task.id))} className="text-slate-400">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                          {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((day) => {
                            const isChecked = !!rowLogs[day];
                            const missed = !isChecked && isPastDay(day);
                            return (
                              <td
                                key={day}
                                onClick={() => toggleMatrixCell(task.id, day)}
                                className="cursor-pointer border-l border-slate-200 dark:border-slate-800 p-1 text-center select-none"
                              >
                                {isChecked ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-white font-bold">✓</span>
                                ) : missed ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-rose-600 font-bold">✕</span>
                                ) : (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700" />
                                )}
                              </td>
                            );
                          })}
                          <td className="border-l border-slate-200 dark:border-slate-800 px-2 py-2 text-center font-extrabold text-indigo-600">
                            {completedCount}/{daysInSelectedMonth}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CUSTOMIZABLE ALARMS */}
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-rose-600">Custom Full-Screen Alarms</h2>
                <button
                  onClick={() =>
                    triggerFullScreenAlarm({
                      time: newAlarmTime,
                      label: newAlarmLabel || 'Ringtone Preview',
                      tone: newAlarmTone,
                      snoozeMins: newAlarmSnooze
                    })
                  }
                  className="flex items-center gap-1 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700"
                >
                  <Volume2 className="h-3.5 w-3.5" /> Test Ringtone
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAlarms((p) => [
                    ...p,
                    {
                      id: Date.now(),
                      time: newAlarmTime,
                      label: newAlarmLabel.trim() || 'OviVerse Reminder',
                      tone: newAlarmTone,
                      snoozeMins: Number(newAlarmSnooze),
                      active: true
                    }
                  ]);
                  setNewAlarmLabel('');
                }}
                className="mt-3 grid grid-cols-2 gap-2"
              >
                <input
                  type="time"
                  value={newAlarmTime}
                  onChange={(e) => setNewAlarmTime(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs font-bold"
                  required
                />
                <input
                  type="text"
                  placeholder="Alarm label"
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                />
                <select
                  value={newAlarmTone}
                  onChange={(e) => {
                    setNewAlarmTone(e.target.value);
                    playToneSequence(e.target.value);
                  }}
                  className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs font-medium"
                >
                  {RINGTONES.map((r) => (
                    <option key={r.id} value={r.id} className="text-slate-900">
                      Ringtone: {r.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newAlarmSnooze}
                  onChange={(e) => setNewAlarmSnooze(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs font-medium"
                >
                  {[5, 10, 15, 30].map((m) => (
                    <option key={m} value={m} className="text-slate-900">
                      Snooze: {m} mins
                    </option>
                  ))}
                </select>
                <button type="submit" className="col-span-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white">
                  + Save Alarm
                </button>
              </form>

              <div className="mt-3 space-y-2">
                {alarms.map((al) => (
                  <div key={al.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 dark:border-slate-800 p-3">
                    <div>
                      <p className="text-sm font-extrabold">{al.time} <span className="text-xs font-normal text-slate-500">• {al.label}</span></p>
                      <p className="text-[11px] text-slate-500">
                        Tone: {RINGTONES.find((r) => r.id === al.tone)?.name || 'Sunrise'} • Snooze: {al.snoozeMins}m
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAlarms((p) => p.map((a) => (a.id === al.id ? { ...a, active: !a.active } : a)))}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${al.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
                      >
                        {al.active ? 'ON' : 'OFF'}
                      </button>
                      <button onClick={() => setAlarms((p) => p.filter((a) => a.id !== al.id))} className="text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= MONEY TAB ================= */}
        {activeTab === 'money' && (
          <>
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Current Cash Balance</span>
                <div className="flex items-center gap-1 text-xs">
                  <span>Opening: ₹</span>
                  <input
                    type="number"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(Number(e.target.value))}
                    className="w-20 rounded-lg bg-white/20 px-2 py-0.5 text-right font-bold text-white outline-none"
                  />
                </div>
              </div>
              <h2 className="mt-2 text-4xl font-extrabold">₹{currentBalance}</h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <div className="flex items-center gap-1 text-xs text-emerald-100">
                    <ArrowDownLeft className="h-3.5 w-3.5" /> Total Income
                  </div>
                  <p className="mt-1 text-lg font-extrabold">+₹{totalIncome}</p>
                </div>
                <div className="rounded-2xl bg-rose-500/30 p-3">
                  <div className="flex items-center gap-1 text-xs text-rose-100">
                    <ArrowUpRight className="h-3.5 w-3.5" /> Total Expenses
                  </div>
                  <p className="mt-1 text-lg font-extrabold">-₹{totalExpense}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 rounded-xl py-2 text-xs font-extrabold ${
                    txType === 'income' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  + Add Income
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 rounded-xl py-2 text-xs font-extrabold ${
                    txType === 'expense' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  - Add Expense
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder={txType === 'income' ? 'Source (Parents)' : 'Expense (Canteen)'}
                    value={txTitle}
                    onChange={(e) => setTxTitle(e.target.value)}
                    className="col-span-2 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                    required
                  />
                  <input
                    type="number"
                    placeholder="₹ Amount"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs font-bold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full rounded-xl py-2.5 text-xs font-extrabold text-white ${
                    txType === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  Save {txType === 'income' ? 'Income' : 'Expense'}
                </button>
              </form>

              <div className="mt-4 space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl bg-slate-500/5 px-3 py-2.5 text-xs">
                    <div>
                      <p className="font-bold">{tx.title}</p>
                      <p className="text-[10px] text-slate-500">{tx.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                      </span>
                      <button onClick={() => setTransactions((p) => p.filter((i) => i.id !== tx.id))} className="text-slate-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Who Owes Me */}
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <h3 className="text-sm font-extrabold text-teal-600 flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Who Owes Me (Split Tracker)
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!iouPerson.trim() || !iouAmount) return;
                  setIous((p) => [
                    { id: Date.now(), person: iouPerson.trim(), reason: iouReason.trim() || 'Split', amount: Number(iouAmount), settled: false },
                    ...p
                  ]);
                  setIouPerson('');
                  setIouReason('');
                  setIouAmount('');
                }}
                className="mt-2 grid grid-cols-3 gap-2"
              >
                <input
                  type="text"
                  placeholder="Friend Name"
                  value={iouPerson}
                  onChange={(e) => setIouPerson(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-transparent px-2.5 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Reason"
                  value={iouReason}
                  onChange={(e) => setIouReason(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-transparent px-2.5 py-2 text-xs"
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="₹"
                    value={iouAmount}
                    onChange={(e) => setIouAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-2 py-2 text-xs font-bold"
                  />
                  <button type="submit" className="rounded-xl bg-teal-600 px-2.5 text-xs font-bold text-white">+</button>
                </div>
              </form>

              <div className="mt-3 space-y-2">
                {ious.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-teal-50/60 dark:bg-slate-800 px-3 py-2 text-xs">
                    <div>
                      <span className="font-bold">{item.person}</span> — {item.reason} (<span className="font-extrabold text-teal-700">₹{item.amount}</span>)
                    </div>
                    {item.settled ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Settled ✓</span>
                    ) : (
                      <button
                        onClick={() => settleIou(item.id)}
                        className="rounded-lg bg-teal-600 px-2.5 py-1 text-[10px] font-bold text-white"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= WELLNESS & FOOD TAB ================= */}
        {activeTab === 'wellness' && (
          <>
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-amber-600">Flexible Food & Calories</h2>
                  <p className="text-xs text-slate-500">Log multiple items together whenever you eat.</p>
                </div>
                <button
                  onClick={() => setShowFoodModal(true)}
                  className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-extrabold text-white shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Add Food
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50/90 dark:bg-slate-800 p-3 text-xs">
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-300">
                    Today: {todayCalories} / {profile.calorieGoal} kcal
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-slate-400">Custom daily calorie target:</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={profile.calorieGoal}
                    onChange={(e) => setProfile((p) => ({ ...p, calorieGoal: Number(e.target.value) }))}
                    className="w-20 rounded-lg border border-amber-300 bg-white px-2 py-1 text-right font-extrabold text-slate-900"
                  />
                  <span className="font-bold text-amber-800">kcal</span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {todayFoods.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No food logged yet today. Tap "+ Add Food" to log Dosa + Pomegranate + Guava + Milk!
                  </p>
                ) : (
                  todayFoods.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-amber-200/70 bg-amber-50/30 dark:bg-slate-800/60 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          {entry.mealTag}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-amber-700">{entry.totalKcal} kcal</span>
                          <button onClick={() => setFoodLogs((p) => p.filter((f) => f.id !== entry.id))} className="text-slate-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1.5 font-medium text-slate-700 dark:text-slate-200">
                        {entry.items.map((i) => `${i.name} (${i.kcal} kcal)`).join(' • ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-cyan-600 flex items-center gap-1.5">
                  <Droplets className="h-4 w-4" /> Water Intake ({todayWater} / {profile.waterGoal} ml)
                </h3>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setWaterLogs((p) => ({ ...p, [todayStr]: (p[todayStr] || 0) + 250 }))}
                    className="rounded-lg bg-cyan-600 px-2.5 py-1 text-xs font-bold text-white"
                  >
                    +250ml
                  </button>
                  <button
                    onClick={() => setWaterLogs((p) => ({ ...p, [todayStr]: (p[todayStr] || 0) + 500 }))}
                    className="rounded-lg bg-cyan-100 px-2.5 py-1 text-xs font-bold text-cyan-800"
                  >
                    +500ml
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= PROFILE TAB ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <h2 className="text-base font-extrabold text-indigo-600">Personal Preferences</h2>
              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-500">Display Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-500">Daily Calorie Target (kcal)</label>
                    <input
                      type="number"
                      value={profile.calorieGoal}
                      onChange={(e) => setProfile((p) => ({ ...p, calorieGoal: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500">Daily Water Target (ml)</label>
                    <input
                      type="number"
                      value={profile.waterGoal}
                      onChange={(e) => setProfile((p) => ({ ...p, waterGoal: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <h2 className="text-sm font-extrabold text-emerald-600">Backup & Data Safety</h2>
              <button
                onClick={exportBackup}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white"
              >
                <Download className="h-4 w-4" /> Download JSON Backup
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MULTI-ITEM FOOD LOGGING MODAL */}
      {showFoodModal && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-3xl p-5 shadow-xl ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-amber-600">Log Multi-Item Meal</h3>
              <button onClick={() => setShowFoodModal(false)} className="rounded-full p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-bold text-slate-500">Meal Time:</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {['Breakfast', 'Brunch', 'Lunch', 'Evening Snack', 'Dinner', 'Anytime'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setMealTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      mealTag === tag ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex gap-1.5">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-transparent px-2.5 py-2 text-xs"
                >
                  {INDIAN_FOOD_DB.map((f) => (
                    <option key={f.name} value={f.name} className="text-slate-900">
                      {f.name} ({f.kcal} kcal)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={presetQty}
                  onChange={(e) => setPresetQty(e.target.value)}
                  className="w-14 rounded-xl border border-slate-200 bg-transparent px-2 py-2 text-center text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={addPresetToPending}
                  className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-extrabold text-white"
                >
                  + Add
                </button>
              </div>

              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Or custom item"
                  value={customFoodName}
                  onChange={(e) => setCustomFoodName(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-transparent px-2.5 py-2 text-xs"
                />
                <input
                  type="number"
                  placeholder="kcal"
                  value={customFoodKcal}
                  onChange={(e) => setCustomFoodKcal(e.target.value)}
                  className="w-16 rounded-xl border border-slate-200 bg-transparent px-2 py-2 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={addCustomToPending}
                  className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-36 overflow-y-auto rounded-xl bg-amber-50/70 dark:bg-slate-800 p-3">
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                Items in {mealTag} ({pendingMealItems.reduce((s, i) => s + i.kcal, 0)} kcal):
              </p>
              {pendingMealItems.map((item) => (
                <div key={item.id} className="mt-1 flex items-center justify-between text-xs">
                  <span>{item.name} — <b>{item.kcal} kcal</b></span>
                  <button onClick={() => setPendingMealItems((p) => p.filter((x) => x.id !== item.id))} className="text-rose-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={saveCompleteMeal}
              disabled={pendingMealItems.length === 0}
              className="mt-4 w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white disabled:opacity-40"
            >
              Save Full Meal ({pendingMealItems.reduce((s, i) => s + i.kcal, 0)} kcal)
            </button>
          </div>
        </div>
      )}

      {/* OVIAI CHATBOT DRAWER */}
      {showChat && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className={`flex h-[75vh] w-full max-w-md flex-col rounded-3xl p-4 shadow-xl ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">OviAI Personal Assistant</h3>
                  <p className="text-[10px] text-emerald-600 font-semibold">Knows your Day Order, Exams & Balance</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="rounded-full p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto py-3 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'ml-auto bg-indigo-600 text-white font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isAiLoading && <p className="text-[11px] text-slate-400">OviAI is checking...</p>}
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex gap-2 border-t pt-3 border-slate-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="Ask Day Order, materials, exams, or balance..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs outline-none"
              />
              <button type="submit" className="rounded-xl bg-indigo-600 px-3.5 py-2 text-white">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-COLOR BOTTOM NAVIGATION */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 border-t px-2 py-2 backdrop-blur-md ${darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="mx-auto flex max-w-2xl items-center justify-around">
          {[
            { id: 'home', label: 'Home', icon: Home, activeColor: 'text-indigo-600 bg-indigo-50' },
            { id: 'college', label: 'College', icon: BookOpen, activeColor: 'text-violet-600 bg-violet-50' },
            { id: 'planner', label: 'Matrix', icon: Calendar, activeColor: 'text-sky-600 bg-sky-50' },
            { id: 'money', label: 'Money', icon: Wallet, activeColor: 'text-emerald-600 bg-emerald-50' },
            { id: 'wellness', label: 'Food & Care', icon: Heart, activeColor: 'text-amber-600 bg-amber-50' },
            { id: 'profile', label: 'Profile', icon: User, activeColor: 'text-rose-600 bg-rose-50' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${
                  isActive ? tab.activeColor : 'text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
