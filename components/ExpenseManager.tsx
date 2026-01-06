import React, { useState, useMemo, useEffect } from 'react';
import { Expense, ExpenseItem, AppNotification } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, ShoppingBag, ShoppingCart, PlusCircle, CheckCircle2, XCircle, Edit2, Receipt, Calendar, Tag, Banknote, Utensils, Coffee, Layers, ChevronRight, ShieldCheck, X, FileText, Trash, Sparkles, Zap, ListChecks } from 'lucide-react';
import { db, expensesCol, trashCol } from '../services/firebase';

interface ExpenseManagerProps {
  expenses: Expense[];
  setExpenses: (e: Expense[]) => void;
  initialOpen?: boolean;
  onCloseModal?: () => void;
  isAdmin: boolean;
  addNotification?: (type: AppNotification['type'], title: string, message: string) => void;
}

const CATEGORIES = [
  { id: 'Salary', label: 'বেতন', icon: <Banknote size={16} />, color: 'bg-blue-100 text-blue-700' },
  { id: 'Biriyani', label: 'বিরিয়ানি', icon: <Utensils size={16} />, color: 'bg-orange-100 text-orange-700' },
  { id: 'Snacks', label: 'নাস্তা', icon: <Coffee size={16} />, color: 'bg-amber-100 text-amber-700' },
  { id: 'Others', label: 'অন্যান্য', icon: <Layers size={16} />, color: 'bg-slate-100 text-slate-700' }
];

