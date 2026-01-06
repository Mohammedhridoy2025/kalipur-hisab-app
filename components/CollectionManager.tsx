
import React, { useState, useMemo, useEffect } from 'react';
import { Member, Subscription, AppNotification } from '../types';
import { 
  Printer, Banknote, Search, ChevronDown, Loader2, Calendar, CheckCircle2, 
  ShieldCheck, Quote, ShoppingCart, Send, Download, X, UserRound, Filter, 
  ListFilter, ArrowUpRight, ArrowRight, UserCheck, MapPin, Hash, Sparkles, 
  Wallet, Home, History, LayoutDashboard, Receipt 
} from 'lucide-react';
import { getMotivationalQuote } from '../services/geminiService';
import { db } from '../services/firebase';
import html2canvas from 'html2canvas';

interface CollectionManagerProps {
  members: Member[];
  subscriptions: Subscription[];
  setSubscriptions: (s: Subscription[]) => void;
  initialMemberId?: string;
  onClearPreSelection?: () => void;
  isAdmin: boolean;
  addNotification?: (type: AppNotification['type'], title: string, message: string) => void;
}

const MIN_MONTH = "2025-12";
const FIXED_ADDRESS = "কালিপুর, হোমনা, কুমিল্লা";

const COLLECTORS = [
  "কাউছার", "সাব্বির", "সাঈদ", "ইমন", "সাইফুদ্দিন"
];

