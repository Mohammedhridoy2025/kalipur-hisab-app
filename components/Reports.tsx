import React, { useState, useMemo } from 'react';
import { Member, Subscription, Expense } from '../types';
import { Wallet, TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight, ListChecks, ShoppingBag, ShieldCheck, Printer, CheckCircle2, AlertCircle, Home, Users, PieChart, Activity, MapPin, LayoutDashboard, FileText, ArrowRight } from 'lucide-react';

interface ReportsProps {
  members: Member[];
  subscriptions: Subscription[];
  expenses: Expense[];
}

// Updated Start Date: December 2025
const MIN_MONTH = "2025-12";
const FIXED_ADDRESS = "কালিপুর, হোমনা, কুমিল্লা";
const DEFAULT_PHOTO = "https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-user-profile-avatar-png-image_10211467.png";

type PrintMode = 'collections' | 'expenses' | 'memberSummary' | 'members' | 'full' | 'none';

const Reports: React.FC<ReportsProps> = ({ members, subscriptions, expenses }) => {
  // Generate all months from December 2025 to the current month
  const availableMonths = useMemo(() => {
    const months = [];
    const start = new Date(MIN_MONTH + "-01");
    const end = new Date(); // Current date
    let current = new Date(start);
    
    while (current <= end) {
      months.push(current.toISOString().slice(0, 7));
      current.setMonth(current.getMonth() + 1);
    }
    return months.reverse(); // Newest first
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date().toISOString().slice(0, 7);
    return now < MIN_MONTH ? MIN_MONTH : now;
  });
  
  const [printMode, setPrintMode] = useState<PrintMode>('none');

  const getBengaliMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months: Record<string, string> = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
      '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
      '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    return months[month] ? `${months[month]} ${year}` : monthStr;
  };

  const filteredSubs = useMemo(() => subscriptions.filter(s => s.memberId && s.month === selectedMonth), [subscriptions, selectedMonth]);
  const filteredExps = useMemo(() => expenses.filter(e => e.date.startsWith(selectedMonth)), [expenses, selectedMonth]);
  const activeMembers = useMemo(() => members.filter(m => m.status === 'active'), [members]);
  
  const monthTotalIn = filteredSubs.reduce((sum, s) => sum + s.amount, 0);
  const monthTotalOut = filteredExps.reduce((sum, e) => sum + e.amount, 0);
  const monthBalance = monthTotalIn - monthTotalOut;

  const paidMembersCount = useMemo(() => {
    const paidIds = new Set(filteredSubs.map(s => s.memberId));
    return activeMembers.filter(m => paidIds.has(m.id)).length;
  }, [activeMembers, filteredSubs]);

  const memberSummary = useMemo(() => {
    return activeMembers.map(member => {
      const total = subscriptions
        .filter(s => s.memberId === member.id)
        .reduce((sum, s) => sum + s.amount, 0);
      return { ...member, totalContribution: total };
    }).sort((a, b) => b.totalContribution - a.totalContribution); 
  }, [activeMembers, subscriptions]);

  const handlePrint = (mode: PrintMode) => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode('none'), 1000);
    }, 200);
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'অজানা সদস্য';
  const getMemberHouse = (id: string) => members.find(m => m.id === id)?.houseName || '';
  const getMemberPhoto = (id: string) => members.find(m => m.id === id)?.photoUrl || DEFAULT_PHOTO;

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* --- RE-DESIGNED PREMIUM DASHBOARD HEADER --- */}
      <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10 no-print overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full -translate-y-40 translate-x-40 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-[2rem] shadow-2xl shadow-emerald-200/50">
              <PieChart size={36} />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">অডিট ও রিপোর্ট</h2>
              <p className="text-xs md:text-base font-bold text-slate-400 mt-2 flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" /> তহবিলের যাবতীয় স্বচ্ছ হিসাবপত্র
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <div className="flex flex-col gap-2 w-full lg:w-80">
               {/* Label Header */}
               <div className="flex items-center gap-2 ml-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">রিপোর্টের মাস নির্বাচন</span>
               </div>
               {/* Modern Selector Box */}
               <div className="relative group/select">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 z-10">
                     <Calendar size={20} />
                  </div>
                  <select 
                    className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] appearance-none font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 outline-none transition-all cursor-pointer shadow-inner text-base md:text-lg"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{getBengaliMonthName(m)}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm group-focus-within/select:rotate-180 transition-transform duration-300">
                    <ChevronDown size={24} />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
          {[
            { label: 'মাসের আদায়', val: monthTotalIn, icon: <TrendingUp size={20}/>, col: 'emerald' },
            { label: 'মাসের খরচ', val: monthTotalOut, icon: <TrendingDown size={20}/>, col: 'rose' },
            { label: 'মাসের উদ্বৃত্ত', val: monthBalance, icon: <Wallet size={20}/>, col: 'amber' },
            { label: 'পরিশোধের হার', val: `${paidMembersCount} / ${activeMembers.length}`, icon: <Users size={20}/>, col: 'blue', isCurrency: false }
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-300 group/card relative overflow-hidden">
              <div className={`w-11 h-11 md:w-14 md:h-14 rounded-[1.6rem] flex items-center justify-center mb-5 transition-all duration-300 ${
                card.col === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover/card:bg-emerald-600 group-hover/card:text-white' :
                card.col === 'rose' ? 'bg-rose-50 text-rose-600 group-hover/card:bg-rose-600 group-hover/card:text-white' :
                card.col === 'amber' ? 'bg-amber-50 text-amber-600 group-hover/card:bg-amber-600 group-hover/card:text-white' : 
                'bg-blue-50 text-blue-600 group-hover/card:bg-blue-600 group-hover/card:text-white'
              }`}>
                {card.icon}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{card.label}</p>
              <p className={`text-base md:text-2xl font-black truncate tracking-tighter ${
                card.col === 'emerald' ? 'text-emerald-700' :
                card.col === 'rose' ? 'text-rose-700' :
                card.col === 'amber' ? 'text-amber-700' : 'text-blue-700'
              }`}>
                {card.isCurrency === false ? card.val : `৳${card.val.toLocaleString()}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* --- REPORT ACTION TILES --- */}
      <div className="no-print space-y-8">
        <div className="flex items-center gap-4 px-4">
            <div className="w-2.5 h-8 bg-slate-900 rounded-full"></div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">রিপোর্ট জেনারেশন প্যানেল</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Summary Action */}
          <button 
            onClick={() => handlePrint('full')} 
            className="md:col-span-2 group relative overflow-hidden bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl hover:bg-black active:scale-[0.98] transition-all flex flex-col sm:flex-row items-center gap-10 text-center sm:text-left text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full translate-x-20 -translate-y-20 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="p-8 bg-white/10 rounded-[2.5rem] group-hover:bg-emerald-500 transition-all duration-300 shadow-xl relative z-10 border border-white/5">
              <LayoutDashboard size={40} className="text-emerald-400 group-hover:text-white" />
            </div>
            <div className="relative z-10 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-3">Professional Monthly Audit</p>
              <h4 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">পূর্ণাঙ্গ মাসিক অডিট রিপোর্ট</h4>
              <p className="text-sm md:text-base opacity-60 font-medium italic">পিডিএফ হিসেবে ডাউনলোড অথবা সরাসরি প্রিন্ট করুন</p>
            </div>
            <div className="relative z-10 hidden sm:flex items-center justify-center w-14 h-14 bg-white/5 rounded-full border border-white/10 group-hover:bg-emerald-500 group-hover:translate-x-2 transition-all">
                <ArrowRight size={28} className="text-white" />
            </div>
          </button>

          {/* Secondary Report Tiles */}
          {[
            { id: 'members', label: 'সদস্য তালিকা', icon: <Users size={24}/>, col: 'cyan', sub: 'সদস্য পরিচিতি' },
            { id: 'collections', label: 'আদায়ের রিপোর্ট', icon: <Wallet size={24}/>, col: 'emerald', sub: 'চাঁদা আদায়' },
            { id: 'expenses', label: 'ব্যয়ের রিপোর্ট', icon: <ShoppingBag size={24}/>, col: 'rose', sub: 'বাজার খরচ' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => handlePrint(item.id as PrintMode)} 
              className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex flex-row sm:flex-col items-center sm:text-center gap-6 group/btn overflow-hidden"
            >
              <div className={`p-6 rounded-[2rem] transition-all group-hover/btn:scale-110 shadow-lg ${
                item.col === 'cyan' ? 'bg-cyan-50 text-cyan-600' :
                item.col === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {item.icon}
              </div>
              <div className="flex-1 text-left sm:text-center">
                <p className="font-black text-slate-800 text-lg md:text-xl leading-tight">{item.label}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* --- LIVE STATUS SECTION --- */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm no-print overflow-hidden relative">
        <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-[2.2rem] flex items-center justify-center shadow-2xl shadow-slate-200">
                    <ListChecks size={32} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight leading-none">লাইভ স্ট্যাটাস টেবিল</h4>
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-3">{getBengaliMonthName(selectedMonth)}</p>
                 </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                 <div className="flex-1 md:flex-none px-8 py-5 bg-emerald-50 text-emerald-700 rounded-3xl text-[12px] font-black border border-emerald-100 flex items-center gap-3 justify-center shadow-sm">
                    <CheckCircle2 size={20} />
                    {paidMembersCount} পেইড
                 </div>
                 <div className="flex-1 md:flex-none px-8 py-5 bg-rose-50 text-rose-700 rounded-3xl text-[12px] font-black border border-rose-100 flex items-center gap-3 justify-center shadow-sm">
                    <AlertCircle size={20} />
                    {activeMembers.length - paidMembersCount} বকেয়া
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[3rem] border border-slate-100 bg-slate-50/20 -mx-4 md:mx-0">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="bg-slate-100/50 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    <th className="px-10 py-7 text-left">সদস্যের নাম</th>
                    <th className="px-10 py-7 text-left">দেশ</th>
                    <th className="px-10 py-7 text-center">স্ট্যাটাস</th>
                    <th className="px-10 py-7 text-right">আদায়ের পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeMembers.map(member => {
                    const subscription = filteredSubs.find(s => s.memberId === member.id);
                    const isPaid = !!subscription;
                    return (
                      <tr key={member.id} className="hover:bg-white transition-all duration-300 group">
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                            <img src={member.photoUrl || DEFAULT_PHOTO} className="w-12 h-12 rounded-[1.2rem] object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors text-base">{member.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 flex items-center gap-2">
                                <Home size={12} className="text-emerald-500" /> {member.houseName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                           <div className="flex items-center gap-2.5 text-[12px] font-black text-slate-500">
                              <MapPin size={16} className="text-rose-400" />
                              {member.country}
                           </div>
                        </td>
                        <td className="px-10 py-7 text-center">
                          <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            isPaid ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {isPaid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {isPaid ? 'পরিশোধিত' : 'বকেয়া'}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                           <div className={`font-black text-lg tracking-tighter ${isPaid ? 'text-emerald-700' : 'text-slate-300'}`}>
                              {isPaid ? `৳ ${subscription.amount.toLocaleString()}` : '---'}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>
      </div>

      {/* --- PRINTABLE ENGINE --- */}
      <div className="print-only">
        <div className="text-center border-b-[6px] border-black pb-8 mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <ShieldCheck size={64} className="text-black" />
            <h1 className="text-5xl font-black text-black tracking-tighter uppercase leading-tight">কালিপুর পাহারাদার<br/>কল্যাণ তহবিল</h1>
          </div>
          <p className="text-xl font-bold text-black uppercase tracking-[0.3em]">{FIXED_ADDRESS}</p>
          <div className="inline-block mt-6 px-16 py-3 border-4 border-black bg-gray-50 rounded-full font-black text-2xl uppercase tracking-widest">
             {printMode === 'expenses' ? 'মাসিক ব্যয় বিবরণী' : 
              printMode === 'members' ? 'গ্রামের প্রবাসী সদস্য তালিকা' :
              printMode === 'full' ? 'মাসিক অডিট সামারি রিপোর্ট' :
              'মাসিক চাঁদা আদায় রিপোর্ট'}
          </div>
          <p className="text-xl font-bold text-black mt-6">রিপোর্ট মাস: {getBengaliMonthName(selectedMonth)}</p>
        </div>

        {printMode === 'full' && (
          <div className="space-y-12">
            <div className="grid grid-cols-3 gap-0 border-[4px] border-black">
              <div className="border-r-[4px] border-black p-8 text-center bg-gray-50">
                <p className="text-sm font-black uppercase mb-2">মোট আদায়</p>
                <p className="text-4xl font-black">৳{monthTotalIn.toLocaleString()}</p>
              </div>
              <div className="border-r-[4px] border-black p-8 text-center bg-gray-50">
                <p className="text-sm font-black uppercase mb-2">মোট ব্যয়</p>
                <p className="text-4xl font-black">৳{monthTotalOut.toLocaleString()}</p>
              </div>
              <div className="p-8 text-center bg-gray-100">
                <p className="text-sm font-black uppercase mb-2">নেট ব্যালেন্স</p>
                <p className="text-4xl font-black">৳{monthBalance.toLocaleString()}</p>
              </div>
            </div>

            <section>
              <h3 className="text-2xl font-black text-black mb-6 border-b-4 border-black pb-3 uppercase tracking-widest flex justify-between items-center">
                <span>১. আদায় তালিকা (চাঁদা)</span>
                <span className="text-sm font-bold">মোট: {filteredSubs.length} জন</span>
              </h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-16 text-center">নং</th>
                    <th>সদস্যের নাম</th>
                    <th>বাড়ির নাম</th>
                    <th className="text-right">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((sub, idx) => (
                    <tr key={sub.id}>
                      <td className="text-center font-bold">{idx + 1}</td>
                      <td className="font-black text-lg">{getMemberName(sub.memberId)}</td>
                      <td className="font-bold">{getMemberHouse(sub.memberId)}</td>
                      <td className="text-right font-black text-lg">৳{sub.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-black">
                    <td colSpan={3} className="text-right p-6 text-xl">সর্বমোট আদায় (চলতি মাস):</td>
                    <td className="text-right p-6 text-2xl">৳{monthTotalIn.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="break-before-page">
              <h3 className="text-2xl font-black text-black mb-6 border-b-4 border-black pb-3 uppercase tracking-widest flex justify-between items-center">
                <span>২. ব্যয়ের তালিকা (বাজার ও অন্যান্য)</span>
                <span className="text-sm font-bold">মোট খরচ: {filteredExps.length} টি</span>
              </h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-16 text-center">নং</th>
                    <th>বিবরণ</th>
                    <th>তারিখ</th>
                    <th className="text-right">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExps.map((exp, idx) => (
                    <tr key={exp.id}>
                      <td className="text-center font-bold">{idx + 1}</td>
                      <td>
                        <span className="font-black block text-lg">{exp.description}</span>
                        <span className="text-sm block opacity-70 italic font-bold">আইটেম: {exp.items.map(i => i.name).join(', ')}</span>
                      </td>
                      <td className="font-bold">{exp.date}</td>
                      <td className="text-right font-black text-lg">৳{exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-black">
                    <td colSpan={3} className="text-right p-6 text-xl">সর্বমোট ব্যয় (চলতি মাস):</td>
                    <td className="text-right p-6 text-2xl">৳{monthTotalOut.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        )}

        {(printMode === 'collections' || printMode === 'expenses' || printMode === 'members') && (
           <table className="w-full">
             <thead>
               <tr>
                 <th className="text-center w-16">নং</th>
                 {printMode === 'members' && <th className="text-center w-20">ছবি</th>}
                 <th>{printMode === 'members' ? 'সদস্যের নাম ও বাড়ি' : (printMode === 'collections' ? 'সদস্যের নাম' : 'বিবরণ')}</th>
                 {printMode === 'members' && <th>বসবাসরত দেশ</th>}
                 <th className="text-right">{printMode === 'members' ? 'মোট অনুদান' : 'পরিমাণ'}</th>
               </tr>
             </thead>
             <tbody>
               {(printMode === 'members' ? memberSummary : (printMode === 'collections' ? filteredSubs : filteredExps)).map((item: any, idx) => (
                 <tr key={item.id}>
                   <td className="text-center font-bold">{idx + 1}</td>
                   {printMode === 'members' && (
                     <td className="text-center p-2">
                       <img src={item.photoUrl || DEFAULT_PHOTO} className="w-12 h-12 object-cover rounded-lg border border-gray-300 mx-auto" alt="profile" />
                     </td>
                   )}
                   <td>
                      <div className="font-black text-lg">
                        {printMode === 'members' ? item.name : (printMode === 'collections' ? getMemberName(item.memberId) : item.description)}
                      </div>
                      {(printMode === 'members' || printMode === 'collections') && <div className="text-sm font-bold text-gray-500 italic">বাড়ি: {printMode === 'members' ? item.houseName : getMemberHouse(item.memberId)}</div>}
                   </td>
                   {printMode === 'members' && <td className="font-bold text-lg">{item.country}</td>}
                   <td className="text-right font-black text-lg">
                     ৳{(printMode === 'members' ? item.totalContribution : item.amount).toLocaleString()}
                   </td>
                 </tr>
               ))}
               <tr className="bg-gray-200 font-black">
                  <td colSpan={printMode === 'members' ? 4 : 2} className="text-right p-6 text-xl uppercase">সর্বমোট জমা/ব্যয়:</td>
                  <td className="text-right p-6 text-2xl">
                    ৳{(printMode === 'members' ? memberSummary.reduce((s,m) => s+m.totalContribution, 0) : (printMode === 'collections' ? monthTotalIn : monthTotalOut)).toLocaleString()}
                  </td>
               </tr>
             </tbody>
           </table>
        )}

        <div className="mt-40 flex justify-between px-20 break-inside-avoid">
          <div className="text-center space-y-3">
            <div className="w-56 border-t-4 border-black"></div>
            <p className="text-lg font-black text-black uppercase tracking-widest">কোষাধ্যক্ষ</p>
            <p className="text-xs font-bold">(সিগনেচার ও সিল)</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-56 border-t-4 border-black"></div>
            <p className="text-lg font-black text-black uppercase tracking-widest">সভাপতি / সেক্রেটারি</p>
            <p className="text-xs font-bold">(সিগনেচার ও সিল)</p>
          </div>
        </div>

        <div className="fixed bottom-10 left-0 right-0 text-center text-xs font-black text-gray-400 uppercase tracking-[0.5em] border-t border-gray-100 pt-8">
          Kalipur Village Watchman Welfare Fund • Automated Audit Report • {new Date().toLocaleDateString('bn-BD')}
        </div>
      </div>
    </div>
  );
};

export default Reports;