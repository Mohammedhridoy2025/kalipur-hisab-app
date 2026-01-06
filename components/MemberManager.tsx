
import React, { useState, useMemo, useEffect } from 'react';
import { Member, Subscription } from '../types';
import { Plus, Search, Edit2, ShieldCheck, Home, XCircle, RefreshCw, Loader2, Camera, Globe, Lock, CheckCircle, AlertCircle, MapPin, UserCheck, TrendingUp, Printer, Filter, CalendarDays, User, FileText, Calendar, ChevronDown, Upload, Smartphone, Hash, X } from 'lucide-react';
import { membersCol, db } from '../services/firebase';

interface MemberManagerProps {
  members: Member[];
  subscriptions: Subscription[];
  setMembers: (m: Member[]) => void;
  initialOpen?: boolean;
  onCloseModal?: () => void;
  onAddSubscription?: (memberId: string) => void;
  isAdmin: boolean;
}

const DEFAULT_PHOTO = "https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-user-profile-avatar-png-image_10211467.png";
const IMGBB_API_KEY = process.env.IMGBB_API_KEY; // Updated to use process.env
const COUNTRY_OPTIONS = [
  "বাংলাদেশ", "সৌদি আরব", "সংযুক্ত আরব আমিরাত", "ওমান", "মালয়েশিয়া", "কাতার", "কুয়েত", "সিঙ্গাপুর",
  "যুক্তরাজ্য", "ইতালি", "পর্তুগাল", "ফ্রান্স", "যুক্তরাষ্ট্র", "অস্ট্রেলিয়া", "অন্যান্য"
];

const MIN_MONTH = "2025-12";

