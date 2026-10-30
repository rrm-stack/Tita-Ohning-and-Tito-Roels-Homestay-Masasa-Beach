import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, Users, Waves, Wifi, Utensils, Snowflake, ShowerHead,
  CheckCircle2, MapPin, Search, Palmtree, BedDouble, Tv, Flame,
  Droplets, Zap, Mic2, CookingPot, Ship, Fish, CircleDot, Settings,
  ChevronLeft, ChevronRight, X, Save, RotateCcw, LockKeyhole,
  LogOut, Eye, EyeOff
} from "lucide-react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const defaultBooked = ["2026-11-06", "2026-11-07", "2026-11-14", "2026-11-20", "2026-11-21"];
const rates = [
  ["Couple", "Air-conditioned (AC) Room", "₱2,500"], ["Couple", "Fan Room", "₱2,000"],
  ["Adult", "Air-conditioned (AC) Room", "₱750 per head"], ["Adult", "Fan Room", "₱600 per head"],
  ["Children 3–6 years", "Air-conditioned (AC) Room", "₱500 per head"], ["Children 3–6 years", "Fan Room", "₱400 per head"]
];
const amenities = [
  [BedDouble,"3 rooms / 4 bathrooms"],[Users,"30-pax capacity"],[Utensils,"2 kitchens"],[Zap,"Generator"],
  [Droplets,"Uninterrupted water supply"],[CookingPot,"Kitchen wares"],[Flame,"Gas stove"],[Flame,"Grill"],
  [Mic2,"Videoke"],[Tv,"Cignal TV"],[Droplets,"Free 1 gallon mineral water"],[Snowflake,"Free ice"],[Wifi,"Wi-Fi (piso net / pay)"]
];
const activities = [
  [Ship,"Island hopping"],[Waves,"Lagoon"],[CircleDot,"Sepok (Dugong cave)"],[CircleDot,"Bath Cave"],
  [Palmtree,"Sombrero Island"],[Fish,"Fish feeding"],[Fish,"Snorkeling (Pawikan)"],[Waves,"Kayak"]
];
const pad = n => String(n).padStart(2,"0");
const dateKey = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`;

export default function App() {
  const [booked,setBooked] = useState(defaultBooked);
  const [savedBooked,setSavedBooked] = useState(defaultBooked);
  const [calendarLoading,setCalendarLoading] = useState(true);
  const [checkIn,setCheckIn] = useState("2026-11-01");
  const [checkOut,setCheckOut] = useState("2026-11-03");
  const [guests,setGuests] = useState(2);
  const [checked,setChecked] = useState(false);
  const [calendarMonth,setCalendarMonth] = useState(new Date(2026,10,1));
  const [settingsOpen,setSettingsOpen] = useState(false);
  const [ownerEdit,setOwnerEdit] = useState(false);
  const [ownerUser,setOwnerUser] = useState(null);
  const [loginOpen,setLoginOpen] = useState(false);
  const [ownerEmail,setOwnerEmail] = useState("");
  const [ownerPassword,setOwnerPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [loginError,setLoginError] = useState("");
  const [loginLoading,setLoginLoading] = useState(false);
  const [saveStatus,setSaveStatus] = useState("");

  useEffect(() => onAuthStateChanged(auth, setOwnerUser), []);
  useEffect(() => {
    const ref = doc(db,"availability","calendar");
    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        const dates = Array.isArray(snap.data().bookedDates) ? snap.data().bookedDates : [];
        setBooked(dates); setSavedBooked(dates);
      }
      setCalendarLoading(false);
    }, err => { console.error("Firestore read error:",err); setCalendarLoading(false); });
  }, []);

  const unavailable = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return true;
    const d = new Date(checkIn+"T00:00:00"), end = new Date(checkOut+"T00:00:00");
    while (d < end) {
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      if (booked.includes(key)) return true;
      d.setDate(d.getDate()+1);
    }
    return false;
  },[checkIn,checkOut,booked]);
  const nights = checkIn && checkOut ? Math.max(0,Math.round((new Date(checkOut)-new Date(checkIn))/86400000)) : 0;
  const year=calendarMonth.getFullYear(), month=calendarMonth.getMonth();
  const firstDay=new Date(year,month,1).getDay(), daysInMonth=new Date(year,month+1,0).getDate();
  const calendarCells=[...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const changeMonth = n => setCalendarMonth(new Date(year,month+n,1));

  const openOwnerSettings = () => ownerUser ? setSettingsOpen(true) : (setLoginError(""),setLoginOpen(true));
  const handleOwnerLogin = async e => {
    e.preventDefault(); setLoginLoading(true); setLoginError("");
    try {
      await signInWithEmailAndPassword(auth,ownerEmail.trim(),ownerPassword);
      setOwnerPassword(""); setLoginOpen(false); setSettingsOpen(true);
    } catch (err) {
  console.error("Firebase login error:", err);

  setLoginError(
    `${err.code}: ${err.message}`
  );
}
    finally { setLoginLoading(false); }
  };
  const handleLogout = async () => { await signOut(auth); setOwnerEdit(false); setSettingsOpen(false); };
  const toggleDay = d => {
    if (!ownerEdit || !ownerUser || !d) return;
    const key=dateKey(year,month,d);
    setBooked(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key].sort());
  };
  const closeSettings = () => { setBooked(savedBooked); setOwnerEdit(false); setSaveStatus(""); setSettingsOpen(false); };
  const saveBookedDates = async () => {
    if (!ownerUser) return;
    setSaveStatus("Saving...");
    try {
      await setDoc(doc(db,"availability","calendar"),{bookedDates:booked},{merge:true});
      setSavedBooked(booked); setSaveStatus("Saved"); setOwnerEdit(false); setSettingsOpen(false);
    } catch (err) { console.error(err); setSaveStatus("Unable to save changes."); }
  };

  const MonthGrid = ({editable=false}) => <div className="grid grid-cols-7 gap-2 mt-4 text-center">
    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="text-xs font-bold text-slate-500 py-2">{d}</div>)}
    {calendarCells.map((d,i)=>{
      const key=d?dateKey(year,month,d):"", isBooked=booked.includes(key);
      const cls=`min-h-14 rounded-xl flex items-center justify-center text-sm font-semibold ${!d?"":isBooked?"bg-rose-100 text-rose-700 border border-rose-200":"bg-emerald-50 text-emerald-700 border border-emerald-100"} ${editable&&ownerEdit&&d?"cursor-pointer ring-offset-2 hover:ring-2 ring-cyan-500":""}`;
      return editable ? <button type="button" key={i} disabled={!d||!ownerEdit} onClick={()=>toggleDay(d)} className={cls}>{d||""}</button> : <div key={i} className={cls}>{d||""}</div>;
    })}
  </div>;

  return <div className="min-h-screen bg-gradient-to-b from-sky-50 via-cyan-50 to-amber-50 text-slate-800">
    <header className="relative overflow-hidden bg-gradient-to-r from-cyan-700 via-sky-600 to-blue-700 text-white">
      <div className="relative max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8 items-center">
        <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}>
          <div className="flex items-center gap-2 text-cyan-100 font-medium mb-3"><Palmtree size={19}/> A homestay providing a cozy accommodation experience at Masasa Beach</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Tita Ohning & Tito Roel's<br/>Homestay</h1>
          <p className="mt-4 text-cyan-50 text-lg">Masasa Beach · San Juan, Tingloy, Batangas</p>
          <div className="mt-5 flex items-center gap-2 text-sm"><MapPin size={17}/> Masasa Beach, Tingloy, Batangas</div>
        </motion.div>
        <div className="rounded-[2rem] bg-white/10 border border-white/20 backdrop-blur p-6 shadow-xl">
          <div className="flex items-center justify-between gap-3"><p className="text-sm text-cyan-100">Stay highlights</p><button onClick={openOwnerSettings} className="flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl text-sm"><Settings size={16}/> Owner settings</button></div>
          <div className="grid grid-cols-3 gap-3 mt-3">{[["3 rooms","4 bathrooms"],["Up to","30 pax"],["From","₱600/head"]].map(([a,b])=><div className="bg-white/15 p-4 rounded-2xl text-center" key={b}><div className="font-bold text-lg">{a}</div><div className="text-xs text-cyan-100">{b}</div></div>)}</div>
        </div>
      </div>
    </header>

    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <section className="bg-white shadow-lg rounded-3xl -mt-14 relative z-10 p-6">
        <div className="flex items-center gap-2 mb-5"><CalendarDays className="text-cyan-700"/><h2 className="text-xl font-semibold">Check availability</h2></div>
        <div className="grid md:grid-cols-4 gap-4">
          <label className="text-sm font-medium">Check-in<input className="mt-2 w-full border rounded-xl p-3" type="date" value={checkIn} onChange={e=>{setCheckIn(e.target.value);setChecked(false)}}/></label>
          <label className="text-sm font-medium">Check-out<input className="mt-2 w-full border rounded-xl p-3" type="date" value={checkOut} onChange={e=>{setCheckOut(e.target.value);setChecked(false)}}/></label>
          <label className="text-sm font-medium">Guests<div className="mt-2 flex items-center border rounded-xl p-3 gap-2"><Users size={18}/><select className="w-full outline-none" value={guests} onChange={e=>setGuests(Number(e.target.value))}>{Array.from({length:30},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></div></label>
          <button onClick={()=>setChecked(true)} className="mt-7 h-12 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white flex items-center justify-center gap-2"><Search size={17}/>Check dates</button>
        </div>
        {checked&&<motion.div initial={{opacity:0}} animate={{opacity:1}} className={`mt-5 rounded-2xl p-4 ${unavailable?"bg-rose-50 text-rose-700":"bg-emerald-50 text-emerald-700"}`}><div className="font-semibold flex items-center gap-2"><CheckCircle2 size={19}/>{unavailable?"Those dates are not available. Try another range.":`Available for ${nights} night${nights===1?"":"s"} for ${guests} guest${guests===1?"":"s"}!`}</div></motion.div>}
      </section>

      <section className="bg-white shadow-md rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">Availability Calendar</h2><p className="text-sm text-slate-500 mt-1">Green dates are available. Red dates are booked.</p></div><button onClick={openOwnerSettings} className="flex items-center gap-2 border border-cyan-700 text-cyan-700 px-4 py-2 rounded-xl hover:bg-cyan-50"><Settings size={16}/>Manage booked dates</button></div>
        <div className="flex items-center justify-between mt-6"><button onClick={()=>changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft/></button><h3 className="font-bold text-lg">{calendarMonth.toLocaleString("en-US",{month:"long",year:"numeric"})}</h3><button onClick={()=>changeMonth(1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight/></button></div>
        {calendarLoading?<div className="py-12 text-center text-slate-500">Loading availability...</div>:<MonthGrid/>}
        <div className="flex gap-5 mt-5 text-sm"><span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-emerald-400"/>Available</span><span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-rose-400"/>Booked</span></div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-3xl p-7"><h2 className="text-2xl font-semibold text-rose-600">Accommodation Rates</h2><div className="mt-5 space-y-3">{rates.map(([type,room,rate])=><div key={type+room} className="flex justify-between gap-4 border-b pb-3"><div><b>{type}</b><div className="text-sm text-slate-500">{room}</div></div><div className="font-bold text-rose-600 text-right">{rate}</div></div>)}</div></div>
        <div className="bg-cyan-800 text-white shadow-md rounded-3xl p-7"><h2 className="text-2xl font-semibold">Property Details</h2><div className="mt-6 grid grid-cols-2 gap-4"><div><BedDouble/><b className="block mt-2">3 rooms</b></div><div><ShowerHead/><b className="block mt-2">4 bathrooms</b></div><div><Users/><b className="block mt-2">30-pax capacity</b></div><div><Utensils/><b className="block mt-2">2 kitchens</b></div><div><Zap/><b className="block mt-2">Generator</b></div><div><Droplets/><b className="block mt-2">Uninterrupted water supply</b></div></div><div className="mt-6 rounded-2xl bg-white/10 p-4"><b className="text-2xl">₱600 per head · 2D1N</b></div></div>
      </section>

      <section className="bg-white shadow-md rounded-3xl p-7"><h2 className="text-2xl font-semibold">Inclusions / Free Use</h2><div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">{amenities.map(([Icon,name])=><div key={name} className="rounded-2xl border p-4"><Icon className="text-cyan-700 mb-3"/><div className="font-medium text-sm">{name}</div></div>)}</div><div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900"><b>Food reminder:</b> Food is not included; guests should bring their own food.</div></section>
      <section className="bg-gradient-to-r from-cyan-700 to-blue-700 text-white rounded-3xl p-7"><h2 className="text-2xl font-semibold">Water Activities</h2><div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">{activities.map(([Icon,name])=><div key={name} className="bg-white/10 border border-white/15 rounded-2xl p-4"><Icon className="mb-3"/><b className="text-sm">{name}</b></div>)}</div></section>

      {loginOpen&&<div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7"><div className="flex justify-between items-start gap-4"><div><div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4"><LockKeyhole/></div><h2 className="text-2xl font-bold">Owner Login</h2><p className="text-sm text-slate-500 mt-1">Sign in to manage homestay availability.</p></div><button type="button" onClick={()=>{setLoginOpen(false);setLoginError("");setOwnerPassword("")}} className="p-2 rounded-lg hover:bg-slate-100"><X/></button></div>
        <form onSubmit={handleOwnerLogin} className="mt-6 space-y-4"><label className="block text-sm font-medium">Email<input type="email" required value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)} className="mt-2 w-full border rounded-xl p-3" placeholder="Owner email"/></label><label className="block text-sm font-medium">Password<div className="relative mt-2"><input type={showPassword?"text":"password"} required value={ownerPassword} onChange={e=>setOwnerPassword(e.target.value)} className="w-full border rounded-xl p-3 pr-12" placeholder="Password"/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500">{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>{loginError&&<div className="rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{loginError}</div>}<button type="submit" disabled={loginLoading} className="w-full bg-cyan-700 hover:bg-cyan-800 disabled:opacity-60 text-white rounded-xl p-3 font-semibold">{loginLoading?"Signing in...":"Sign in"}</button></form>
      </div></div>}

      {settingsOpen&&ownerUser&&<div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6"><div className="flex justify-between items-start"><div><h2 className="text-2xl font-bold">Owner Calendar Settings</h2><p className="text-sm text-slate-500 mt-1">Click Edit dates, then select dates to switch between booked and available.</p><p className="text-xs text-cyan-700 mt-2">Signed in as {ownerUser.email}</p></div><button onClick={closeSettings} className="p-2 rounded-lg hover:bg-slate-100"><X/></button></div>
        <div className="flex flex-wrap gap-3 mt-5"><button onClick={()=>setOwnerEdit(!ownerEdit)} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-white ${ownerEdit?"bg-amber-600":"bg-cyan-700"}`}><Settings size={16}/>{ownerEdit?"Editing dates":"Edit dates"}</button><button disabled={!ownerEdit} onClick={()=>setBooked(defaultBooked)} className="px-4 py-2 rounded-xl border flex items-center gap-2 disabled:opacity-40"><RotateCcw size={16}/>Restore sample dates</button><button onClick={saveBookedDates} className="px-4 py-2 rounded-xl bg-emerald-600 text-white flex items-center gap-2"><Save size={16}/>Save changes</button><button onClick={handleLogout} className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 flex items-center gap-2"><LogOut size={16}/>Logout</button></div>
        {saveStatus&&<p className="mt-4 text-sm text-slate-600">{saveStatus}</p>}
        <div className="flex items-center justify-between mt-6"><button onClick={()=>changeMonth(-1)} className="p-2"><ChevronLeft/></button><h3 className="font-bold">{calendarMonth.toLocaleString("en-US",{month:"long",year:"numeric"})}</h3><button onClick={()=>changeMonth(1)} className="p-2"><ChevronRight/></button></div><MonthGrid editable/><p className="mt-5 text-xs text-slate-500">Saved changes are stored in Cloud Firestore and shared with website visitors.</p>
      </div></div>}
    </main>
  </div>;
}
