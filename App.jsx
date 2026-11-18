import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Calendar, BookOpen, Wallet, Heart, User, Plus, Check, X,
  Bell, Moon, Sun, Sparkles, Clock, Droplets, Flame, Trash2,
  Send, MessageCircle, Volume2, Award, ArrowUpRight, ArrowDownLeft,
  Users, CheckCircle2, AlertCircle, RotateCcw, Edit3, Save, Download, Upload
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
  { name: 'Dosa (1 Plain)', kcal: 133, p: 3, c: 22, f: 3 },
  { name: 'Masala Dosa (1)', kcal: 250, p: 5, c: 38, f: 9 },
  { name: 'Idli (2 pcs)', kcal: 116, p: 4, c: 24, f: 0.4 },
  { name: 'Sambar (1 bowl)', kcal: 110, p: 5, c: 16, f: 3 },
  { name: 'Coconut Chutney (2 tbsp)', kcal: 75, p: 1, c: 3, f: 7 },
  { name: 'Chapati / Roti (1)', kcal: 104, p: 3, c: 20, f: 1 },
  { name: 'Steamed Rice (1 cup)', kcal: 205, p: 4, c: 45, f: 0.4 },
  { name: 'Curd Rice (1 bowl)', kcal: 220, p: 6, c: 36, f: 5 },
  { name: 'Pomegranate (1 bowl)', kcal: 120, p: 2, c: 27, f: 1.5 },
  { name: 'Guava (1 medium)', kcal: 68, p: 2.5, c: 14, f: 1 },
  { name: 'Banana (1 medium)', kcal: 105, p: 1.3, c: 27, f: 0.4 },
  { name: 'Milk (1 cup / 250ml)', kcal: 150, p: 8, c: 12, f: 8 },
  { name: 'Boiled Egg (1)', kcal: 78, p: 6, c: 0.6, f: 5 },
  { name: 'Filter Coffee / Tea (1 cup)', kcal: 90, p: 3, c: 11, f: 3.5 },
  { name: 'Upma / Poha (1 bowl)', kcal: 195, p: 4, c: 34, f: 5 },
  { name: 'Dal Tadka (1 bowl)', kcal: 160, p: 8, c: 20, f: 5 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = usePersistentState('oviverse_dark', false);

  // User Profile & Preferences (Name defaults to Ovi, editable in Profile)
  const [profile, setProfile] = usePersistentState('oviverse_profile', {
    name: 'Ovi',
    waterGoal: 2500,
    calorieGoal: 1800,
    geminiApiKey: ''
  });

  // 1. MONTHLY TO-DO MATRIX (Rows x 28/30/31 Days)
  const now = new Date();
  const [matrixYear, setMatrixYear] = useState(now.getFullYear());
  const [matrixMonth, setMatrixMonth] = useState(now.getMonth()); // 0-11
  const [matrixTasks, setMatrixTasks] = usePersistentState('oviverse_matrix_tasks', [
    { id: 'm1', title: 'Wake up before 6:30 AM' },
    { id: 'm2', title: 'Drink 2.5L Water' },
    { id: 'm3', title: '1 Hr Financial Mgmt / BBA Study' },
    { id: 'm4', title: 'Eat Fruits & Healthy Meals' },
    { id: 'm5', title: 'Evening Walk / Stretch (20m)' }
  ]);
  // Format: { "2026-10": { "m1": { 1: true, 2: true } } }
  const [matrixLogs, setMatrixLogs] = usePersistentState('oviverse_matrix_logs', {});
  const [newMatrixTask, setNewMatrixTask] = useState('');

  // Regular Quick Tasks
  const [tasks, setTasks] = usePersistentState('oviverse_tasks', [
    { id: 1, title: 'Revise Capital Budgeting 5-mark notes', priority: 'High', done: false },
    { id: 2, title: 'Check BBA internship application list', priority: 'Medium', done: false }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // 2. COLLEGE & REVISION TRACKER
  const [subjects, setSubjects] = usePersistentState('oviverse_subjects', [
    { id: 1, name: 'Financial Management', code: 'BBA-FM', status: 'Revised', nextReview: 'In 3 days' },
    { id: 2, name: 'Business Law (Sales of Goods Act)', code: 'BBA-BL', status: 'First Read', nextReview: 'Tomorrow' },
    { id: 3, name: 'Marketing Management', code: 'BBA-MM', status: 'Not Started', nextReview: 'Pending' }
  ]);
  const [newSubject, setNewSubject] = useState('');

  // 3. MONEY MANAGER (Starting Balance + Income - Expenses + Optional Budget + IOUs)
  const [startingBalance, setStartingBalance] = usePersistentState('oviverse_start_balance', 2000);
  const [monthlyBudget, setMonthlyBudget] = usePersistentState('oviverse_budget', 3000);
  const [transactions, setTransactions] = usePersistentState('oviverse_transactions', [
    { id: 1, type: 'income', title: 'Pocket Money from Parents', amount: 1500, category: 'Allowance', date: '2026-11-15' },
    { id: 2, type: 'expense', title: 'College Canteen & Fruit Juice', amount: 120, category: 'Food', date: '2026-11-16' }
  ]);
  const [txType, setTxType] = useState('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');

  // Who Owes Me / Split Tracker
  const [ious, setIous] = usePersistentState('oviverse_ious', [
    { id: 1, person: 'College Friend', reason: 'Auto & Printouts split', amount: 80, settled: false }
  ]);
  const [iouPerson, setIouPerson] = useState('');
  const [iouReason, setIouReason] = useState('');
  const [iouAmount, setIouAmount] = useState('');

  // 4. FOOD & NUTRITION (Manual Calorie Target + Multi-item Meal Logger)
  const todayStr = new Date().toISOString().split('T')[0];
  const [foodLogs, setFoodLogs] = usePersistentState('oviverse_food_logs', []);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [mealTag, setMealTag] = useState('Breakfast');
  const [pendingMealItems, setPendingMealItems] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(INDIAN_FOOD_DB[0].name);
  const [presetQty, setPresetQty] = useState(1);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodKcal, setCustomFoodKcal] = useState('');

  // 5. WELLNESS & HYDRATION
  const [waterLogs, setWaterLogs] = usePersistentState('oviverse_water', {});
  const todayWater = waterLogs[todayStr] || 0;

  // 6. FULL-SCREEN CUSTOMIZABLE ALARM SYSTEM
  const [alarms, setAlarms] = usePersistentState('oviverse_alarms', [
    { id: 1, time: '06:30', label: 'Morning College Prep & Water', tone: 'sunrise', snoozeMins: 10, active: true },
    { id: 2, time: '19:30', label: 'Daily BBA Revision Session', tone: 'temple', snoozeMins: 5, active: true }
  ]);
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [newAlarmTone, setNewAlarmTone] = useState('sunrise');
  const [newAlarmSnooze, setNewAlarmSnooze] = useState(10);
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const [lastTriggeredMinute, setLastTriggeredMinute] = useState('');
  const ringIntervalRef = useRef(null);

  // 7. OVIAI SMART CHATBOT
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = usePersistentState('oviverse_chat', [
    {
      role: 'assistant',
      text: 'Vanakkam Ovi! I am OviAI. Ask me about your current cash balance, today’s calories, pending tasks, or type "Add task..." / "Spent 50 on auto" to log things quickly!'
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- ALARM CLOCK CHECKER (EVERY 5 SECONDS) ---
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

  // --- CALCULATIONS ---
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentBalance = Number(startingBalance || 0) + totalIncome - totalExpense;

  const todayFoods = foodLogs.filter((f) => f.date === todayStr);
  const todayCalories = todayFoods.reduce((sum, f) => sum + Number(f.totalKcal || 0), 0);

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
      const nextVal = !tData[dayNum];
      return {
        ...prev,
        [monthKey]: {
          ...mData,
          [taskId]: {
            ...tData,
            [dayNum]: nextVal
          }
        }
      };
    });
  };

  const isPastDay = (dayNum) => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const cellDate = new Date(matrixYear, matrixMonth, dayNum);
    return cellDate < todayDate;
  };

  // --- FOOD MODAL HANDLERS ---
  const addPresetToPending = () => {
    const found = INDIAN_FOOD_DB.find((item) => item.name === selectedPreset);
    if (!found) return;
    const qty = Math.max(0.5, Number(presetQty) || 1);
    setPendingMealItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: `${qty} × ${found.name}`,
        kcal: Math.round(found.kcal * qty)
      }
    ]);
  };

  const addCustomToPending = () => {
    if (!customFoodName.trim() || !customFoodKcal) return;
    setPendingMealItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: customFoodName.trim(),
        kcal: Math.round(Number(customFoodKcal))
      }
    ]);
    setCustomFoodName('');
    setCustomFoodKcal('');
  };

  const saveCompleteMeal = () => {
    if (pendingMealItems.length === 0) return;
    const totalKcal = pendingMealItems.reduce((s, i) => s + i.kcal, 0);
    const newEntry = {
      id: Date.now(),
      date: todayStr,
      mealTag,
      items: pendingMealItems,
      totalKcal
    };
    setFoodLogs((prev) => [newEntry, ...prev]);
    setPendingMealItems([]);
    setShowFoodModal(false);
  };

  // --- MONEY HANDLERS ---
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!txTitle.trim() || !txAmount || Number(txAmount) <= 0) return;
    setTransactions((prev) => [
      {
        id: Date.now(),
        type: txType,
        title: txTitle.trim(),
        amount: Number(txAmount),
        category: txCategory,
        date: todayStr
      },
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
      {
        id: Date.now(),
        type: 'income',
        title: `Split Settled: ${target.person}`,
        amount: Number(target.amount),
        category: 'Split Return',
        date: todayStr
      },
      ...prev
    ]);
  };

  // --- OVIAI CHATBOT LOGIC ---
  const handleSendChat = async (e) => {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q) return;
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setIsAiLoading(true);

    const lower = q.toLowerCase();

    // Quick Action Commands inside Chat
    if (lower.startsWith('add task ')) {
      const title = q.slice(9).trim();
      if (title) {
        setTasks((prev) => [{ id: Date.now(), title, priority: 'Medium', done: false }, ...prev]);
        setChatMessages((prev) => [...prev, { role: 'assistant', text: `Added "${title}" to your Planner tasks!` }]);
        setIsAiLoading(false);
        return;
      }
    }

    const spentMatch = lower.match(/spent\s+(\d+)\s+(?:on\s+)?(.+)/i);
    if (spentMatch) {
      const amt = Number(spentMatch[1]);
      const item = spentMatch[2];
      setTransactions((prev) => [
        { id: Date.now(), type: 'expense', title: item, amount: amt, category: 'Quick Log', date: todayStr },
        ...prev
      ]);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Logged ₹${amt} expense for "${item}". Your updated balance is ₹${currentBalance - amt}.` }
      ]);
      setIsAiLoading(false);
      return;
    }

    // Optional Real Gemini API Call if key provided in Profile
    if (profile.geminiApiKey && profile.geminiApiKey.trim().startsWith('AIza')) {
      try {
        const contextPrompt = `You are OviAI, a friendly personal student assistant for ${profile.name} (BBA student). Current cash balance: ₹${currentBalance}, Today calories: ${todayCalories}/${profile.calorieGoal} kcal, Water: ${todayWater}/${profile.waterGoal} ml, Pending tasks: ${tasks.filter((t) => !t.done).map((t) => t.title).join(', ') || 'None'}. Keep replies concise, warm, and practical.\nUser: ${q}`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${profile.geminiApiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: contextPrompt }] }] })
          }
        );
        const data = await res.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          setChatMessages((prev) => [...prev, { role: 'assistant', text: aiText }]);
          setIsAiLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Gemini fallback to local assistant:', err);
      }
    }

    // Built-in Smart Offline Assistant Responses
    let reply = '';
    if (lower.includes('balance') || lower.includes('money') || lower.includes('expense') || lower.includes('income')) {
      reply = `Your current cash balance is ₹${currentBalance} (Total Income: ₹${totalIncome}, Total Expenses: ₹${totalExpense}).`;
    } else if (lower.includes('calorie') || lower.includes('food') || lower.includes('eat')) {
      const rem = Math.max(0, profile.calorieGoal - todayCalories);
      reply = `You have logged ${todayCalories} kcal out of your ${profile.calorieGoal} kcal target today (${rem} kcal remaining).`;
    } else if (lower.includes('task') || lower.includes('todo') || lower.includes('study')) {
      const pending = tasks.filter((t) => !t.done);
      reply =
        pending.length > 0
          ? `You have ${pending.length} pending tasks: ${pending.map((t) => t.title).join('; ')}. Tip: Try a 25-minute focus sprint on the top one!`
          : 'All your quick tasks are completed! Check your Monthly Habit Matrix in Planner to tick today’s daily goals.';
    } else if (lower.includes('water') || lower.includes('drink')) {
      reply = `You've had ${todayWater} ml out of ${profile.waterGoal} ml today. Keep sipping!`;
    } else {
      reply = `Here is your live snapshot, ${profile.name}:\n• Cash Balance: ₹${currentBalance}\n• Calories Today: ${todayCalories} / ${profile.calorieGoal} kcal\n• Water: ${todayWater} / ${profile.waterGoal} ml\n• Pending Tasks: ${tasks.filter((t) => !t.done).length}\n\nTip: You can also type "Add task Revise Cost of Capital" or "Spent 40 on snacks" right here!`;
    }

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsAiLoading(false);
    }, 250);
  };

  // --- EXPORT / IMPORT JSON ---
  const exportBackup = () => {
    const payload = {
      profile, matrixTasks, matrixLogs, tasks, subjects,
      startingBalance, monthlyBudget, transactions, ious, foodLogs, waterLogs, alarms
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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-br from-indigo-700 via-teal-600 to-emerald-600 p-8 text-white animate-fadeIn">
          <div className="mt-10 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md animate-bounce">
              <Bell className="h-12 w-12 text-amber-300" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">OviVerse Alarm</p>
            <h1 className="mt-2 text-6xl font-extrabold tracking-tight">{ringingAlarm.time}</h1>
            <p className="mt-4 text-xl font-medium text-white/95">{ringingAlarm.label || 'Reminder Alert'}</p>
          </div>

          <div className="w-full max-w-sm space-y-4 mb-8">
            <button
              onClick={snoozeAlarm}
              className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-bold text-slate-950 shadow-lg active:scale-95 transition"
            >
              Snooze ({ringingAlarm.snoozeMins || 5} mins)
            </button>
            <button
              onClick={stopAlarmSound}
              className="w-full rounded-2xl bg-white py-4 text-lg font-bold text-emerald-800 shadow-lg active:scale-95 transition"
            >
              Dismiss Alarm
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

      {/* MAIN CONTENT CONTAINER */}
      <main className="mx-auto max-w-2xl space-y-5 p-4">
        {/* ================= HOME TAB ================= */}
        {activeTab === 'home' && (
          <>
            {/* Multi-Color Greeting Hero */}
            <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-500 p-5 text-white shadow-md">
              <p className="text-xs font-medium text-indigo-100">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold">
                {getGreeting()}, {profile.name} ✨
              </h1>
              <p className="mt-1 text-xs text-white/90">
                Everything you log stays saved automatically on your phone.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setWaterLogs((p) => ({ ...p, [todayStr]: (p[todayStr] || 0) + 250 }))}
                  className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/30"
                >
                  <Droplets className="h-3.5 w-3.5 text-cyan-200" /> +250ml Water
                </button>
                <button
                  onClick={() => {
                    setActiveTab('wellness');
                    setShowFoodModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/30"
                >
                  <Flame className="h-3.5 w-3.5 text-amber-200" /> + Log Meal
                </button>
                <button
                  onClick={() => setActiveTab('money')}
                  className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/30"
                >
                  <Wallet className="h-3.5 w-3.5 text-emerald-200" /> ₹{currentBalance} Bal
                </button>
              </div>
            </div>

            {/* Colorful Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Cash Balance Card - Emerald */}
              <div
                onClick={() => setActiveTab('money')}
                className="cursor-pointer rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-4 text-emerald-950 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-700">Cash Balance</span>
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-emerald-900">₹{currentBalance}</p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  +₹{totalIncome} in • -₹{totalExpense} out
                </p>
              </div>

              {/* Calories Card - Amber */}
              <div
                onClick={() => setActiveTab('wellness')}
                className="cursor-pointer rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-950 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-700">Calories Today</span>
                  <Flame className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-amber-900">
                  {todayCalories} <span className="text-xs font-medium">/ {profile.calorieGoal}</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${Math.min(100, (todayCalories / (profile.calorieGoal || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Hydration Card - Cyan */}
              <div
                onClick={() => setActiveTab('wellness')}
                className="cursor-pointer rounded-2xl border border-cyan-200/80 bg-cyan-50/90 p-4 text-cyan-950 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-cyan-700">Hydration</span>
                  <Droplets className="h-4 w-4 text-cyan-600" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-cyan-900">
                  {todayWater} <span className="text-xs font-medium">/ {profile.waterGoal} ml</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cyan-200">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${Math.min(100, (todayWater / (profile.waterGoal || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Monthly Habit Score Card - Indigo */}
              <div
                onClick={() => setActiveTab('planner')}
                className="cursor-pointer rounded-2xl border border-indigo-200/80 bg-indigo-50/90 p-4 text-indigo-950 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-indigo-700">Today’s Matrix</span>
                  <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="mt-2 text-2xl font-extrabold text-indigo-900">
                  {matrixTasks.filter((t) => matrixLogs[monthKey]?.[t.id]?.[now.getDate()]).length} / {matrixTasks.length}
                </p>
                <p className="mt-1 text-[11px] text-indigo-700">Tap to open 30-day grid →</p>
              </div>
            </div>

            {/* Active Alarms Preview Card - Rose/Violet */}
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-rose-500" />
                  <h2 className="font-bold text-sm">Reminders & Full-Screen Alarms</h2>
                </div>
                <button
                  onClick={() => triggerFullScreenAlarm(alarms[0] || { time: 'NOW', label: 'Test Full-Screen Alarm', tone: 'sunrise', snoozeMins: 5 })}
                  className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700"
                >
                  Test Alarm Ringtone
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {alarms.slice(0, 2).map((al) => (
                  <div key={al.id} className="flex items-center justify-between rounded-xl bg-slate-500/5 px-3 py-2 text-xs">
                    <div>
                      <span className="font-bold text-indigo-600">{al.time}</span>
                      <span className="ml-2 font-medium">{al.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{al.snoozeMins}m snooze</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= PLANNER TAB (MONTHLY 30/31-DAY MATRIX + TASKS) ================= */}
        {activeTab === 'planner' && (
          <>
            {/* 30/31-DAY MONTHLY TO-DO MATRIX */}
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-indigo-600">Monthly To-Do Matrix</h2>
                  <p className="text-xs text-slate-500">
                    Tap to tick (✓). Unticked past days auto-mark wrong (✕).
                  </p>
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

              {/* Add Row Input */}
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
                  placeholder="Add daily row (e.g., Read 10 pages, No sugar)..."
                  value={newMatrixTask}
                  onChange={(e) => setNewMatrixTask(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
                <button type="submit" className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
                  + Row
                </button>
              </form>

              {/* Scrollable Grid: Rows x 30/31 Columns */}
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-indigo-600 text-white">
                      <th className="sticky left-0 z-10 min-w-[145px] bg-indigo-600 px-3 py-2 font-bold">
                        Daily To-Do ({matrixTasks.length})
                      </th>
                      {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((day) => (
                        <th key={day} className="min-w-[30px] border-l border-indigo-500 px-1 py-2 text-center font-semibold">
                          {day}
                        </th>
                      ))}
                      <th className="min-w-[58px] border-l border-indigo-500 px-2 py-2 text-center font-bold">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixTasks.map((task) => {
                      const rowLogs = matrixLogs[monthKey]?.[task.id] || {};
                      const completedCount = Object.values(rowLogs).filter(Boolean).length;
                      return (
                        <tr key={task.id} className="border-t border-slate-200 dark:border-slate-800">
                          <td className={`sticky left-0 z-10 flex items-center justify-between gap-1 px-2.5 py-2 font-medium ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                            <span className="truncate max-w-[115px]" title={task.title}>{task.title}</span>
                            <button
                              onClick={() => setMatrixTasks((p) => p.filter((t) => t.id !== task.id))}
                              className="text-slate-400 hover:text-rose-500"
                            >
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
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-white font-bold">
                                    ✓
                                  </span>
                                ) : missed ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-rose-600 font-bold">
                                    ✕
                                  </span>
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

            {/* CUSTOMIZABLE ALARMS & REMINDERS */}
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
                  placeholder="Alarm label (e.g., College Bus)"
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

            {/* QUICK ONE-OFF TASKS */}
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <h2 className="text-base font-extrabold text-sky-600">Quick One-Off Tasks</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTaskTitle.trim()) return;
                  setTasks((p) => [{ id: Date.now(), title: newTaskTitle.trim(), priority: 'Medium', done: false }, ...p]);
                  setNewTaskTitle('');
                }}
                className="mt-2 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Add single task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
                />
                <button type="submit" className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white">
                  Add
                </button>
              </form>
              <div className="mt-3 space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-500/5 px-3 py-2 text-xs">
                    <button
                      onClick={() => setTasks((p) => p.map((item) => (item.id === t.id ? { ...item, done: !item.done } : item)))}
                      className={`flex items-center gap-2 font-medium ${t.done ? 'line-through text-slate-400' : ''}`}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${t.done ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {t.title}
                    </button>
                    <button onClick={() => setTasks((p) => p.filter((item) => item.id !== t.id))} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ================= COLLEGE TAB ================= */}
        {activeTab === 'college' && (
          <div className={`rounded-2xl border p-4 ${cardBg}`}>
            <h2 className="text-base font-extrabold text-violet-600">BBA Subjects & Exam Revision Tracker</h2>
            <p className="text-xs text-slate-500">Track 5-mark & essay revision stages across your semester subjects.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSubject.trim()) return;
                setSubjects((p) => [
                  ...p,
                  { id: Date.now(), name: newSubject.trim(), code: 'BBA', status: 'Not Started', nextReview: 'Scheduled' }
                ]);
                setNewSubject('');
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                placeholder="Add subject or chapter (e.g., Cost of Capital)..."
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs"
              />
              <button type="submit" className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white">
                + Add
              </button>
            </form>

            <div className="mt-4 space-y-2.5">
              {subjects.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-xl border border-violet-200/70 bg-violet-50/40 dark:bg-slate-800/60 p-3">
                  <div>
                    <p className="text-xs font-bold">{sub.name}</p>
                    <p className="text-[11px] text-slate-500">Next recall: {sub.nextReview}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sub.status}
                      onChange={(e) =>
                        setSubjects((p) =>
                          p.map((s) =>
                            s.id === sub.id
                              ? {
                                  ...s,
                                  status: e.target.value,
                                  nextReview: e.target.value === 'Revised' ? 'In 3 days' : 'Tomorrow'
                                }
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
                    <button onClick={() => setSubjects((p) => p.filter((s) => s.id !== sub.id))} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= MONEY TAB (BALANCE + INCOME + EXPENSES + BUDGET + IOU) ================= */}
        {activeTab === 'money' && (
          <>
            {/* Balance Overview Card */}
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
                <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1 text-xs text-emerald-100">
                    <ArrowDownLeft className="h-3.5 w-3.5" /> Total Income
                  </div>
                  <p className="mt-1 text-lg font-extrabold">+₹{totalIncome}</p>
                </div>
                <div className="rounded-2xl bg-rose-500/30 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1 text-xs text-rose-100">
                    <ArrowUpRight className="h-3.5 w-3.5" /> Total Expenses
                  </div>
                  <p className="mt-1 text-lg font-extrabold">-₹{totalExpense}</p>
                </div>
              </div>

              {/* Optional Budget Reference Bar */}
              <div className="mt-4 rounded-xl bg-black/15 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span>Optional Monthly Spend Limit: ₹{monthlyBudget}</span>
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-20 rounded bg-white/20 px-2 py-0.5 text-right font-bold text-white"
                  />
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-amber-300"
                    style={{ width: `${Math.min(100, (totalExpense / (monthlyBudget || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Add Income or Expense Form */}
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
                    txType === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  + Add Income (Adds to Balance)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
                    txType === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  - Add Expense (Deducts)
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder={txType === 'income' ? 'Source (e.g., Parents)' : 'What for? (e.g., Canteen)'}
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

              {/* Transaction History */}
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

            {/* Who Owes Me / Split Tracker */}
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
                  placeholder="Reason (Auto)"
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

        {/* ================= WELLNESS & FLEXIBLE NUTRITION TAB ================= */}
        {activeTab === 'wellness' && (
          <>
            {/* Custom Calorie Target & Multi-Item Meal Logger */}
            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-amber-600">Flexible Food & Calories</h2>
                  <p className="text-xs text-slate-500">Eat whenever you need—log multiple items together.</p>
                </div>
                <button
                  onClick={() => setShowFoodModal(true)}
                  className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-extrabold text-white shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Add Food
                </button>
              </div>

              {/* Manual Calorie Goal Input */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50/90 dark:bg-slate-800 p-3 text-xs">
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-300">
                    Today: {todayCalories} / {profile.calorieGoal} kcal
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-slate-400">Set your custom daily calorie target:</p>
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

              {/* Logged Meals Today */}
              <div className="mt-4 space-y-2.5">
                {todayFoods.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    No food logged yet today. Tap "+ Add Food" to log items like Dosa + Pomegranate + Guava + Milk!
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

            {/* Hydration Card */}
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

        {/* ================= PROFILE & SETTINGS TAB ================= */}
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
                <div>
                  <label className="font-bold text-slate-500">Optional Gemini API Key (for OviAI Chatbot)</label>
                  <input
                    type="password"
                    placeholder="AIza... (Optional — OviAI works offline without this too)"
                    value={profile.geminiApiKey || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, geminiApiKey: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${cardBg}`}>
              <h2 className="text-sm font-extrabold text-emerald-600">Backup & Data Safety</h2>
              <p className="mt-1 text-xs text-slate-500">
                Your data is permanently saved in local storage. Download a backup anytime.
              </p>
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
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl p-5 shadow-xl ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-amber-600">Log Multi-Item Meal</h3>
              <button onClick={() => setShowFoodModal(false)} className="rounded-full p-1 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Meal Time Tag Selector */}
            <div className="mt-3">
              <label className="text-[11px] font-bold text-slate-500">When are you eating?</label>
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

            {/* Quick Indian Food & Fruit Picker */}
            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-bold text-slate-500">Add Items (Dosa, Fruits, Milk, etc.)</label>
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

              {/* Or Custom Food Item */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Or custom item (e.g., Guava)"
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

            {/* Pending Basket */}
            <div className="mt-4 max-h-36 overflow-y-auto rounded-xl bg-amber-50/70 dark:bg-slate-800 p-3">
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                Items in this {mealTag} ({pendingMealItems.reduce((s, i) => s + i.kcal, 0)} kcal total):
              </p>
              {pendingMealItems.length === 0 ? (
                <p className="mt-1 text-[11px] text-slate-400">Tap "+ Add" above to stack multiple items here.</p>
              ) : (
                <div className="mt-1.5 space-y-1">
                  {pendingMealItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span>{item.name} — <b>{item.kcal} kcal</b></span>
                      <button
                        onClick={() => setPendingMealItems((p) => p.filter((x) => x.id !== item.id))}
                        className="text-rose-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className={`flex h-[75vh] w-full max-w-md flex-col rounded-3xl p-4 shadow-xl ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">OviAI Personal Assistant</h3>
                  <p className="text-[10px] text-emerald-600 font-semibold">Connected to your OviVerse records</p>
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
              {isAiLoading && <p className="text-[11px] text-slate-400">OviAI is thinking...</p>}
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex gap-2 border-t pt-3 border-slate-200 dark:border-slate-800">
              <input
                type="text"
                placeholder="Ask balance, calories, or 'Add task...'..."
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
            { id: 'planner', label: 'Matrix', icon: Calendar, activeColor: 'text-sky-600 bg-sky-50' },
            { id: 'college', label: 'College', icon: BookOpen, activeColor: 'text-violet-600 bg-violet-50' },
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
