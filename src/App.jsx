import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, MapPin, Calendar, Activity, Plus, Trash2, 
  Edit2, Save, X, ChevronRight, ChevronLeft, Layout, 
  BookOpen, ExternalLink, Shield, Zap, Clock, CircleDot, 
  Medal, Map as MapIcon, User, Hash, Star, Target,
  ChevronDown, Palette, LogOut, LogIn
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION (ACTION REQUIRED) ---
// PASTE YOUR CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyDPDbT-IFJts2bNfeGGVVyx8_TIJevvFbs",
  authDomain: "diamond-days.firebaseapp.com",
  projectId: "diamond-days",
  storageBucket: "diamond-days.firebasestorage.app",
  messagingSenderId: "878993322448",
  appId: "1:878993322448:web:a2bbb52b6dd995e7abc9d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ID for data separation
const appId = 'diamond-days-tracker';

// --- Constants & Colors ---
const COLORS = {
  navy: '#0C2340',     // Deep Navy
  teal: '#5BC2BD',     // New Brighter Teal
  silver: '#C4CED4',   // Silver/Grey
  white: '#FFFFFF',
};

// Default Season Data
const DEFAULT_SEASON = {
  id: 'default-2025',
  year: '2025',
  teamName: 'City Baseball 9U Navy',
  age: '9',
  number: '10',
  positions: '1B / Pitcher',
  bats: 'R',
  throws: 'L',
  hometown: 'Seattle, WA',
  colors: {
    primary: '#0C2340',
    secondary: '#5BC2BD',
    accent: '#C4CED4',
    text: '#FFFFFF'
  }
};