// Quick Presets for Items to avoid repetitive typing
const PRESET_ITEMS = {
  biriyani: [
    { name: 'চাল (৫ কেজি)', amount: 0 },
    { name: 'মুরগির মাংস', amount: 0 },
    { name: 'তেল ও ঘি', amount: 0 },
    { name: 'মসলাপাতি', amount: 0 },
    { name: 'সালাদ ও টকদই', amount: 0 }
  ],
  snacks: [
    { name: 'চানাচুর', amount: 0 },
    { name: 'মুড়ি', amount: 0 },
    { name: 'চা পাতা ও চিনি', amount: 0 },
    { name: 'বিস্কুট', amount: 0 }
  ]
};

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, initialOpen, onCloseModal, isAdmin, addNotification }) => {
  const [isModalOpen, setIsModalOpen] = useState(initialOpen || false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'Others',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    items: [{ id: Date.now().toString(), name: '', amount: 0 }]
  });

  useEffect(() => {
    if (initialOpen) setIsModalOpen(true);
  }, [initialOpen]);

  const totalAmount = useMemo(() => {
    return (formData.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [formData.items]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now().toString(), name: '', amount: 0 }]
    }));
  };

  const applyPreset = (type: 'biriyani' | 'snacks') => {
    const preset = PRESET_ITEMS[type];
    const newItems = preset.map(p => ({
      id: Math.random().toString(36).substr(2, 9),
      name: p.name,
      amount: p.amount
    }));
    
    setFormData(prev => ({
      ...prev,
      category: type === 'biriyani' ? 'Biriyani' : 'Snacks',
      description: type === 'biriyani' ? 'বিরিয়ানি বাজার' : 'নাস্তা ও হালকা খাবার',
      items: newItems
    }));
    addNotification?.('info', 'প্রিসেট যুক্ত', 'আইটেমগুলো অটোমেটিক যোগ করা হয়েছে।');
  };

  const handleRemoveItem = (id: string) => {
    if ((formData.items || []).length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.id !== id)
    }));
  };

  const handleItemChange = (id: string, field: 'name' | 'amount', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      category: 'Others',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      items: [{ id: Date.now().toString(), name: '', amount: 0 }]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isSubmitting) return;

    if (!formData.description || totalAmount <= 0) {
      alert("অনুগ্রহ করে বিবরণ এবং সঠিক পরিমাণ লিখুন।");
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        ...formData,
        amount: totalAmount,
        items: formData.items?.filter(i => i.name.trim() !== '')
      };

      if (editingExpense) {
        await db.collection("expenses").doc(editingExpense.id).set(expenseData, { merge: true });
        addNotification?.('success', 'সফল', 'খরচের তথ্য আপডেট করা হয়েছে।');
      } else {
        await expensesCol.add(expenseData);
        addNotification?.('success', 'সফল', 'নতুন খরচ যোগ করা হয়েছে।');
      }
      
      setIsModalOpen(false);
      resetForm();
      onCloseModal?.();
    } catch (err) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, expense: Expense) => {
    e.stopPropagation();
    if (!isAdmin || !window.confirm('আপনি কি নিশ্চিত যে এই খরচের রেকর্ডটি মুছে ফেলতে চান?')) return;
    
    setIsDeletingId(expense.id);
    try {
      await trashCol.add({
        originalId: expense.id,
        type: 'expense',
        data: expense,
        deletedAt: new Date().toISOString()
      });
      await db.collection("expenses").doc(expense.id).delete();
      addNotification?.('warning', 'ডিলিট সম্পন্ন', 'রেকর্ডটি রিসাইকেল বিনে পাঠানো হয়েছে।');
    } catch (err) {
      alert("মুছে ফেলতে সমস্যা হয়েছে।");
    } finally {
      setIsDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEdit = (e: React.MouseEvent, expense: Expense) => {
    e.stopPropagation();
    setEditingExpense(expense);
    setFormData(expense);
    setIsModalOpen(true);
  };

  const formatBengaliDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    // Convert to Bengali Numerals
    const enToBn = (s: string | number) => s.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
    
    return `${enToBn(day)} ${month}, ${enToBn(year)}`;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header with improved layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expensed Monitor</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Receipt className="text-rose-600" /> ব্যয়ের স্মার্ট আর্কাইভ
          </h2>
          <p className="text-sm font-bold text-slate-400 mt-1">তহবিলের যাবতীয় খরচের স্বচ্ছ এবং বিস্তারিত হিসাব।</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm shadow-2xl hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            নতুন খরচ যুক্ত করুন
          </button>
        )}
      </div>

      {/* Professional Expense Feed (Card-based with Animations) */}
      <div className="grid grid-cols-1 gap-6 no-print">
        {expenses.map((expense, index) => {
          const category = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[3];
          const isExpanded = expandedId === expense.id;

          return (
            <div 
              key={expense.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className={`bg-white rounded-[2.8rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-rose-100 transition-all duration-300 overflow-hidden group animate-in slide-in-from-bottom-6 fade-in cursor-pointer ${isExpanded ? 'ring-4 ring-rose-500/10' : ''}`}
              onClick={() => toggleExpand(expense.id)}
            >
              <div className="p-7 md:p-10 flex flex-col md:flex-row items-center gap-8">
                {/* Date and Category Badge Section */}
                <div className="flex flex-row md:flex-col items-center gap-4 shrink-0 md:border-r border-slate-50 md:pr-10 w-full md:w-auto">
                  <div className="bg-slate-50 p-4 rounded-[1.8rem] text-center min-w-[120px] shadow-inner">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">খরচের তারিখ</p>
                    <p className="text-sm font-black text-slate-800 leading-tight">{formatBengaliDate(expense.date)}</p>
                  </div>
                  <div className={`p-3.5 rounded-2xl flex items-center justify-center gap-2.5 ${category.color} px-5 w-full md:w-auto`}>
                    {category.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{category.label}</span>
                  </div>
                </div>

                {/* Description & Summary Section */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start gap-6">
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-slate-800 leading-tight group-hover:text-rose-600 transition-colors">{expense.description}</h4>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          <ShoppingBag size={12} className="text-rose-400" />
                          {expense.items?.length || 0} টি আইটেম
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                          <Tag size={12} className="text-rose-400" />
                          ID: {expense.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট খরচ</p>
                       <p className="text-3xl font-black text-rose-600 tracking-tighter">৳{expense.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Controls Section */}
                <div className="flex items-center gap-4 w-full md:w-auto md:pl-8 border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-0">
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleEdit(e, expense)}
                        className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, expense)}
                        disabled={isDeletingId === expense.id}
                        className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50"
                      >
                        {isDeletingId === expense.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  )}
                  <div className={`w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isExpanded ? 'rotate-180 bg-rose-50 text-rose-500' : ''}`}>
                    <ChevronDown size={22} />
                  </div>
                </div>
              </div>

              {/* Expandable Content (Detailed Items List) */}
              {isExpanded && (
                <div className="bg-slate-50/50 p-8 md:p-12 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-rose-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg">
                        <ShoppingCart size={20} />
                      </div>
                      <div>
                         <h5 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em]">বাজারের বিস্তারিত ফর্দ</h5>
                         <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">সকল খরচ আইটেম অনুযায়ী নিচে দেখুন</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {expense.items?.map((item, idx) => (
                        <div key={item.id} className="bg-white p-5 rounded-[1.8rem] border border-slate-100 flex justify-between items-center shadow-sm hover:border-rose-200 transition-colors group/item">
                          <div className="flex items-center gap-4">
                            <div className="w-9 h-9 bg-slate-50 group-hover/item:bg-rose-50 rounded-xl flex items-center justify-center text-[11px] font-black text-slate-400 group-hover/item:text-rose-500 transition-colors shadow-inner">{idx + 1}</div>
                            <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                          </div>
                          <span className="font-black text-slate-900 text-sm">৳{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {(!expense.items || expense.items.length === 0) && (
                      <div className="text-center py-12">
                        <Receipt size={40} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-300 italic">কোনো আইটেম রেকর্ড করা নেই।</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {expenses.length === 0 && (
          <div className="text-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <Receipt size={48} className="text-slate-200" />
             </div>
             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">এখনও কোনো খরচ রেকর্ড করা হয়নি</p>
             <p className="text-slate-300 font-bold text-xs mt-3 uppercase tracking-widest">ডাটা যুক্ত করলে এখানে দেখা যাবে</p>
          </div>
        )}
      </div>

      {/* --- REFINED COMPACT EXPENSE MODAL --- */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-[200] no-print animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl relative animate-in zoom-in duration-500 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-[1.6rem] flex items-center justify-center shadow-inner">
                  <Receipt size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {editingExpense ? 'খরচ সংশোধন' : 'নতুন খরচ এন্ট্রি'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">কালিপুর পাহারাদার তহবিল</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); onCloseModal?.(); }}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-5 space-y-7 no-scrollbar">
              
              {/* Quick Preset Buttons Section */}
              <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2.2rem] border border-slate-100 shadow-inner">
                <div className="flex items-center gap-2.5 px-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">অটোম্যাটিক প্রিসেট</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => applyPreset('biriyani')}
                    className="flex-1 py-4 bg-white border border-slate-200 rounded-[1.4rem] flex flex-col items-center justify-center gap-2 text-[11px] font-black text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm active:scale-95"
                  >
                    <Utensils size={18} /> బిরিয়ানি সেট
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyPreset('snacks')}
                    className="flex-1 py-4 bg-white border border-slate-200 rounded-[1.4rem] flex flex-col items-center justify-center gap-2 text-[11px] font-black text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all shadow-sm active:scale-95"
                  >
                    <Coffee size={18} /> নাস্তা সেট
                  </button>
                </div>
              </div>

              {/* Category & Date Grid */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খরচের ধরণ</label>
                  <div className="relative group">
                    <select 
                      className="w-full pl-5 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-800 outline-none appearance-none cursor-pointer focus:bg-white focus:border-rose-500/30 transition-all"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                    >
                      {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">তারিখ</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-800 outline-none focus:bg-white focus:border-rose-500/30 transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খরচের প্রধান বিবরণ</label>
                <input 
                  type="text" 
                  placeholder="উদা: জানুয়ারী মাসের বাজার খরচ"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-sm text-slate-800 outline-none focus:bg-white focus:border-rose-500/30 transition-all shadow-inner"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              {/* Detailed Items List Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart size={12} className="text-rose-500" /> আইটেম লিস্ট
                  </label>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="text-[10px] font-black text-rose-600 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    <Plus size={14} /> আইটেম যোগ
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.items || []).map((item) => (
                    <div key={item.id} className="flex gap-3 animate-in slide-in-from-left-3 duration-300">
                      <div className="flex-[3]">
                        <input 
                          type="text" 
                          placeholder="আইটেমের নাম"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.2rem] font-bold text-xs outline-none focus:bg-white transition-all shadow-sm"
                          value={item.name}
                          onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="flex-[1.5]">
                        <input 
                          type="number" 
                          placeholder="৳ ০"
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-[1.2rem] font-black text-xs outline-none focus:bg-white text-right transition-all shadow-sm"
                          value={item.amount || ''}
                          onChange={e => handleItemChange(item.id, 'amount', e.target.value)}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[1.2rem] transition-all active:scale-90"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Modal Footer (Summary) */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/40 shrink-0">
               <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">সর্বমোট খরচ</p>
                    <p className="text-3xl font-black text-rose-600 tracking-tighter">৳ {totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button 
                      type="submit" 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-10 py-5 bg-rose-600 text-white rounded-[1.8rem] font-black text-sm shadow-2xl shadow-rose-900/20 hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-3"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                      খরচ সেভ করুন
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;