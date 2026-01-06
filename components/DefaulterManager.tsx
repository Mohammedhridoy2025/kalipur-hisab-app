
import React, { useState, useMemo } from 'react';
import { Member, Subscription } from '../types';
import { AlertCircle, Calendar, Search, MapPin, Wallet, History, Home, ArrowRight, CheckCircle2, Info, Printer, ShieldCheck, Filter } from 'lucide-react';

interface DefaulterManagerProps {
  members: Member[];
  subscriptions: Subscription[];
  onAddSubscription: (memberId: string) => void;
}

// Updated Start Date: December 2025
const MIN_MONTH = "2025-12";
const FIXED_ADDRESS = "কালিপুর, হোমনা, কুমিল্লা";

const DefaulterManager: React.FC<DefaulterManagerProps> = ({ members, subscriptions, onAddSubscription }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const current = new Date().toISOString().slice(0, 7);
    return current < MIN_MONTH ? MIN_MONTH : current;
  });
  const [selectedHouse, setSelectedHouse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const availableHouses = useMemo(() => {
    const houses = new Set(members.filter(m => m.status === 'active').map(m => m.houseName));
    return Array.from(houses).sort();
  }, [members]);

  const allMonths = useMemo(() => {
    const months = [];
    const start = new Date(MIN_MONTH + "-01");
    const end = new Date();
    let current = new Date(start);
    while (current <= end) {
      months.push(current.toISOString().slice(0, 7));
      current.setMonth(current.getMonth() + 1);
    }
    return months.reverse(); 
  }, []);

  const getBengaliMonthName = (monthStr: string) => {
    const [year, monthPart] = monthStr.split('-');
    const months: Record<string, string> = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
      '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
      '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    return months[monthPart] ? `${months[monthPart]} ${year}` : monthStr;
  };

  const monthlyDefaulters = useMemo(() => {
    const paidMemberIds = new Set(subscriptions.filter(s => s.month === selectedMonth).map(s => s.memberId));
    return members.filter(m => {
      const isActive = m.status === 'active';
      const isDefaulter = !paidMemberIds.has(m.id);
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.houseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesHouse = selectedHouse === 'all' || m.houseName === selectedHouse;
      return isActive && isDefaulter && matchesSearch && matchesHouse;
    });
  }, [members, subscriptions, selectedMonth, searchTerm, selectedHouse]);

  const memberHistory = useMemo(() => {
    const historyMap: Record<string, string[]> = {};
    members.forEach(m => {
      if (m.status !== 'active') return;
      const paidMonths = new Set(subscriptions.filter(s => s.memberId === m.id).map(s => s.month));
      historyMap[m.id] = allMonths.filter(month => !paidMonths.has(month));
    });
    return historyMap;
  }, [members, subscriptions, allMonths]);

  return (
    <div className="space-y-8">
      {/* UI Controls */}
      <div className="no-print space-y-6">
        <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black tracking-tight">বকেয়া চাঁদার রিপোর্ট</h2>
              <p className="text-rose-100 font-bold mt-2">তহবিলের বকেয়া সদস্যদের রিয়েল-টাইম তালিকা।</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-10 py-5 rounded-3xl border border-white/20 text-center">
              <p className="text-5xl font-black">{monthlyDefaulters.length}</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">মোট বকেয়া সদস্য</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="সদস্য সার্চ করুন..." className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-3xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-rose-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="px-6 py-5 bg-white border border-gray-100 rounded-3xl font-black text-gray-800 shadow-sm outline-none cursor-pointer" value={selectedHouse} onChange={(e) => setSelectedHouse(e.target.value)}>
             <option value="all">সব বাড়ি</option>
             {availableHouses.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select className="px-6 py-5 bg-white border border-gray-100 rounded-3xl font-black text-gray-800 shadow-sm outline-none cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
             {allMonths.map(m => <option key={m} value={m}>{getBengaliMonthName(m)}</option>)}
          </select>
          <button onClick={() => window.print()} className="px-10 py-5 bg-gray-900 text-white rounded-3xl font-black flex items-center gap-2 hover:bg-gray-800 transition-all shadow-xl"><Printer size={20} /> প্রিন্ট</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {monthlyDefaulters.map(member => (
            <div key={member.id} className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm hover:border-rose-300 transition-all flex flex-col gap-5">
              <div className="flex gap-4">
                <img src={member.photoUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                <div>
                  <h4 className="text-xl font-black text-gray-900">{member.name}</h4>
                  <p className="text-xs font-bold text-gray-500">{member.houseName} • {member.country}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t pt-4">
                {memberHistory[member.id]?.slice(0, 5).map(m => <span key={m} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black border border-rose-100">{getBengaliMonthName(m)}</span>)}
                {memberHistory[member.id]?.length > 5 && <span className="text-[10px] font-bold text-gray-400">...আরও {memberHistory[member.id].length - 5} মাস</span>}
              </div>
              <button onClick={() => onAddSubscription(member.id)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">চাঁদা জমা নিন</button>
            </div>
          ))}
        </div>
      </div>

      {/* --- PRINT ONLY ENGINE --- */}
      <div className="print-only">
        <div className="text-center border-b-4 border-black pb-6 mb-8">
          <ShieldCheck size={48} className="mx-auto mb-2" />
          <h1 className="text-4xl font-black uppercase">কালিপুর পাহারাদার কল্যাণ তহবিল</h1>
          <p className="text-lg font-bold tracking-widest">{FIXED_ADDRESS}</p>
          <div className="inline-block mt-4 px-10 py-2 border-2 border-black bg-gray-50 rounded-full font-black text-xl uppercase">বকেয়া চাঁদার রিপোর্ট</div>
          <p className="text-lg font-black mt-4">মাস: {getBengaliMonthName(selectedMonth)}</p>
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="w-16">নং</th>
              <th>সদস্যের নাম ও ঠিকানা</th>
              <th>বাড়ির নাম</th>
              <th className="text-center">বকেয়া মাস</th>
            </tr>
          </thead>
          <tbody>
            {monthlyDefaulters.map((member, idx) => (
              <tr key={member.id}>
                <td className="text-center font-bold">{idx + 1}</td>
                <td>
                  <div className="font-black text-base">{member.name}</div>
                  <div className="text-[9pt] font-bold text-gray-500 uppercase">{member.country}</div>
                </td>
                <td className="font-bold">{member.houseName}</td>
                <td className="text-center font-black">
                   মোট {memberHistory[member.id]?.length || 0} মাস বকেয়া
                </td>
              </tr>
            ))}
            {monthlyDefaulters.length === 0 && (
              <tr><td colSpan={4} className="py-20 text-center font-bold text-gray-400 italic">এই মাসে কোনো সদস্যের চাঁদা বকেয়া নেই।</td></tr>
            )}
          </tbody>
        </table>

        <div className="mt-32 flex justify-between px-16 break-inside-avoid">
          <div className="text-center">
            <div className="w-48 border-t-2 border-black mb-2"></div>
            <p className="text-sm font-black text-black uppercase tracking-widest">কোষাধ্যক্ষ</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t-2 border-black mb-2"></div>
            <p className="text-sm font-black text-black uppercase tracking-widest">সভাপতি / সেক্রেটারি</p>
          </div>
        </div>

        <div className="fixed bottom-6 left-0 right-0 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-4">
          রিপোর্ট জেনারেটেড বাই: কালিপুর পাহারাদার ম্যানেজমেন্ট সিস্টেম — তারিখ: {new Date().toLocaleDateString('bn-BD')}
        </div>
      </div>
    </div>
  );
};

export default DefaulterManager;