// Coordinates (Lat/Lng)
const CITY_COORDS_LATLNG = {
  'Seattle': [47.6062, -122.3321],
  'Bellevue': [47.6101, -122.2015],
  'Redmond': [47.6740, -122.1215],
  'Tacoma': [47.2529, -122.4443],
  'Olympia': [47.0379, -122.9007],
  'Everett': [47.9790, -122.2021],
  'Bellingham': [48.7519, -122.4787],
  'Yakima': [46.6021, -120.5059],
  'Wenatchee': [47.4235, -120.3103],
  'Spokane': [47.6588, -117.4260],
  'Tri-Cities': [46.2396, -119.1006],
  'Pasco': [46.2396, -119.1006],
  'Kennewick': [46.2112, -119.1372],
  'Richland': [46.2857, -119.2845],
  'Vancouver': [45.6387, -122.6615],
  'Portland': [45.5152, -122.6784],
  'Bend': [44.0582, -121.3153],
  'Eugene': [44.0521, -123.0868],
  'Salem': [44.9429, -123.0351],
  'Medford': [42.3265, -122.8756],
  'Kent': [47.3809, -122.2348],
  'Federal Way': [47.3223, -122.3126],
  'Puyallup': [47.1854, -122.2929],
  'Issaquah': [47.5301, -122.0326],
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00'); 
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const safeParseInt = (val) => {
  if (val === '') return '';
  const num = parseInt(val, 10);
  return isNaN(num) ? '' : num;
};

const STAT_LABELS = {
  plateAppearances: 'PA', atBats: 'AB', runsScored: 'R', singles: '1B', doubles: '2B', triples: '3B',
  homeRuns: 'HR', walks: 'BB', hbp: 'HBP', rbi: 'RBI', stolenBases: 'SB', batterStrikeouts: 'SO',
  caughtStealing: 'CS', sacrifices: 'SAC', fieldersChoice: 'FC', gamesPitched: 'G', inningsPitched: 'IP',
  hitsAllowed: 'H', earnedRuns: 'ER', strikeouts: 'K', walksAllowed: 'BB', pitchingWins: 'W',
  pitchingLosses: 'L', saves: 'SV'
};

const INITIAL_GAME_STATS = {
  plateAppearances: 0, atBats: 0, runsScored: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0,
  walks: 0, hbp: 0, rbi: 0, stolenBases: 0, batterStrikeouts: 0, caughtStealing: 0, sacrifices: 0, fieldersChoice: 0,
  gamesPitched: 0, inningsPitched: 0, hitsAllowed: 0, earnedRuns: 0, strikeouts: 0, walksAllowed: 0,
  pitchingWins: 0, pitchingLosses: 0, saves: 0,
};

// --- Components ---

const StatCard = ({ label, value, subtext, icon: Icon, colorClass = "text-slate-600", border = true, noIcon = false, colors }) => (
  <div className={`bg-white p-3 md:p-4 rounded-xl flex flex-col items-center text-center transition-all ${border ? 'shadow-sm border border-slate-200 hover:shadow-md' : ''}`}>
    {!noIcon && (
      <div className="p-2 rounded-full mb-2 bg-slate-50">
        {Icon ? <Icon className="w-5 h-5" style={{ color: colors.secondary }} /> : <CircleDot className="w-5 h-5" style={{ color: colors.secondary }} />}
      </div>
    )}
    <div className="text-xl md:text-2xl font-black tracking-tight" style={{ color: colors.primary }}>{value}</div>
    <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    {subtext && <div className="text-[10px] text-slate-400 mt-1">{subtext}</div>}
  </div>
);

const GameLogItem = ({ game, onClick, onDelete, colors }) => (
  <div 
    onClick={onClick}
    className={`flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 mb-2 shadow-sm ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-1.5 h-10 rounded-full`} style={{ backgroundColor: game.result === 'W' ? colors.secondary : game.result === 'L' ? '#ef4444' : '#cbd5e1' }}></div>
      <div>
        <div className="font-bold text-sm" style={{ color: colors.primary }}>{game.opponent}</div>
        <div className="text-xs text-slate-500 flex gap-2">
          <span className="font-mono">{game.scoreUs}-{game.scoreThem}</span>
          <span className="text-slate-300">|</span>
          <span>{game.type}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="font-black text-sm" style={{ color: game.result === 'W' ? colors.secondary : game.result === 'L' ? '#ef4444' : '#64748b' }}>{game.result}</span>
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-300 hover:text-red-400 p-1">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

const BaseballCardStat = ({ label, value, colors }) => (
  <div className="flex flex-col items-center justify-center p-2 border-r border-b border-slate-100 last:border-r-0 hover:bg-slate-50 transition-colors">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-lg font-black font-mono" style={{ color: colors.primary }}>{value}</div>
  </div>
);

const WashingtonMap = ({ tournaments, onPinClick }) => {
  const BOUNDS = { N: 49.05, S: 45.50, W: -125.00, E: -116.80 };
  const getPosition = (lat, lng) => {
    const y = ((BOUNDS.N - lat) / (BOUNDS.N - BOUNDS.S)) * 100;
    const x = ((lng - BOUNDS.W) / (BOUNDS.E - BOUNDS.W)) * 100;
    return { x, y };
  };
  return (
    <div className="relative w-full aspect-[1.45] bg-[#eef5fa] rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
      <img src="https://raw.githubusercontent.com/bryanseely/junkfiles-testfiles/refs/heads/master/WA_map.svg" alt="Map of Washington" className="absolute inset-0 w-full h-full object-contain p-4 opacity-80" />
      {tournaments.map((t) => {
        let coords = null;
        if (t.latitude && t.longitude) { coords = [parseFloat(t.latitude), parseFloat(t.longitude)]; } 
        else { const cityKey = Object.keys(CITY_COORDS_LATLNG).find(k => t.location?.includes(k)); coords = cityKey ? CITY_COORDS_LATLNG[cityKey] : null; }
        if (!coords) return null;
        const pos = getPosition(coords[0], coords[1]);
        if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) return null;
        return (
           <div key={t.id} onClick={() => onPinClick(t)} className="absolute cursor-pointer hover:z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <div className="relative">
                 <div className="w-4 h-4 bg-[#0C2340] rounded-full border-2 border-white shadow-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#5BC2BD] rounded-full"></div>
                 </div>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white px-2 py-1 rounded shadow-lg text-[10px] font-bold text-[#0C2340] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-100 z-50">{t.name}</div>
              </div>
           </div>
        );
      })}
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-medium bg-white/50 px-2 rounded">Map data: Wikimedia Commons</div>
    </div>
  );
};

// --- Game Form Modal ---
const GameFormModal = ({ initialGame, onSave, onCancel, colors }) => {
  const [game, setGame] = useState(initialGame || {
    opponent: '', scoreUs: '', scoreThem: '', result: 'W', type: 'Pool Play',
    stats: { ...INITIAL_GAME_STATS }
  });

  const handleStatChange = (key, val) => {
    setGame(prev => ({
      ...prev,
      stats: { ...prev.stats, [key]: parseFloat(val) || 0 }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70] overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold uppercase" style={{ color: colors.primary }}>Game Details</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Opponent</label>
                <input className="w-full p-2 border rounded font-bold" placeholder="e.g. Mudville 9" value={game.opponent} onChange={e => setGame({...game, opponent: e.target.value})} />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Us</label>
                <input type="number" className="w-full p-2 border rounded text-center" value={game.scoreUs} onChange={e => setGame({...game, scoreUs: safeParseInt(e.target.value)})} />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Them</label>
                <input type="number" className="w-full p-2 border rounded text-center" value={game.scoreThem} onChange={e => setGame({...game, scoreThem: safeParseInt(e.target.value)})} />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Result</label>
                <select className="w-full p-2 border rounded" value={game.result} onChange={e => setGame({...game, result: e.target.value})}>
                   <option>W</option><option>L</option><option>T</option>
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                <select className="w-full p-2 border rounded" value={game.type} onChange={e => setGame({...game, type: e.target.value})}>
                   <option>Pool Play</option><option>Elimination</option><option>Championship</option>
                </select>
             </div>
          </div>
          <div className="space-y-6">
             <div>
                <h4 className="text-xs font-black uppercase mb-2 flex items-center gap-1" style={{ color: colors.secondary }}><Target className="w-3 h-3"/> Batting</h4>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                   {[
                     {l:'PA', k:'plateAppearances'}, {l:'AB', k:'atBats'}, {l:'Runs', k:'runsScored'}, 
                     {l:'1B', k:'singles'}, {l:'2B', k:'doubles'}, {l:'3B', k:'triples'}, {l:'HR', k:'homeRuns'},
                     {l:'BB', k:'walks'}, {l:'HBP', k:'hbp'}, {l:'RBI', k:'rbi'}, {l:'SB', k:'stolenBases'},
                     {l:'SO', k:'batterStrikeouts'}
                   ].map(field => (
                     <div key={field.k}>
                        <label className="block text-[9px] font-bold text-slate-400 text-center">{field.l}</label>
                        <input 
                          type="number" 
                          className="w-full p-1 border rounded text-center text-sm" 
                          placeholder="0" 
                          value={game.stats?.[field.k] === 0 ? '' : (game.stats?.[field.k] || '')} 
                          onChange={e => handleStatChange(field.k, e.target.value)} 
                        />
                     </div>
                   ))}
                </div>
             </div>
             <div>
                <h4 className="text-xs font-black uppercase mb-2 flex items-center gap-1" style={{ color: colors.secondary }}><Activity className="w-3 h-3"/> Pitching</h4>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                   {[
                     {l:'IP', k:'inningsPitched'}, {l:'H', k:'hitsAllowed'}, {l:'ER', k:'earnedRuns'}, 
                     {l:'K', k:'strikeouts'}, {l:'BB', k:'walksAllowed'}, {l:'Sv', k:'saves'}
                   ].map(field => (
                     <div key={field.k}>
                        <label className="block text-[9px] font-bold text-slate-400 text-center">{field.l}</label>
                        <input 
                          type="number" 
                          className="w-full p-1 border rounded text-center text-sm" 
                          placeholder="0" 
                          value={game.stats?.[field.k] === 0 ? '' : (game.stats?.[field.k] || '')} 
                          onChange={e => handleStatChange(field.k, e.target.value)} 
                        />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
        <div className="p-4 border-t flex gap-2">
           <button onClick={onCancel} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded">Cancel</button>
           <button onClick={() => onSave({ ...game, scoreUs: game.scoreUs || 0, scoreThem: game.scoreThem || 0 })} className="flex-1 py-2 text-white font-bold rounded" style={{ backgroundColor: colors.primary }}>Save Game</button>
        </div>
      </div>
    </div>
  );
};

// --- Season Form Modal ---
const SeasonFormModal = ({ initialData, onSave, onCancel }) => {
   const [formData, setFormData] = useState(initialData || {
      year: new Date().getFullYear().toString(),
      teamName: '', age: '', number: '',
      positions: '', bats: 'R', throws: 'R', hometown: '',
      colors: { primary: '#0C2340', secondary: '#5BC2BD', accent: '#C4CED4', text: '#FFFFFF' }
   });

   const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
   const handleColorChange = (key, val) => setFormData(prev => ({ ...prev, colors: { ...prev.colors, [key]: val }}));

   return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[90]">
         <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
               <Trophy className="w-5 h-5 text-yellow-500" /> {initialData ? 'Edit Season' : 'Start New Season'}
            </h2>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-500">Year</label><input name="year" value={formData.year} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                  <div><label className="text-xs font-bold text-slate-500">Age Group</label><input name="age" value={formData.age} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g. 10" /></div>
               </div>
               <div><label className="text-xs font-bold text-slate-500">Team Name</label><input name="teamName" value={formData.teamName} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g. City Baseball" /></div>
               <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-xs font-bold text-slate-500">Number</label><input name="number" value={formData.number} onChange={handleChange} className="w-full p-2 border rounded" /></div>
                  <div><label className="text-xs font-bold text-slate-500">Bats</label><select name="bats" value={formData.bats} onChange={handleChange} className="w-full p-2 border rounded"><option>R</option><option>L</option><option>S</option></select></div>
                  <div><label className="text-xs font-bold text-slate-500">Throws</label><select name="throws" value={formData.throws} onChange={handleChange} className="w-full p-2 border rounded"><option>R</option><option>L</option></select></div>
               </div>
               <div><label className="text-xs font-bold text-slate-500">Positions</label><input name="positions" value={formData.positions} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g. 1B / Pitcher" /></div>
               <div><label className="text-xs font-bold text-slate-500">Hometown</label><input name="hometown" value={formData.hometown} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g. Seattle, WA" /></div>
               
               <div className="border-t pt-4">
                  <label className="text-xs font-bold text-slate-500 mb-2 block flex items-center gap-1"><Palette className="w-3 h-3"/> Team Color Scheme</label>
                  <div className="grid grid-cols-3 gap-4">
                     <div><label className="text-[10px] text-slate-400">Primary</label><input type="color" value={formData.colors.primary} onChange={e => handleColorChange('primary', e.target.value)} className="w-full h-8 cursor-pointer" /></div>
                     <div><label className="text-[10px] text-slate-400">Secondary</label><input type="color" value={formData.colors.secondary} onChange={e => handleColorChange('secondary', e.target.value)} className="w-full h-8 cursor-pointer" /></div>
                     <div><label className="text-[10px] text-slate-400">Accent</label><input type="color" value={formData.colors.accent} onChange={e => handleColorChange('accent', e.target.value)} className="w-full h-8 cursor-pointer" /></div>
                  </div>
               </div>
            </div>
            <div className="flex gap-3 mt-6">
               <button onClick={onCancel} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded">Cancel</button>
               <button onClick={() => onSave(formData)} className="flex-1 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-900">{initialData ? 'Save Changes' : 'Create Season'}</button>
            </div>
         </div>
      </div>
   );
};

const TournamentForm = ({ initialData, onSave, onCancel, colors }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '', location: '', latitude: '', longitude: '',
    startDate: '', endDate: '', result: 'Pool Play ⚾', milesTraveled: 0,
    albumLink: '', coverPhoto: '', games: []
  });
  const [editingGameIndex, setEditingGameIndex] = useState(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSaveGame = (gameData) => {
    const newGames = [...(formData.games || [])];
    if (editingGameIndex !== null) { newGames[editingGameIndex] = gameData; } else { newGames.push(gameData); }
    setFormData({ ...formData, games: newGames });
    setIsGameModalOpen(false);
    setEditingGameIndex(null);
  };
  const removeGame = (idx) => { const newGames = [...formData.games]; newGames.splice(idx, 1); setFormData({ ...formData, games: newGames }); };
  const handleSubmit = (e) => {
    e.preventDefault();
    const aggStats = (formData.games || []).reduce((acc, g) => {
       const s = g.stats || INITIAL_GAME_STATS;
       Object.keys(s).forEach(k => { if (!acc[k]) acc[k] = 0; acc[k] += (s[k] || 0); });
       return acc;
    }, {});
    const wins = (formData.games || []).filter(g => g.result === 'W').length;
    const losses = (formData.games || []).filter(g => g.result === 'L').length;
    const ties = (formData.games || []).filter(g => g.result === 'T').length;
    onSave({ ...formData, ...aggStats, wins, losses, ties, gamesPlayed: formData.games ? formData.games.length : 0 });
  };

  return (
    <div className="fixed inset-0 bg-[#0C2340]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ backgroundColor: `${colors.primary}E6` }}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-black uppercase tracking-wide" style={{ fontFamily: 'BioRhyme, serif', color: colors.primary }}>
            {initialData ? 'Edit Tournament' : 'Add Tournament'}
          </h2>
          <button onClick={onCancel}><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Tournament Name</label><input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg font-bold" style={{ color: colors.primary }} placeholder="e.g. State Championship" /></div>
             <div><label className="block text-xs font-bold text-slate-500 mb-1">Location</label><input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="e.g. Seattle" /></div>
             <div><label className="block text-xs font-bold text-slate-500 mb-1">Result</label><select name="result" value={formData.result} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg bg-white"><option>Pool Play ⚾</option><option>Champions 🏆</option><option>2nd Place 🥈</option><option>Semi-Finals 🥉</option><option>Consolation Champs 🏅</option></select></div>
             <div><label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" /></div>
             <div><label className="block text-xs font-bold text-slate-500 mb-1">End Date</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" /></div>
             <div className="md:col-span-2 grid grid-cols-3 gap-4">
               <div><label className="block text-xs font-bold text-slate-500 mb-1">Miles</label><input type="number" name="milesTraveled" value={formData.milesTraveled} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="e.g. 150" /></div>
               <div><label className="block text-xs font-bold text-slate-500 mb-1">Lat</label><input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="e.g. 47.6062" /></div>
               <div><label className="block text-xs font-bold text-slate-500 mb-1">Long</label><input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="e.g. -122.3321" /></div>
             </div>
             <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Cover Photo</label><input type="url" name="coverPhoto" value={formData.coverPhoto} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="Direct image link (jpg/png)..." /></div>
             <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Album Link</label><input type="url" name="albumLink" value={formData.albumLink} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="https://..." /></div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: colors.primary }}>
                   <Layout className="w-4 h-4" /> Game Log
                </h3>
                <button type="button" onClick={() => { setEditingGameIndex(null); setIsGameModalOpen(true); }} className="text-xs font-bold text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:opacity-90" style={{ backgroundColor: colors.secondary }}>
                   <Plus className="w-3 h-3" /> Add Game
                </button>
             </div>
             {(!formData.games || formData.games.length === 0) ? (
                <div className="text-center text-slate-400 text-sm py-4 italic">No games added. Add games to calculate stats.</div>
             ) : (
                <div className="space-y-2">
                   {formData.games.map((g, idx) => (
                      <GameLogItem key={idx} game={g} onClick={() => { setEditingGameIndex(idx); setIsGameModalOpen(true); }} onDelete={() => removeGame(idx)} colors={colors} />
                   ))}
                </div>
             )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 py-3 text-white font-bold rounded-lg shadow-lg" style={{ backgroundColor: colors.primary }}>Save Tournament</button>
          </div>
        </form>
      </div>

      {isGameModalOpen && (
         <GameFormModal 
            initialGame={editingGameIndex !== null ? formData.games[editingGameIndex] : null}
            onSave={handleSaveGame}
            onCancel={() => { setIsGameModalOpen(false); setEditingGameIndex(null); }}
            colors={colors}
         />
      )}
    </div>
  );
};

const TournamentDetail = ({ tournament, onBack, onEdit, onDelete, onUpdate, colors }) => {
   // ... existing detail logic ...
   const [gameToView, setGameToView] = useState(null);
   const [journalEntry, setJournalEntry] = useState(tournament.journal || '');
   const [isJournalEditing, setIsJournalEditing] = useState(false);
   const [newGame, setNewGame] = useState({ opponent: '', scoreUs: 0, scoreThem: 0, result: 'W', type: 'Pool Play', stats: { ...INITIAL_GAME_STATS } });

   const addGameFromDetail = (newGameData) => {
      const updatedGames = [...(tournament.games || []), newGameData];
      const aggStats = updatedGames.reduce((acc, g) => {
         const s = g.stats || INITIAL_GAME_STATS;
         Object.keys(s).forEach(k => { if (!acc[k]) acc[k] = 0; acc[k] += (s[k] || 0); });
         return acc;
      }, {});
      const wins = updatedGames.filter(g => g.result === 'W').length;
      const losses = updatedGames.filter(g => g.result === 'L').length;
      const ties = updatedGames.filter(g => g.result === 'T').length;

      onUpdate(tournament.id, { games: updatedGames, wins, losses, ties, gamesPlayed: updatedGames.length, ...aggStats });
   };

   const [isDetailGameModalOpen, setIsDetailGameModalOpen] = useState(false);

   const deleteGame = async (idx) => {
      const updatedGames = [...(tournament.games || [])];
      updatedGames.splice(idx, 1);
      const aggStats = updatedGames.reduce((acc, g) => { const s = g.stats || INITIAL_GAME_STATS; Object.keys(s).forEach(k => { if (!acc[k]) acc[k] = 0; acc[k] += (s[k] || 0); }); return acc; }, {});
      const wins = updatedGames.filter(g => g.result === 'W').length;
      const losses = updatedGames.filter(g => g.result === 'L').length;
      const ties = updatedGames.filter(g => g.result === 'T').length;
      await onUpdate(tournament.id, { games: updatedGames, wins, losses, ties, gamesPlayed: updatedGames.length, ...aggStats });
   };

   const saveJournal = async () => { await onUpdate(tournament.id, { journal: journalEntry }); setIsJournalEditing(false); };

   // Stats calcs - safe defaults
   const atBats = tournament.atBats || 0;
   const hits = (tournament.singles||0) + (tournament.doubles||0) + (tournament.triples||0) + (tournament.homeRuns||0);
   const avg = atBats > 0 ? (hits / atBats).toFixed(3).replace('0.', '.') : '.000';
   
   const plateApps = tournament.plateAppearances || 0;
   const onBase = hits + (tournament.walks||0) + (tournament.hbp||0);
   const obp = plateApps > 0 ? (onBase / plateApps).toFixed(3).replace('0.', '.') : '.000';

   const ip = tournament.inningsPitched || 0;
   const er = tournament.earnedRuns || 0;
   const era = ip > 0 ? ((er * 6) / ip).toFixed(2) : '-';

   return (
      <div className="animate-in slide-in-from-right duration-300">
         <button onClick={onBack} className="mb-4 flex items-center text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
         </button>

         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-48 md:h-64 relative" style={{ backgroundColor: colors.primary }}>
               {tournament.coverPhoto ? (
                  <img src={tournament.coverPhoto} className="w-full h-full object-cover opacity-80" />
               ) : (
                  <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
               <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                  <div className="flex justify-between items-end">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-white/90 text-[10px] font-black px-2 py-0.5 rounded uppercase" style={{ backgroundColor: colors.secondary }}>{tournament.result}</span>
                           <span className="text-slate-300 text-xs font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(tournament.startDate)}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-none mb-2" style={{ fontFamily: 'BioRhyme, serif' }}>{tournament.name}</h1>
                        <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                           <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {tournament.location}</span>
                           <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {tournament.milesTraveled} Miles</span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => onEdit(tournament.id)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(tournament.id)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-6 md:p-8">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-1">Batting AVG</div>
                     <div className="text-3xl font-black" style={{ color: colors.primary }}>{avg}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-1">On Base %</div>
                     <div className="text-3xl font-black" style={{ color: colors.primary }}>{obp}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-1">Hits</div>
                     <div className="text-3xl font-black" style={{ color: colors.primary }}>{hits}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-1">ERA</div>
                     <div className="text-3xl font-black text-orange-500">{era}</div>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                  <div>
                     <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
                        <Layout className="w-4 h-4" /> Game Log
                     </h3>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                       <div className="space-y-2 max-h-[300px] overflow-y-auto">
                           {(tournament.games || []).map((g, idx) => (
                              <GameLogItem key={idx} game={g} onClick={() => setGameToView(g)} onDelete={() => deleteGame(idx)} colors={colors} />
                           ))}
                           {(!tournament.games || tournament.games.length === 0) && (
                              <div className="text-slate-400 italic text-sm text-center py-4">No games logged yet.</div>
                           )}
                       </div>
                     </div>
                     <button 
                        onClick={() => setIsDetailGameModalOpen(true)}
                        className="w-full py-2 text-white text-xs font-bold rounded hover:opacity-90 transition-colors"
                        style={{ backgroundColor: colors.primary }}
                     >
                        ADD GAME
                     </button>
                  </div>

                  <div>
                     <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
                        <BookOpen className="w-4 h-4" /> Journal & Photos
                     </h3>
                     {tournament.albumLink && (
                        <a href={tournament.albumLink} target="_blank" rel="noreferrer" className="block mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group">
                           <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-full shadow-sm text-blue-600"><Target className="w-5 h-5" /></div>
                              <div>
                                 <div className="font-bold text-blue-900 text-sm group-hover:underline">View Google Photos Album</div>
                                 <div className="text-blue-700/60 text-xs">External Link</div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-blue-400 ml-auto" />
                           </div>
                        </a>
                     )}
                     <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                           <div className="text-xs font-bold text-slate-400 uppercase">Memory Log</div>
                           <button onClick={isJournalEditing ? saveJournal : () => setIsJournalEditing(true)} className="text-xs font-bold hover:underline" style={{ color: colors.secondary }}>
                              {isJournalEditing ? 'Save Entry' : 'Edit Entry'}
                           </button>
                        </div>
                        {isJournalEditing ? (
                           <textarea 
                             className="w-full h-40 p-4 text-sm border rounded-xl outline-none bg-yellow-50/50"
                             style={{ borderColor: colors.secondary, focusRingColor: colors.secondary }}
                             value={journalEntry}
                             onChange={(e) => setJournalEntry(e.target.value)}
                             placeholder="Write about the tournament..."
                           />
                        ) : (
                           <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px] shadow-sm">
                              {journalEntry || "No journal entry yet."}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Read-Only Game Modal */}
         {gameToView && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[80]" onClick={() => setGameToView(null)}>
               <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                     <h3 className="font-black text-lg" style={{ color: colors.primary }}>Game Details vs {gameToView.opponent}</h3>
                     <button onClick={() => setGameToView(null)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="bg-slate-50 p-2 rounded text-center"><span className="text-xs text-slate-400 block font-bold">Result</span><span className="font-bold" style={{ color: colors.primary }}>{gameToView.result} ({gameToView.scoreUs}-{gameToView.scoreThem})</span></div>
                     <div className="bg-slate-50 p-2 rounded text-center"><span className="text-xs text-slate-400 block font-bold">Type</span><span className="font-bold" style={{ color: colors.primary }}>{gameToView.type}</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                     {gameToView.stats && Object.entries(gameToView.stats).map(([k, v]) => (
                        v > 0 && (
                           <div key={k} className="border p-1 rounded">
                              <span className="block text-[9px] text-slate-400 uppercase font-bold">{STAT_LABELS[k] || k}</span>
                              <span className="font-mono font-bold" style={{ color: colors.primary }}>{v}</span>
                           </div>
                        )
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* Add Game Modal (Detail View) */}
         {isDetailGameModalOpen && (
            <GameFormModal 
               initialGame={null}
               onSave={(g) => { addGameFromDetail(g); setIsDetailGameModalOpen(false); }}
               onCancel={() => setIsDetailGameModalOpen(false)}
               colors={colors}
            />
         )}
      </div>
   );
};

// --- MAIN AUTHENTICATED APP ---
function AuthenticatedApp({ user, onLogout }) {
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(DEFAULT_SEASON);
  const [tournaments, setTournaments] = useState([]);
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState(null);
  const [seasonDeleteId, setSeasonDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [view, setView] = useState('dashboard');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const colors = activeSeason.colors || DEFAULT_SEASON.colors;

  // Inject BioRhyme Font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=BioRhyme:wght@200..800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Fetch Seasons
  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'seasons'), orderBy('year', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
       if (docs.length > 0) {
          setSeasons(docs);
          // Only switch season if we are currently on the "default placeholder"
          if (activeSeason.id === 'default-2025') {
              setActiveSeason(docs[docs.length - 1]);
          }
       } else {
          setSeasons([DEFAULT_SEASON]);
       }
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Tournaments for Active Season
  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'tournaments'), 
      orderBy('startDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTourneys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allTourneys.filter(t => {
         const tSeason = t.seasonId || 'default-2025';
         return tSeason === activeSeason.id;
      });
      setTournaments(filtered);
    });
    return () => unsubscribe();
  }, [user, activeSeason.id]);

  // Handlers
  const handleSaveTournament = async (data) => {
    const dataWithSeason = { ...data, seasonId: activeSeason.id };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tournaments', editingId), dataWithSeason);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tournaments'), dataWithSeason);
      }
      setIsFormOpen(false);
      setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const handleUpdateTournament = async (id, data) => {
     await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tournaments', id), data);
  };

  const handleDeleteTournament = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tournaments', deleteId));
    setDeleteId(null);
    if(view === 'detail') setView('dashboard');
  };

  const handleSaveSeason = async (data) => {
     if (editingSeasonId === 'default-2025') {
        // Special case: Persist the default season to DB with a known ID
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'seasons', 'default-2025'), data, { merge: true });
        if (activeSeason.id === 'default-2025') setActiveSeason({ ...data, id: 'default-2025' });
     } else if (editingSeasonId) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'seasons', editingSeasonId), data);
        if (activeSeason.id === editingSeasonId) setActiveSeason({ ...activeSeason, ...data });
     } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'seasons'), data);
     }
     setIsSeasonModalOpen(false);
     setEditingSeasonId(null);
  };

  const handleDeleteSeason = async () => {
    if (!seasonDeleteId || seasons.length <= 1) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'seasons', seasonDeleteId));
        if (activeSeason.id === seasonDeleteId) {
            const remaining = seasons.filter(s => s.id !== seasonDeleteId);
            if (remaining.length > 0) setActiveSeason(remaining[remaining.length - 1]);
        }
        setSeasonDeleteId(null);
    } catch (e) { console.error(e); }
  };

  const openSeasonEdit = (season) => {
    setEditingSeasonId(season.id);
    setIsSeasonModalOpen(true);
    setIsSeasonDropdownOpen(false);
  };

  const openDetail = (t) => { setSelectedTournamentId(t.id); setView('detail'); };
  const openEdit = (id) => { setEditingId(id); setIsFormOpen(true); };
  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  // Derived Stats
  const stats = useMemo(() => {
    const total = tournaments.reduce((acc, t) => {
      const g = t.games || [];
      const wins = t.wins || g.filter(x=>x.result==='W').length || 0;
      const losses = t.losses || g.filter(x=>x.result==='L').length || 0;
      const ties = t.ties || g.filter(x=>x.result==='T').length || 0;
      const isChamp = t.result && (t.result.includes('Champions') || t.result.includes('🏆'));
      const isRunnerUp = t.result && (t.result.includes('2nd Place') || t.result.includes('🥈'));

      return {
        games: acc.games + (t.gamesPlayed || g.length || 0),
        wins: acc.wins + wins,
        losses: acc.losses + losses,
        ties: acc.ties + ties,
        miles: acc.miles + (t.milesTraveled || 0),
        titles: acc.titles + (isChamp ? 1 : 0),
        runnerUps: acc.runnerUps + (isRunnerUp ? 1 : 0),
        
        pa: acc.pa + (t.plateAppearances || 0),
        ab: acc.ab + (t.atBats || 0),
        runs: acc.runs + (t.runsScored || 0),
        singles: acc.singles + (t.singles || 0),
        doubles: acc.doubles + (t.doubles || 0),
        triples: acc.triples + (t.triples || 0),
        hr: acc.hr + (t.homeRuns || 0),
        walks: acc.walks + (t.walks || 0),
        hbp: acc.hbp + (t.hbp || 0),
        rbi: acc.rbi + (t.rbi || 0),
        sb: acc.sb + (t.stolenBases || 0),
        sac: acc.sac + (t.sacrifices || 0),
        
        gamesPitched: acc.gamesPitched + (t.gamesPitched || 0),
        ip: acc.ip + (t.inningsPitched || 0),
        hitsAllowed: acc.hitsAllowed + (t.hitsAllowed || 0),
        er: acc.er + (t.earnedRuns || 0),
        so: acc.so + (t.strikeouts || 0),
        bb_pitch: acc.bb_pitch + (t.walksAllowed || 0),
        p_wins: acc.p_wins + (t.pitchingWins || 0),
        p_losses: acc.p_losses + (t.pitchingLosses || 0),
        saves: acc.saves + (t.saves || 0),
      };
    }, { 
      games: 0, wins: 0, losses: 0, ties: 0, miles: 0, titles: 0, runnerUps: 0,
      pa: 0, ab: 0, runs: 0, singles: 0, doubles: 0, triples: 0, hr: 0, walks: 0, hbp: 0, rbi: 0, sb: 0, sac: 0,
      gamesPitched: 0, ip: 0, hitsAllowed: 0, er: 0, so: 0, bb_pitch: 0, p_wins: 0, p_losses: 0, saves: 0
    });

    const totalHits = total.singles + total.doubles + total.triples + total.hr;
    const avg = total.ab > 0 ? (totalHits / total.ab).toFixed(3).replace('0.', '.') : '.000';
    const onBase = totalHits + total.walks + total.hbp;
    const obp = total.pa > 0 ? (onBase / total.pa).toFixed(3).replace('0.', '.') : '.000';
    const totalBases = total.singles + (2 * total.doubles) + (3 * total.triples) + (4 * total.hr);
    const slg = total.ab > 0 ? (totalBases / total.ab) : 0;
    const ops = (parseFloat(obp) + slg).toFixed(3);
    const era = total.ip > 0 ? ((total.er * 6) / total.ip).toFixed(2) : '0.00';
    const whip = total.ip > 0 ? ((total.bb_pitch + total.hitsAllowed) / total.ip).toFixed(2) : '0.00';

    return { ...total, totalHits, avg, obp, ops, era, whip };
  }, [tournaments]);

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-900 flex flex-col">
      
      {/* --- HERO HEADER --- */}
      <div className="pb-24 pt-8 px-6 shadow-2xl relative overflow-hidden transition-colors duration-500" style={{ backgroundColor: colors.primary }}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] -mr-32 -mt-48 opacity-15 pointer-events-none" style={{ backgroundColor: colors.secondary }}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px] -ml-20 -mb-20 opacity-10 pointer-events-none"></div>
        
       <div className="relative z-10 max-w-6xl mx-auto">
           {/* App Branding & Season Selector */}
           <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-4">
              <div className="flex flex-col">
                 <div className="text-2xl md:text-3xl font-bold tracking-wider uppercase leading-none mb-1" style={{ fontFamily: 'BioRhyme, serif', color: colors.secondary }}>Diamond Days</div>
                 <div className="text-xs text-white/60 uppercase tracking-[0.2em] font-light">Memories from Travel Ball</div>
              </div>
              
              <div className="flex items-center gap-3">
                 {/* Season Selector */}
                 <div className="relative">
                    <button 
                       onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                       className="flex items-center gap-2 text-white/90 hover:text-white font-bold text-sm bg-black/20 px-3 py-1.5 rounded-lg transition-all"
                    >
                       <span>{activeSeason.year} Season</span>
                       <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {isSeasonDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                         <div className="py-1">
                            {seasons.map(s => (
                               <div key={s.id} className="flex items-center justify-between hover:bg-slate-50 group">
                                  <button 
                                    onClick={() => { setActiveSeason(s); setIsSeasonDropdownOpen(false); }}
                                    className={`flex-1 text-left px-4 py-2 text-sm font-bold ${activeSeason.id === s.id ? 'text-blue-900 bg-blue-50' : 'text-slate-600'}`}
                                  >
                                     {s.year} Season
                                  </button>
                                  <div className="flex gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); openSeasonEdit(s); }}
                                       className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200"
                                       title="Edit Season"
                                    >
                                       <Edit2 className="w-3 h-3" />
                                    </button>
                                    {seasons.length > 1 && (
                                      <button 
                                         onClick={(e) => { e.stopPropagation(); setSeasonDeleteId(s.id); setIsSeasonDropdownOpen(false); }}
                                         className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-200"
                                         title="Delete Season"
                                      >
                                         <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                               </div>
                            ))}
                            <div className="border-t border-slate-100 mt-1 pt-1">
                               <button 
                                 onClick={() => { setEditingSeasonId(null); setIsSeasonModalOpen(true); setIsSeasonDropdownOpen(false); }}
                                 className="w-full text-left px-4 py-2 text-xs font-black text-slate-400 hover:text-blue-600 hover:bg-slate-50 uppercase tracking-wider flex items-center gap-2"
                               >
                                  <Plus className="w-3 h-3" /> Add Season
                               </button>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
                 
                 <button 
                    onClick={onLogout}
                    className="bg-black/20 hover:bg-white/10 text-white/80 p-2 rounded-lg transition-colors"
                    title="Sign Out"
                 >
                    <LogOut className="w-4 h-4" />
                 </button>
              </div>
           </div>

           {/* Top Nav */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-[6px] flex items-center justify-center overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300" style={{ borderColor: colors.secondary }}>
                    <span className="font-black text-3xl md:text-4xl" style={{ fontFamily: 'BioRhyme, serif', color: colors.primary }}>#{activeSeason.number}</span>
                 </div>
                 <div className="flex flex-col">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-white drop-shadow-sm mb-2" style={{ fontFamily: 'BioRhyme, serif' }}>
                       BEN SEELY
                    </h1>
                    <div className="text-white/60 text-sm font-bold tracking-widest uppercase mb-2">{activeSeason.teamName}</div>
                    <div className="flex flex-wrap items-center gap-4 text-white/80 font-bold text-sm tracking-wider uppercase">
                       <span className="flex items-center gap-1"><Shield className="w-4 h-4" style={{ color: colors.secondary }} /> {activeSeason.positions}</span>
                       <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.secondary }}></span>
                       <span className="flex items-center gap-1"><User className="w-4 h-4" style={{ color: colors.secondary }} /> Age {activeSeason.age}</span>
                       <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.secondary }}></span>
                       <span className="flex items-center gap-1"><Zap className="w-4 h-4" style={{ color: colors.secondary }} /> B/T: {activeSeason.bats}/{activeSeason.throws}</span>
                       <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.secondary }}></span>
                       <span className="flex items-center gap-1"><MapPin className="w-4 h-4" style={{ color: colors.secondary }} /> {activeSeason.hometown}</span>
                    </div>
                 </div>
              </div>
              <div className="flex backdrop-blur-md p-1 rounded-xl border border-white/10 self-start md:self-auto" style={{ backgroundColor: `${colors.primary}80` }}>
                 {['dashboard', 'timeline', 'map'].map((v) => (
                    <button 
                      key={v}
                      onClick={() => setView(v)} 
                      className={`px-5 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${view === v ? 'shadow-lg scale-105 text-slate-900' : 'text-slate-300 hover:bg-white/5'}`}
                      style={{ backgroundColor: view === v ? colors.secondary : 'transparent', color: view === v ? colors.primary : undefined }}
                    >
                      {v}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-20 flex-1 w-full">
        
        {/* --- DASHBOARD VIEW --- */}
        {view === 'dashboard' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* 1. HEADLINE STATS */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 mb-8">
                 <h2 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-2" style={{ color: colors.primary }}>
                    <Activity className="w-5 h-5" style={{ color: colors.secondary }} /> {activeSeason.year} Season at a Glance
                 </h2>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard label="GAMES" value={stats.games} icon={Calendar} colors={colors} />
                    <StatCard label="WINS" value={stats.wins} icon={Trophy} colors={colors} />
                    <StatCard label="MILES" value={stats.miles} icon={MapPin} colors={colors} />
                    <StatCard label="TITLES" value={stats.titles} icon={Medal} colors={colors} />
                    <StatCard label="RUNNER-UPS" value={stats.runnerUps} icon={Medal} colors={colors} />
                 </div>
              </div>
              
              {/* 2. RECENT MEMORIES */}
              <div className="mb-8">
                 <div className="flex justify-between items-end mb-4 px-2">
                    <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: colors.primary }}>Recent Memories</h2>
                    <button onClick={() => { setEditingId(null); setIsFormOpen(true); }} className="text-xs font-bold hover:opacity-80 flex items-center gap-1 transition-colors" style={{ color: colors.secondary }}>
                       <Plus className="w-4 h-4" /> ADD MEMORY
                    </button>
                 </div>

                 {tournaments.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border-2 border-dashed border-slate-200">
                       <p className="text-slate-400 font-medium">No memories logged yet for {activeSeason.year}.</p>
                       <button onClick={() => { setEditingId(null); setIsFormOpen(true); }} className="mt-4 px-6 py-2 text-white rounded-lg font-bold text-sm" style={{ backgroundColor: colors.primary }}>Create First Log</button>
                    </div>
                 ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                       {tournaments.slice(0, 3).map(t => (
                          <div key={t.id} onClick={() => openDetail(t)} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 group flex flex-col h-full">
                             {/* Card Image Area */}
                             <div className="h-40 relative overflow-hidden" style={{ backgroundColor: colors.primary }}>
                                {t.coverPhoto ? (
                                   <img src={t.coverPhoto} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                   <div className="w-full h-full bg-gradient-to-br from-black/20 to-transparent flex items-center justify-center">
                                      <Trophy className="w-12 h-12 text-white/20" />
                                   </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-90"></div>
                                <div className="absolute bottom-3 left-4 text-white">
                                   <div className="font-black text-lg leading-tight uppercase tracking-tight" style={{ fontFamily: 'BioRhyme, serif' }}>{t.name}</div>
                                   <div className="text-[10px] font-bold flex items-center gap-1 mt-1 uppercase tracking-wider" style={{ color: colors.secondary }}>
                                      <MapPin className="w-3 h-3" /> {t.location}
                                   </div>
                                </div>
                                {(t.result && (t.result.includes('Champions') || t.result.includes('🏆'))) && (
                                   <div className="absolute top-3 right-3 text-[#0C2340] text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider border border-yellow-300" style={{ backgroundColor: '#FCD34D' }}>
                                      Champion
                                   </div>
                                )}
                             </div>
                             {/* Card Body */}
                             <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                   <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MILES</div>
                                      <div className="font-black text-lg leading-none" style={{ color: colors.primary }}>{t.milesTraveled || 0}</div>
                                   </div>
                                   <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GAMES</div>
                                      <div className="font-black text-lg leading-none" style={{ color: colors.primary }}>{t.gamesPlayed || (t.games ? t.games.length : 0)}</div>
                                   </div>
                                   <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DATE</div>
                                      <div className="font-black text-sm leading-none py-1" style={{ color: colors.primary }}>{formatDate(t.startDate)}</div>
                                   </div>
                                </div>
                                <div className="text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all self-end" style={{ color: colors.secondary }}>
                                   View Stats <ChevronRight className="w-3 h-3" />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* 3. DETAILED SEASON STATS (Baseball Card Style) */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-12">
                 <div className="p-4 flex justify-between items-center" style={{ backgroundColor: colors.primary }}>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                       <Hash className="w-5 h-5" style={{ color: colors.secondary }} /> {activeSeason.year} Season Statistics
                    </h2>
                    <div className="text-[10px] font-bold uppercase tracking-widest border px-2 py-1 rounded" style={{ color: colors.secondary, borderColor: colors.secondary }}>Official Player Record</div>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-px bg-slate-200">
                    {/* Offense Column */}
                    <div className="bg-white">
                       <div className="bg-slate-50 p-3 border-b border-slate-200 text-center">
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: colors.primary }}>Offensive Stats</span>
                       </div>
                       <div className="grid grid-cols-4">
                          <BaseballCardStat label="AVG" value={stats.avg} colors={colors} />
                          <BaseballCardStat label="OPS" value={stats.ops} colors={colors} />
                          <BaseballCardStat label="OBP" value={stats.obp} colors={colors} />
                          <BaseballCardStat label="AB" value={stats.ab} colors={colors} />
                          <BaseballCardStat label="HITS" value={stats.totalHits} colors={colors} />
                          <BaseballCardStat label="2B" value={stats.doubles} colors={colors} />
                          <BaseballCardStat label="3B" value={stats.triples} colors={colors} />
                          <BaseballCardStat label="HR" value={stats.hr} colors={colors} />
                          <BaseballCardStat label="RBI" value={stats.rbi} colors={colors} />
                          <BaseballCardStat label="RUNS" value={stats.runs} colors={colors} />
                          <BaseballCardStat label="SB" value={stats.sb} colors={colors} />
                          <BaseballCardStat label="BB" value={stats.walks} colors={colors} />
                       </div>
                    </div>

                    {/* Pitching Column */}
                    <div className="bg-white">
                       <div className="bg-slate-50 p-3 border-b border-slate-200 text-center">
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: colors.primary }}>Pitching Stats</span>
                       </div>
                       <div className="grid grid-cols-4">
                          <BaseballCardStat label="ERA" value={stats.era} colors={colors} />
                          <BaseballCardStat label="WHIP" value={stats.whip} colors={colors} />
                          <BaseballCardStat label="IP" value={stats.ip} colors={colors} />
                          <BaseballCardStat label="G" value={stats.gamesPitched} colors={colors} />
                          <BaseballCardStat label="K" value={stats.so} colors={colors} />
                          <BaseballCardStat label="BB" value={stats.bb_pitch} colors={colors} />
                          <BaseballCardStat label="W" value={stats.p_wins} colors={colors} />
                          <BaseballCardStat label="SV" value={stats.saves} colors={colors} />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- TIMELINE VIEW --- */}
        {view === 'timeline' && (
           <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-300 uppercase">Season Timeline</h2>
                 <button onClick={() => { setEditingId(null); setIsFormOpen(true); }} className="text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: colors.secondary }}>
                    <Plus className="w-4 h-4" /> Log Event
                 </button>
              </div>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                 {[...tournaments].reverse().map((t, idx) => {
                    const isChamp = t.result && (t.result.includes('Champions') || t.result.includes('🏆'));
                    const isRunnerUp = t.result && (t.result.includes('2nd Place') || t.result.includes('🥈'));
                    
                    return (
                    <div key={t.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                       {/* Icon Marker */}
                       <div 
                          className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#F0F4F8] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 md:-ml-6 z-10 ${
                             isChamp ? 'ring-4 ring-yellow-100' : isRunnerUp ? 'ring-4 ring-slate-200' : ''
                          }`}
                          style={{ backgroundColor: isChamp ? '#FBBF24' : isRunnerUp ? '#94A3B8' : colors.primary }}
                       >
                          {isChamp ? <Trophy className="w-5 h-5 text-white" /> : isRunnerUp ? <Medal className="w-5 h-5 text-white" /> : <MapPin className="w-5 h-5" />}
                       </div>
                       
                       {/* Card */}
                       <div onClick={() => openDetail(t)} className={`w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-5 rounded-2xl shadow-sm border cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all ml-16 md:ml-0 ${
                          isChamp ? 'border-yellow-300 ring-2 ring-yellow-50' : 
                          isRunnerUp ? 'border-slate-300 ring-2 ring-slate-100' : 'border-slate-200'
                       }`}>
                          <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-black uppercase tracking-wider" style={{ color: colors.secondary }}>{formatDate(t.startDate)}</div>
                             {t.result && <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isChamp ? 'bg-yellow-100 text-yellow-800' : 
                                isRunnerUp ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-600'
                             }`}>{t.result}</span>}
                          </div>
                          <h3 className="font-bold text-lg mb-1 flex items-center gap-2" style={{ fontFamily: 'BioRhyme, serif', color: colors.primary }}>
                             {t.name}
                             {isChamp && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                          </h3>
                          <div className="text-xs text-slate-500 mb-3 flex items-center gap-1 font-medium uppercase"><MapPin className="w-3 h-3" /> {t.location}</div>
                          
                          {t.coverPhoto && (
                             <div className="h-24 w-full rounded-lg bg-slate-100 mb-3 overflow-hidden">
                                <img src={t.coverPhoto} alt="" className="w-full h-full object-cover" />
                             </div>
                          )}

                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                             <div className="text-center">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">MILES</span>
                                <span className="font-bold" style={{ color: colors.primary }}>{t.milesTraveled || 0}</span>
                             </div>
                             <div className="text-center">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">GAMES</span>
                                <span className="font-bold" style={{ color: colors.primary }}>{t.gamesPlayed || (t.games ? t.games.length : 0)}</span>
                             </div>
                             <div className="text-center">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">DATE</span>
                                <span className="font-bold text-[10px] leading-3 py-1" style={{ color: colors.primary }}>{formatDate(t.startDate)}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 )})}
              </div>
           </div>
        )}

        {/* --- MAP VIEW --- */}
        {view === 'map' && (
           <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 h-[600px] flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h2 className="font-black uppercase flex items-center gap-2" style={{ color: colors.primary }}>
                    <MapIcon className="w-5 h-5" style={{ color: colors.secondary }} /> Travel Log
                 </h2>
                 <div className="text-xs font-bold text-slate-500">{tournaments.length} Locations Visited</div>
              </div>
              <div className="flex-1 relative bg-slate-100 overflow-hidden flex items-center justify-center p-4">
                 <div className="w-full max-w-4xl h-full">
                   <WashingtonMap tournaments={tournaments} onPinClick={openDetail} />
                 </div>
              </div>
           </div>
        )}

        {/* --- DETAIL VIEW --- */}
        {view === 'detail' && selectedTournament && (
           <TournamentDetail 
              tournament={selectedTournament} 
              onBack={() => setView('dashboard')}
              onEdit={openEdit}
              onDelete={handleDeleteTournament}
              onUpdate={handleUpdateTournament}
              colors={colors}
           />
        )}

      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-8">
         <div className="max-w-6xl mx-auto px-4 flex flex-row justify-center items-center gap-6 md:gap-12">
            <img src="https://0ebf220f63c8a281d66e-20abd5688b9423eda60643010803535a.ssl.cf1.rackcdn.com/GroupEventLogo_PG_LOGO_EVENT.png" alt="Perfect Game" className="h-6 md:h-8 opacity-80 grayscale hover:grayscale-0 transition-all" />
            <img src="https://6a0cf6b62aa911aca049-27c900f141e6d0a9441ae838d16cc44e.ssl.cf1.rackcdn.com/CityLogo_Adamchro.png" alt="City Baseball" className="h-10 md:h-14 scale-110 transform hover:scale-125 transition-transform" />
            <img src="https://toptiersports.net/wp-content/uploads/2024/08/TopTierLogo.png" alt="Top Tier" className="h-6 md:h-8 opacity-80 grayscale hover:grayscale-0 transition-all" />
         </div>
      </footer>

      {/* Global Modals */}
      {isFormOpen && (
        <TournamentForm 
          initialData={editingId ? tournaments.find(t => t.id === editingId) : null}
          onSave={handleSaveTournament}
          onCancel={() => { setIsFormOpen(false); setEditingId(null); }}
          colors={colors}
        />
      )}

      {isSeasonModalOpen && (
         <SeasonFormModal 
            initialData={editingSeasonId ? seasons.find(s => s.id === editingSeasonId) : null}
            onSave={handleSaveSeason}
            onCancel={() => { setIsSeasonModalOpen(false); setEditingSeasonId(null); }}
         />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-[#0C2340]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200">
            <h3 className="text-lg font-black text-[#0C2340] mb-2">Delete Memory?</h3>
            <p className="text-slate-600 mb-6 text-sm">This will permanently remove this tournament from your timeline.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-slate-600 font-bold bg-slate-50 hover:bg-slate-100 rounded-lg text-sm">CANCEL</button>
              <button onClick={handleDeleteTournament} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm">DELETE</button>
            </div>
          </div>
        </div>
      )}

      {seasonDeleteId && (
         <div className="fixed inset-0 bg-[#0C2340]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200">
               <h3 className="text-lg font-black text-[#0C2340] mb-2">Delete Season?</h3>
               <p className="text-slate-600 mb-6 text-sm">This will permanently delete this season configuration.</p>
               <div className="flex gap-3">
                  <button onClick={() => setSeasonDeleteId(null)} className="flex-1 py-2.5 text-slate-600 font-bold bg-slate-50 hover:bg-slate-100 rounded-lg text-sm">CANCEL</button>
                  <button onClick={handleDeleteSeason} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm">DELETE</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

// --- LOGIN COMPONENT ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Check that your domain is authorized in Firebase Console.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-400">Loading...</div>;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return <AuthenticatedApp user={user} onLogout={handleLogout} />;
}

export default App;