const MemberManager: React.FC<MemberManagerProps> = ({ members, subscriptions, initialOpen, onCloseModal, onAddSubscription, isAdmin }) => {
  const [isModalOpen, setIsModalOpen] = useState(initialOpen || false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '', houseName: '', mobile: '', country: 'বাংলাদেশ', status: 'active', photoUrl: ''
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date().toISOString().slice(0, 7);
    return now < MIN_MONTH ? MIN_MONTH : now;
  });

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

  useEffect(() => {
    if (initialOpen) setIsModalOpen(true);
  }, [initialOpen]);

  const isMemberPaidForMonth = (memberId: string, month: string) => {
    return subscriptions.some(s => s.memberId === memberId && s.month === month);
  };

  const getMemberTotalContribution = (memberId: string) => {
    return subscriptions.filter(s => s.memberId === memberId).reduce((sum, s) => sum + s.amount, 0);
  };

  const sortedMembers = useMemo(() => {
    return [...members].filter(m => {
      const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.houseName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isPaid = isMemberPaidForMonth(m.id, selectedMonth);
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'paid' && isPaid) || 
                           (filterStatus === 'unpaid' && !isPaid);

      return matchesSearch && matchesFilter && m.status === 'active';
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [members, searchTerm, filterStatus, selectedMonth, subscriptions]);

  const handlePrint = () => {
    window.print();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!IMGBB_API_KEY) {
      alert("ছবি আপলোডের জন্য API Key পাওয়া যায়নি। ডেভেলপারের সাথে যোগাযোগ করুন।");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("ছবির সাইজ অনেক বড়! ৫ MB এর নিচের ছবি দিন।");
      return;
    }

    setIsImageUploading(true);
    
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: uploadData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFormData(prev => ({ ...prev, photoUrl: result.data.url }));
        console.log("Uploaded Image URL:", result.data.url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert("ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isSaving || isImageUploading) return;

    if (!formData.name || !formData.houseName) {
      alert("দয়া করে নাম এবং বাড়ির নাম দিন।");
      return;
    }

    setIsSaving(true);
    try {
      // Logic fix: Ensure the photoUrl from state is used, fallback to default only if empty
      const finalPhotoUrl = formData.photoUrl || DEFAULT_PHOTO;
      
      const finalData = {
        name: formData.name,
        houseName: formData.houseName,
        mobile: formData.mobile || '',
        country: formData.country || 'বাংলাদেশ',
        status: formData.status || 'active',
        photoUrl: finalPhotoUrl
      };

      if (editingMember) {
        await db.collection("members").doc(editingMember.id).set(finalData, { merge: true });
      } else {
        await membersCol.add(finalData);
      }
      
      setIsModalOpen(false);
      resetForm();
      onCloseModal?.();
    } catch (err: any) {
      console.error("Firestore save error:", err);
      alert(`তথ্য সেভ করতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setEditingMember(null);
    setFormData({ name: '', houseName: '', mobile: '', country: 'বাংলাদেশ', status: 'active', photoUrl: '' });
  };

  const getBengaliMonthName = (monthStr: string) => {
    const [year, m] = monthStr.split('-');
    const months: Record<string, string> = {
      '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল', '05': 'মে', '06': 'জুন',
      '07': 'জুলাই', '08': 'আগস্ট', '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
    };
    return `${months[m]} ${year}`;
  };

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Header Controls */}
      <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10 no-print overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full -translate-y-40 translate-x-40 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="w-full lg:flex-1">
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">সদস্য অনুসন্ধান</span>
                </div>
                <div className="relative group/search">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-emerald-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="সদস্য বা বাড়ির নাম..." 
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 font-black text-base transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
             </div>
          </div>

          <div className="w-full lg:w-auto">
            <div className="flex flex-col gap-2 w-full lg:w-80">
               <div className="flex items-center gap-2 ml-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">মাসের রিপোর্ট</span>
               </div>
               <div className="relative group/select">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 z-10">
                     <Calendar size={20} />
                  </div>
                  <select 
                    className="w-full pl-16 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] appearance-none font-black text-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 outline-none transition-all cursor-pointer shadow-inner text-base"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m}>{getBengaliMonthName(m)}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm transition-transform duration-300">
                    <ChevronDown size={24} />
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-center gap-6 relative z-10">
           <div className="grid grid-cols-3 bg-slate-100/60 p-2 rounded-[2rem] w-full lg:w-[450px] shadow-inner">
                {['all', 'paid', 'unpaid'].map(id => (
                    <button
                        key={id}
                        onClick={() => setFilterStatus(id as any)}
                        className={`px-2 py-4 rounded-[1.6rem] text-[11px] font-black transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1.5 ${filterStatus === id ? 'bg-white text-emerald-700 shadow-xl scale-105 border border-emerald-50' : 'text-slate-400'}`}
                    >
                        {id === 'all' ? 'সবাই' : id === 'paid' ? 'পরিশোধিত' : 'বকেয়া'}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 w-full xl:w-auto">
               <button onClick={handlePrint} className="flex-1 xl:flex-none px-10 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Printer size={20} /> প্রিন্ট
               </button>
               {isAdmin && (
                  <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 xl:flex-none px-10 py-5 bg-emerald-600 text-white rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Plus size={20} /> নতুন সদস্য
                  </button>
               )}
            </div>
        </div>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-print">
         {sortedMembers.map(member => {
           const total = getMemberTotalContribution(member.id);
           const isPaid = isMemberPaidForMonth(member.id, selectedMonth);
           return (
             <div key={member.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative group">
                <div className={`h-28 relative overflow-hidden ${isPaid ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
                   <div className="absolute top-4 right-4 flex gap-2">
                      {isAdmin && (
                        <button 
                          onClick={() => { 
                            setEditingMember(member); 
                            setFormData({...member}); 
                            setIsModalOpen(true); 
                          }} 
                          className="p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-xl backdrop-blur-md active:scale-90 transition-all shadow-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                   </div>
                   <div className="absolute top-4 left-4">
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-1.5 backdrop-blur-md border border-white/20 ${isPaid ? 'bg-emerald-400/80 text-white' : 'bg-rose-500/80 text-white'}`}>
                        {isPaid ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {isPaid ? 'পরিশোধিত' : 'বকেয়া'}
                      </div>
                   </div>
                </div>

                <div className="px-5 -mt-14 flex flex-col items-center pb-6">
                    <div className="relative">
                      <img 
                        src={member.photoUrl || DEFAULT_PHOTO} 
                        className="w-28 h-28 rounded-[2.5rem] border-4 border-white shadow-2xl object-cover bg-slate-100 transition-transform group-hover:scale-105 duration-300" 
                        alt={member.name} 
                      />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl border-2 border-white flex items-center justify-center shadow-lg bg-emerald-500">
                        <UserCheck size={14} className="text-white" />
                      </div>
                    </div>

                    <div className="mt-5 text-center w-full">
                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">{member.name}</h3>
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mt-2">
                          <Home size={14} className="text-emerald-500" /> 
                          <span>{member.houseName}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mt-8">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">অবস্থান</p>
                          <p className="text-[12px] font-black text-slate-700 truncate">{member.country}</p>
                       </div>
                       <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50 text-center">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">মোট দান</p>
                          <p className="text-[12px] font-black text-emerald-800">৳{total.toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="mt-8 w-full">
                       {isAdmin && (
                         <button 
                           onClick={() => onAddSubscription?.(member.id)} 
                           className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-xs hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3"
                         >
                           <ShieldCheck size={18} /> চাঁদা জমা নিন
                         </button>
                       )}
                    </div>
                </div>
             </div>
           )
         })}
      </div>

      {/* --- PROFESSIONAL ADD/EDIT MEMBER MODAL --- */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-4 z-[150] no-print animate-in fade-in duration-300">
           <div className="bg-white rounded-t-[3.5rem] md:rounded-[3.5rem] p-8 md:p-12 w-full max-w-xl shadow-2xl relative animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[95vh] no-scrollbar">
              
              {/* Close Button */}
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); onCloseModal?.(); }} 
                className="absolute top-8 right-8 p-3 bg-slate-100 text-slate-400 rounded-2xl active:scale-90 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm z-20"
              >
                <XCircle size={24} />
              </button>

              <div className="mb-10 text-center md:text-left relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl mb-4">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">সদস্য ডাটাবেজ</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {editingMember ? 'তথ্য সংশোধন করুন' : 'নতুন সদস্য প্রোফাইল'}
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-3 leading-relaxed">তহবিলের স্বচ্ছতার জন্য সঠিক তথ্য ইনপুট দেওয়া প্রয়োজন।</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 pb-4">
                
                {/* --- Photo Upload Section --- */}
                <div className="flex flex-col items-center md:items-start gap-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">সদস্যের ছবি</label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                    <div className="relative group/photo">
                        <div className="w-28 h-28 bg-white rounded-[2rem] overflow-hidden border-4 border-white shadow-xl flex items-center justify-center shrink-0">
                        {isImageUploading ? (
                          <div className="flex flex-col items-center justify-center gap-2">
                             <Loader2 size={24} className="animate-spin text-emerald-600" />
                             <span className="text-[8px] font-black text-emerald-600 uppercase">Uploading...</span>
                          </div>
                        ) : (
                          <img 
                              src={formData.photoUrl || DEFAULT_PHOTO} 
                              className="w-full h-full object-cover" 
                              alt="Preview" 
                              onError={(e) => (e.currentTarget.src = DEFAULT_PHOTO)}
                          />
                        )}
                        </div>
                        {formData.photoUrl && !isImageUploading && (
                          <button 
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-rose-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center pointer-events-none">
                            <Camera size={24} className="text-white" />
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                      <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-[1.8rem] cursor-pointer transition-all group/upload ${isImageUploading ? 'bg-slate-100 border-slate-200 cursor-not-allowed' : 'bg-white/50 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400'}`}>
                        <div className="flex flex-col items-center justify-center">
                          {isImageUploading ? (
                            <RefreshCw size={24} className="text-slate-400 animate-spin" />
                          ) : (
                            <Upload size={24} className="text-emerald-500 mb-2 group-hover/upload:bounce" />
                          )}
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isImageUploading ? 'আপলোড হচ্ছে...' : 'ফটো সিলেক্ট করুন'}</p>
                          <p className="text-[9px] font-bold text-slate-300 mt-1">গ্যালারি বা ক্যামেরা</p>
                        </div>
                        {!isImageUploading && <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />}
                      </label>
                    </div>
                  </div>
                </div>

                {/* --- Input Fields --- */}
                <div className="space-y-5">
                    <div className="space-y-2 group/input">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                            <User size={12} className="text-emerald-500" /> সদস্যের পূর্ণ নাম
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="উদা: মোঃ শফিক উল্লাহ"
                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-inner text-base" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                <Home size={12} className="text-emerald-500" /> বাড়ির নাম
                            </label>
                            <input 
                                type="text" 
                                placeholder="উদা: বড় বাড়ি"
                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-inner text-base" 
                                value={formData.houseName} 
                                onChange={e => setFormData({...formData, houseName: e.target.value})} 
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                <Globe size={12} className="text-emerald-500" /> বর্তমানে যেখানে থাকেন
                            </label>
                            <div className="relative group/select">
                                <select 
                                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-inner appearance-none cursor-pointer text-base" 
                                    value={formData.country} 
                                    onChange={e => setFormData({...formData, country: e.target.value})}
                                >
                                    {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/select:rotate-180 transition-transform" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                            <Smartphone size={12} className="text-emerald-500" /> মোবাইল নম্বর (ঐচ্ছিক)
                        </label>
                        <div className="relative">
                            <input 
                                type="tel" 
                                placeholder="+৮৮০ ১xxx xxxxxx"
                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all shadow-inner text-base" 
                                value={formData.mobile || ''} 
                                onChange={e => setFormData({...formData, mobile: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); resetForm(); }} 
                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-sm active:scale-95 transition-all hover:bg-slate-200"
                  >
                    বাতিল করুন
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving || isImageUploading} 
                    className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3 group/save disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} className="group-hover/save:scale-110 transition-transform" />}
                    {isImageUploading ? 'ছবি আপলোড হচ্ছে...' : editingMember ? 'পরিবর্তন সেভ করুন' : 'নতুন সদস্য যোগ করুন'}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default MemberManager;