const CollectionManager: React.FC<CollectionManagerProps> = ({ members, subscriptions, initialMemberId, onClearPreSelection, isAdmin, addNotification }) => {
  const [selectedMember, setSelectedMember] = useState(initialMemberId || '');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [amount, setAmount] = useState(0); 
  const [receivedBy, setReceivedBy] = useState(COLLECTORS[0]);
  const [entryMonth, setEntryMonth] = useState(() => {
    const now = new Date().toISOString().slice(0, 7);
    return now < MIN_MONTH ? MIN_MONTH : now;
  });
  
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Subscription | null>(null);
  const [receiptQuote, setReceiptQuote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrintingList, setIsPrintingList] = useState(false);

  useEffect(() => {
    if (initialMemberId) {
      const member = members.find(m => m.id === initialMemberId);
      if (member) {
        setSelectedMember(member.id);
        setMemberSearchTerm(member.name);
      }
    }
  }, [initialMemberId, members]);

  const availableMonths = useMemo(() => {
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

  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter(s => filterMonth === 'all' || s.month === filterMonth)
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [subscriptions, filterMonth]);

  const totalFilteredAmount = useMemo(() => {
    return filteredSubscriptions.reduce((sum, s) => sum + s.amount, 0);
  }, [filteredSubscriptions]);

  const memberOptions = useMemo(() => {
    const searchLower = memberSearchTerm.toLowerCase();
    return members.filter(m => 
      m.name.toLowerCase().includes(searchLower) || 
      m.houseName.toLowerCase().includes(searchLower)
    ).slice(0, 8);
  }, [members, memberSearchTerm]);

  const getMemberData = (id: string) => members.find(m => m.id === id);
  
  const getBengaliMonthName = (monthStr: string) => {
    if (monthStr === 'all') return 'সকল মাস';
    const months: Record<string, string> = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল', '05': 'মে', '06': 'জুন',
      '07': 'জুলাই', '08': 'আগস্ট', '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    const [year, m] = monthStr.split('-');
    const enToBn = (s: string | number) => s.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
    return `${months[m]} ${enToBn(year)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isSaving) return;
    if (!selectedMember || amount <= 0) {
      alert("অনুগ্রহ করে সদস্য এবং সঠিক পরিমাণ সিলেক্ট করুন।");
      return;
    }

    setIsSaving(true);
    const customDocId = `${selectedMember}_${entryMonth}`;
    try {
      const subData = { 
        memberId: selectedMember, 
        amount, 
        month: entryMonth, 
        date: new Date().toLocaleDateString('bn-BD'), 
        receivedBy: receivedBy, 
        receiptNo: `RCP-${entryMonth.replace('-', '')}-${selectedMember.slice(-4).toUpperCase()}` 
      };

      await db.collection("subscriptions").doc(customDocId).set(subData, { merge: true });
      const savedSub = { id: customDocId, ...subData } as Subscription;
      
      setLastReceipt(savedSub);
      setReceiptQuote(await getMotivationalQuote(getMemberData(selectedMember)?.name || ''));
      setIsReceiptOpen(true);
      
      setSelectedMember('');
      setMemberSearchTerm('');
      setAmount(0);
      onClearPreSelection?.();
      addNotification?.('success', 'সফল', 'চাঁদা সফলভাবে জমা করা হয়েছে।');
    } catch (err) { alert("জমা করতে সমস্যা হয়েছে।"); }
    finally { setIsSaving(false); }
  };

  const handlePrintList = () => {
    setIsPrintingList(true);
    setTimeout(() => {
      window.print();
      setIsPrintingList(false);
    }, 500);
  };

  // Fix: Added the missing downloadReceiptImage function
  const downloadReceiptImage = async () => {
    const element = document.getElementById('receipt-card-main');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.download = `receipt-${lastReceipt?.receiptNo || 'download'}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Error generating receipt image:", err);
      alert("ছবি সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* --- PREMIUM ENTRY FORM (ADMIN ONLY) --- */}
      {isAdmin && (
        <div className="bg-white rounded-[3.5rem] p-8 md:p-14 border border-slate-100 shadow-2xl shadow-emerald-900/5 no-print max-w-5xl mx-auto relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -translate-y-48 translate-x-48 blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Panel</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <Banknote size={36} className="text-emerald-600" /> চাঁদা কালেকশন ফরম
                </h2>
                <p className="text-sm font-bold text-slate-400 mt-2">তহবিলের স্বচ্ছতা বজায় রাখতে সঠিক তথ্য এন্ট্রি করুন।</p>
              </div>
              <div className="px-6 py-4 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100 flex items-center gap-3">
                <Sparkles size={20} className="text-emerald-500 animate-bounce" />
                <span className="text-xs font-black uppercase tracking-widest">স্মার্ট ম্যানেজমেন্ট</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Search Member */}
                <div className="space-y-2 relative">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-5 flex items-center gap-2">
                    <UserRound size={14} className="text-emerald-500" /> সদস্য নির্বাচন
                  </label>
                  <div className="relative group/search">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-emerald-500 transition-colors" size={22} />
                    <input 
                      type="text" 
                      placeholder="নাম অথবা বাড়ির নাম..." 
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2.2rem] font-black text-lg outline-none focus:ring-8 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500 transition-all shadow-inner" 
                      value={memberSearchTerm} 
                      onChange={e => { setMemberSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                  </div>
                  
                  {isDropdownOpen && memberSearchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] z-50 overflow-hidden animate-in slide-in-from-top-4">
                      {memberOptions.length > 0 ? memberOptions.map(m => (
                        <button key={m.id} type="button" className="w-full text-left p-5 hover:bg-emerald-50 border-b border-slate-50 last:border-0 flex items-center gap-5 group/opt" onClick={() => { setSelectedMember(m.id); setMemberSearchTerm(m.name); setIsDropdownOpen(false); }}>
                          <img src={m.photoUrl} className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover/opt:scale-105 transition-transform" />
                          <div>
                            <div className="font-black text-slate-800 text-base group-hover/opt:text-emerald-700">{m.name}</div>
                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{m.houseName}</div>
                          </div>
                          <ArrowRight size={20} className="ml-auto text-slate-200 group-hover/opt:text-emerald-500 group-hover/opt:translate-x-2 transition-all" />
                        </button>
                      )) : (
                        <div className="p-8 text-center text-slate-400 font-bold italic text-sm">সদস্য খুঁজে পাওয়া যায়নি</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-5 flex items-center gap-2">
                    <Wallet size={14} className="text-emerald-500" /> চাঁদার পরিমাণ (টাকা)
                  </label>
                  <div className="relative">
                     <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-emerald-600">৳</span>
                     <input 
                       type="number" 
                       placeholder="০" 
                       className="w-full pl-16 pr-8 py-5 bg-emerald-50/50 border border-emerald-100 rounded-[2.2rem] font-black text-3xl text-emerald-700 outline-none focus:ring-8 focus:ring-emerald-500/5 focus:bg-white text-center shadow-inner tracking-tighter" 
                       value={amount || ''} 
                       onChange={e => setAmount(Number(e.target.value))} 
                       required
                     />
                  </div>
                </div>

                {/* Entry Month */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-5 flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-500" /> পরিশোধের মাস
                  </label>
                  <div className="relative group/select">
                    <Calendar className="absolute left-7 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" size={22} />
                    <input 
                      type="month" 
                      min={MIN_MONTH} 
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2.2rem] font-black text-base text-slate-800 outline-none focus:bg-white appearance-none cursor-pointer" 
                      value={entryMonth} 
                      onChange={e => setEntryMonth(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Collector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-5 flex items-center gap-2">
                    <History size={14} className="text-emerald-500" /> টাকা আদায়কারী
                  </label>
                  <div className="relative group/select">
                    <UserRound className="absolute left-7 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" size={22} />
                    <select 
                      className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-[2.2rem] font-black text-base text-slate-800 outline-none appearance-none cursor-pointer focus:bg-white"
                      value={receivedBy}
                      onChange={e => setReceivedBy(e.target.value)}
                    >
                      {COLLECTORS.map(collector => <option key={collector} value={collector}>{collector}</option>)}
                    </select>
                    <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within/select:rotate-180 transition-transform" size={22} />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving || !selectedMember || amount <= 0} 
                className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group/btn disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck size={28} className="group-hover/btn:scale-110 transition-transform" />}
                চাঁদা জমা নিশ্চিত করুন
              </button>
            </form>
        </div>
      )}

      {/* --- COLLECTION LIST HEADER & FILTERS --- */}
      <div className="space-y-10 no-print">
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
            <div>
               <div className="flex items-center gap-3 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Payment Archive</span>
               </div>
               <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                  <History className="text-emerald-600" size={36} /> আদায়ের বিস্তারিত তালিকা
               </h2>
               <p className="text-sm font-bold text-slate-400 mt-2">তহবিলে জমাকৃত সকল চাঁদার তথ্য ফিল্টার করে দেখুন।</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-5 w-full xl:w-auto">
               <div className="relative group/filter w-full sm:w-72">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 z-10">
                    <ListFilter size={20} />
                  </div>
                  <select 
                    className="w-full pl-16 pr-14 py-5 bg-white border border-slate-100 rounded-[2rem] font-black text-sm text-slate-800 outline-none shadow-xl shadow-slate-200/50 appearance-none cursor-pointer focus:ring-8 focus:ring-emerald-500/5 transition-all"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="all">সকল মাসের তালিকা</option>
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{getBengaliMonthName(m)}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within/filter:rotate-180 transition-transform">
                    <ChevronDown size={22} />
                  </div>
               </div>

               <button 
                onClick={handlePrintList}
                className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-2xl hover:bg-emerald-600 transition-all active:scale-95"
               >
                  <Printer size={20} /> রিপোর্ট প্রিন্ট
               </button>
            </div>
         </div>

         {/* Summary Dashboard for Collections */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-emerald-900/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10">
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-80 mb-3">মোট সংগৃহীত টাকা</p>
                 <h4 className="text-5xl font-black tracking-tighter">৳ {totalFilteredAmount.toLocaleString()}</h4>
                 <div className="flex items-center gap-2 mt-5 bg-white/10 w-fit px-5 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
                   <Calendar size={16} />
                   <span className="text-xs font-black uppercase tracking-widest">{getBengaliMonthName(filterMonth)}</span>
                 </div>
               </div>
            </div>
            <div className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm flex flex-col justify-center group hover:border-emerald-100 transition-colors">
               <div className="flex items-center gap-4 mb-3">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <History size={24} />
                 </div>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">মোট ট্রানজেকশন</p>
               </div>
               <h4 className="text-4xl font-black text-slate-900">{filteredSubscriptions.length} টি</h4>
               <p className="text-xs font-bold text-slate-400 mt-2 italic">সফলভাবে প্রসেস করা হয়েছে</p>
            </div>
         </div>

         {/* Collection Cards Feed */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSubscriptions.map((sub, index) => {
              const member = getMemberData(sub.memberId);
              return (
                <div 
                  key={sub.id} 
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:border-emerald-100 transition-all duration-300 group animate-in slide-in-from-bottom-6 fade-in relative cursor-pointer"
                  onClick={() => { setLastReceipt(sub); setIsReceiptOpen(true); }}
                >
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative shrink-0">
                      <img src={member?.photoUrl || "https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-user-profile-avatar-png-image_10211467.png"} className="w-20 h-20 rounded-[1.8rem] object-cover shadow-xl group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white">
                        <UserCheck size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg group-hover:text-emerald-700 transition-colors leading-tight">{member?.name || 'অজানা সদস্য'}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase mt-2">
                        <Home size={12} className="text-emerald-500" /> {member?.houseName || '---'}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                     <div className="space-y-3">
                        <div className="px-4 py-2 bg-white text-emerald-700 rounded-xl text-[10px] font-black w-fit uppercase tracking-[0.2em] shadow-sm border border-emerald-50">
                          {getBengaliMonthName(sub.month)}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <UserRound size={12} className="text-emerald-500" /> {sub.receivedBy}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">পরিমাণ</p>
                        <p className="text-3xl font-black text-emerald-600 tracking-tighter">৳{sub.amount.toLocaleString()}</p>
                     </div>
                  </div>

                  <div className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-300 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg active:scale-90">
                    <Receipt size={22} />
                  </div>
                </div>
              );
            })}

            {filteredSubscriptions.length === 0 && (
              <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
                 <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                    <History size={40} className="text-slate-200" />
                 </div>
                 <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-sm">কোনো চাঁদার রেকর্ড পাওয়া যায়নি</p>
                 <p className="text-slate-300 font-bold text-xs mt-4 uppercase tracking-widest italic">অন্য কোনো ফিল্টার ট্রাই করুন</p>
              </div>
            )}
         </div>
      </div>

      {/* --- ENHANCED ACCESSIBLE RECEIPT MODAL --- */}
      {isReceiptOpen && lastReceipt && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-start z-[500] no-print overflow-y-auto pt-8 pb-24 px-4">
          <div className="w-full max-w-sm sticky top-0 flex justify-between items-center z-[510] mb-8 px-4">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-full font-black text-[11px] shadow-2xl flex items-center gap-3 uppercase tracking-widest">
               <ShieldCheck size={18} /> ডিজিটাল রিসিট ভিউ
            </div>
            <button onClick={() => setIsReceiptOpen(false)} className="w-14 h-14 bg-white text-slate-900 rounded-[1.4rem] flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:bg-rose-500 hover:text-white">
              <X size={28} />
            </button>
          </div>

          <div className="w-full max-w-sm space-y-8 animate-in zoom-in slide-in-from-bottom-12 duration-500">
            <div id="receipt-card-main" className="bg-white rounded-[3.5rem] p-10 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -mr-20 -mt-20 opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50 rounded-full -ml-24 -mb-24 opacity-40"></div>

                <div className="relative z-10 space-y-8">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200/50 border-4 border-white">
                        <ShieldCheck size={44} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-emerald-950 leading-tight uppercase tracking-tight">কালিপুর পাহারাদার কল্যাণ তহবিল</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">{FIXED_ADDRESS}</p>
                    </div>
                  </div>

                  <div className="space-y-6 py-8 border-y border-slate-100">
                    <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <span>রশিদ নং: {lastReceipt.receiptNo}</span>
                      <span>তারিখ: {lastReceipt.date}</span>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-4">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">সদস্যের নাম</span>
                        <span className="text-base font-black text-slate-900">{getMemberData(lastReceipt.memberId)?.name || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-4">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">বাড়ির নাম</span>
                        <span className="text-base font-bold text-slate-700">{getMemberData(lastReceipt.memberId)?.houseName || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-4">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">চাঁদার মাস</span>
                        <span className="text-base font-black text-emerald-700 uppercase tracking-tight">{getBengaliMonthName(lastReceipt.month)}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-[3rem] p-8 text-center shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <p className="text-[11px] font-black uppercase opacity-70 tracking-[0.4em] mb-2 relative z-10">পরিশোধিত চাঁদা</p>
                      <p className="text-5xl font-black tracking-tighter relative z-10">৳{lastReceipt.amount.toLocaleString()}</p>
                    </div>

                    <div className="relative py-6 text-center px-4 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
                        <Quote size={24} className="text-emerald-200 absolute -top-1 -left-1 opacity-60" />
                        <p className="text-[13px] font-bold text-emerald-900/70 leading-relaxed italic relative z-10 px-2">
                            "{receiptQuote || "আপনার অবদান গ্রামের নিরাপত্তায় মাইলফলক।"}"
                        </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end items-end px-4">
                    <div className="text-center">
                        <div className="signature-font text-3xl text-emerald-900 font-bold mb-1">{lastReceipt.receivedBy}</div>
                        <div className="w-24 h-px bg-slate-200 mx-auto mb-3"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Signature</p>
                    </div>
                  </div>
                </div>
            </div>

            <div className="flex gap-5 pb-16">
               <button onClick={() => window.print()} className="flex-1 py-6 bg-white text-slate-900 rounded-[2.2rem] font-black text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                  <Printer size={22} className="text-emerald-600" /> প্রিন্ট
               </button>
               <button onClick={downloadReceiptImage} disabled={isDownloading} className="flex-[1.5] py-6 bg-emerald-600 text-white rounded-[2.2rem] font-black text-sm flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50">
                  {isDownloading ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} />}
                  ছবি সেভ করুন
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINT-ONLY LIST ENGINE (PROFESSIONAL REPORT) --- */}
      {isPrintingList && (
        <div className="print-only hidden p-14 bg-white min-h-screen">
          <div className="text-center border-b-[8px] border-double border-black pb-12 mb-12">
            <h1 className="text-5xl font-black text-black tracking-tighter uppercase mb-4">কালিপুর পাহারাদার কল্যাণ তহবিল</h1>
            <p className="text-xl font-black text-black uppercase tracking-[0.5em]">{FIXED_ADDRESS}</p>
            <div className="inline-block mt-8 px-14 py-4 border-4 border-black bg-gray-50 rounded-full font-black text-2xl uppercase tracking-widest shadow-sm">
              চাঁদা আদায়ের অফিশিয়াল রিপোর্ট
            </div>
            <div className="flex justify-between items-center mt-10 px-4">
               <p className="text-lg font-black bg-black text-white px-6 py-1 rounded-lg">মাস: {getBengaliMonthName(filterMonth)}</p>
               <p className="text-sm font-bold italic">রিপোর্ট জেনারেট তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-[3px] border-black p-5 text-center w-16">নং</th>
                <th className="border-[3px] border-black p-5 text-left">সদস্যের নাম ও বাড়ি</th>
                <th className="border-[3px] border-black p-5 text-center">পরিশোধের মাস</th>
                <th className="border-[3px] border-black p-5 text-right">টাকার পরিমাণ</th>
                <th className="border-[3px] border-black p-5 text-center">আদায়কারী</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub, idx) => {
                const member = getMemberData(sub.memberId);
                return (
                  <tr key={sub.id}>
                    <td className="border-[3px] border-black p-5 text-center font-bold">{idx + 1}</td>
                    <td className="border-[3px] border-black p-5">
                      <div className="font-black text-lg">{member?.name || 'অজানা সদস্য'}</div>
                      <div className="text-xs font-bold text-gray-500 italic uppercase">বাড়ি: {member?.houseName || '---'}</div>
                    </td>
                    <td className="border-[3px] border-black p-5 text-center font-bold text-base">{getBengaliMonthName(sub.month)}</td>
                    <td className="border-[3px] border-black p-5 text-right font-black text-xl">৳{sub.amount.toLocaleString()}</td>
                    <td className="border-[3px] border-black p-5 text-center font-bold">{sub.receivedBy}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-black">
                <td colSpan={3} className="border-[3px] border-black p-8 text-right text-2xl uppercase tracking-widest">সর্বমোট আদায়কৃত টাকা:</td>
                <td className="border-[3px] border-black p-8 text-right text-3xl">৳{totalFilteredAmount.toLocaleString()}</td>
                <td className="border-[3px] border-black p-8"></td>
              </tr>
            </tbody>
          </table>

          <div className="mt-52 flex justify-between px-24">
            <div className="text-center space-y-4">
              <div className="w-56 h-0.5 bg-black mb-4"></div>
              <p className="text-lg font-black uppercase tracking-[0.3em]">কোষাধ্যক্ষ</p>
              <p className="text-xs font-bold text-gray-400 italic">(সীল ও স্বাক্ষর)</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-56 h-0.5 bg-black mb-4"></div>
              <p className="text-lg font-black uppercase tracking-[0.3em]">সভাপতি / সেক্রেটারি</p>
              <p className="text-xs font-bold text-gray-400 italic">(সীল ও স্বাক্ষর)</p>
            </div>
          </div>

          <div className="fixed bottom-12 left-0 right-0 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.6em] border-t border-gray-100 pt-10">
            Kalipur Village Watchman Welfare Fund • Automated System Report • Page 01
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionManager;
