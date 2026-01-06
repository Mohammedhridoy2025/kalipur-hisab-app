
import React, { useState, useMemo, useEffect } from 'react';
import { Member, Subscription, Expense, ViewState } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, PlusCircle, Wallet, History, ShoppingBag, ArrowUpRight, ArrowDownRight, ShieldCheck, Sparkles, Loader2, Quote } from 'lucide-react';
import { getFinancialInsights } from '../services/geminiService';

interface DashboardProps {
  members: Member[];
  subscriptions: Subscription[];
  expenses: Expense[];
  onAction: (view: ViewState, action?: string) => void;
  isAdmin: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ members, subscriptions, expenses, onAction, isAdmin }) => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const overviewMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const totalCollections = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const balance = totalCollections - totalExpenses;

  // Fetch AI Insights once on load
  useEffect(() => {
    const fetchInsight = async () => {
      if (members.length > 0) {
        setIsAiLoading(true);
        const recentExps = expenses.slice(0, 5).map(e => ({ d: e.description, a: e.amount }));
        const insight = await getFinancialInsights(members.length, balance, recentExps);
        setAiInsight(insight);
        setIsAiLoading(false);
      }
    };
    fetchInsight();
  }, [members.length, balance, expenses.length]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toISOString().slice(0, 7);
    }).reverse();

    return months.map(m => ({
      name: new Date(m).toLocaleDateString('bn-BD', { month: 'short' }),
      আদায়: subscriptions.filter(s => s.month === m).reduce((sum, s) => sum + s.amount, 0),
      খরচ: expenses.filter(e => e.date.startsWith(m)).reduce((sum, e) => sum + e.amount, 0),
    }));
  }, [subscriptions, expenses]);

  const recentTransactions = [
    ...subscriptions.map(s => ({ ...s, type: 'income' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => {
    const dateA = 'date' in a ? a.date : '';
    const dateB = 'date' in b ? b.date : '';
    return dateB.localeCompare(dateA);
  }).slice(0, 5);

  const stats = [
    { label: 'মোট সদস্য', value: members.length, icon: <Users size={20} />, color: 'bg-blue-500', trend: 'সক্রিয় সদস্য' },
    { label: 'মোট আদায়', value: `৳${totalCollections.toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'bg-emerald-500', trend: 'আজীবন' },
    { label: 'মোট খরচ', value: `৳${totalExpenses.toLocaleString()}`, icon: <TrendingDown size={20} />, color: 'bg-rose-500', trend: 'আজীবন' },
    { label: 'তহবিল ব্যালেন্স', value: `৳${balance.toLocaleString()}`, icon: <Wallet size={20} />, color: 'bg-amber-500', trend: 'বর্তমানে আছে' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Welcome & AI Insight Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -translate-y-32 translate-x-32 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
                <ShieldCheck size={40} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">কালিপুর পাহারাদার<br/>ম্যানেজমেন্ট</h2>
                <p className="text-slate-400 font-bold text-xs md:text-sm mt-2 flex items-center gap-2">
                  <PlusCircle size={14} className="text-emerald-500" /> বর্তমান তহবিলের আপডেট সামারি
                </p>
              </div>
           </div>
           {isAdmin && (
             <div className="flex gap-4 w-full md:w-auto relative z-10">
               <button onClick={() => onAction('collections')} className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-[1.4rem] font-black text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-600 transition-all">
                 <TrendingUp size={18} /> আদায়
               </button>
               <button onClick={() => onAction('expenses', 'add-expense')} className="flex-1 md:flex-none px-8 py-4 bg-rose-600 text-white rounded-[1.4rem] font-black text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-rose-700 transition-all">
                 <ShoppingBag size={18} /> খরচ
               </button>
             </div>
           )}
        </div>

        {/* AI Financial Advisor Insight Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-800 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                   <Sparkles size={20} className="text-amber-300" />
                </div>
                <h4 className="font-black text-sm uppercase tracking-widest">স্মার্ট AI পরামর্শ</h4>
              </div>
              <div className="flex-1">
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center h-24 gap-3">
                     <Loader2 className="animate-spin" />
                     <p className="text-[10px] font-black uppercase opacity-60">AI বিশ্লেষণ করছে...</p>
                  </div>
                ) : (
                  <div className="relative">
                    <Quote size={16} className="absolute -top-1 -left-1 opacity-20" />
                    <p className="text-[13px] leading-relaxed font-bold italic px-4 line-clamp-4">
                      {aiInsight || "তথ্য লোড করার পর এখানে আপনার তহবিলের জন্য গুরুত্বপূর্ণ পরামর্শ দেখা যাবে।"}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Powered by Gemini AI</span>
                 <button onClick={() => window.location.reload()} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <History size={14} />
                 </button>
              </div>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all flex flex-col gap-4 group">
             <div className={`${s.color} w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                {s.icon}
             </div>
             <div>
                <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-lg md:text-2xl font-black text-slate-800 mt-1 tracking-tighter">{s.value}</p>
             </div>
             <div className="text-[10px] font-black text-slate-400 mt-auto flex items-center gap-2 pt-2 border-t border-slate-50">
                <History size={12} className="text-emerald-500" /> {s.trend}
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-black text-slate-900 text-xl flex items-center gap-3">
                <TrendingUp className="text-emerald-500" size={24} /> আয় ও ব্যয়ের তুলনামূলক চিত্র
              </h3>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">গত ৬ মাসের ডাটাবেজ বিশ্লেষণ</p>
            </div>
          </div>
          <div className="h-72 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px', fontWeight: 900 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }} />
                <Bar dataKey="আদায়" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="খরচ" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white p-8 md:p-10 rounded-[3.5rem] border border-slate-50 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-900 text-xl">সাম্প্রতিক লেনদেন</h3>
            <button onClick={() => onAction('reports')} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">সকল আর্কাইভ</button>
          </div>
          <div className="space-y-5 flex-1">
            {recentTransactions.map((tx, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
                <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-sm ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-black text-slate-800 truncate">
                    {tx.type === 'income' ? members.find(m => m.id === (tx as any).memberId)?.name : (tx as any).description}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{'date' in tx ? tx.date : (tx as any).month}</p>
                </div>
                <div className={`text-sm font-black tracking-tight ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'} ৳{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                 <History size={48} className="text-slate-200 mb-3" />
                 <p className="text-xs font-black uppercase tracking-widest">লেনদেন নেই</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
