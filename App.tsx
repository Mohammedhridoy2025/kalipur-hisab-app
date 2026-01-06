import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Member, Subscription, Expense, TrashRecord, AppNotification } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MemberManager from './components/MemberManager';
import CollectionManager from './components/CollectionManager';
import ExpenseManager from './components/ExpenseManager';
import DefaulterManager from './components/DefaulterManager';
import Reports from './components/Reports';
import TrashBin from './components/TrashBin';
import { Menu, X, Cloud, RefreshCw, Lock, Unlock, LogIn, LogOut, XCircle, User, Bell, CheckCircle2, AlertTriangle, Info, Loader2, ShieldCheck, LayoutDashboard, Users, Wallet, Receipt, FileBarChart, History, ExternalLink, BellRing } from 'lucide-react';
import { membersCol, subscriptionsCol, expensesCol, trashCol, auth } from './services/firebase';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(() => {
    return (localStorage.getItem('appActiveView') as ViewState) || 'dashboard';
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trashRecords, setTrashRecords] = useState<TrashRecord[]>([]);
  const [initialAction, setInitialAction] = useState<string | null>(null);
  const [preSelectedMemberId, setPreSelectedMemberId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [notifications, setNotifications] = useState<(AppNotification & { actionView?: ViewState })[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const initialLoads = useRef({ members: true, subs: true, expenses: true });

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    if (notifPermission === 'default') {
      const showTimer = setTimeout(() => setShowPermissionPrompt(true), 1500);
      const hideTimer = setTimeout(() => setShowPermissionPrompt(false), 5500);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
  }, [notifPermission]);

  const handleViewChange = (view: ViewState) => {
    setActiveView(view);
    localStorage.setItem('appActiveView', view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requestNotifPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const permission = await Notification.requestPermission();
        setNotifPermission(permission);
        setShowPermissionPrompt(false);
      } catch (err) {
        setShowPermissionPrompt(false);
      }
    }
  };

  const addNotification = (type: AppNotification['type'], title: string, message: string, actionView?: ViewState) => {
    const id = Date.now().toString();
    const newNotification = { id, type, title, message, actionView };
    
    setNotifications(prev => {
      const filtered = prev.slice(0, 2);
      return [newNotification, ...filtered];
    });
    
    if (notifPermission === 'granted' && typeof Notification !== 'undefined') {
      const n = new Notification(title, { body: message });
      n.onclick = () => { window.focus(); if (actionView) handleViewChange(actionView); n.close(); };
    }

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAdmin(!!user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsSyncing(true);
    
    const unsubMembers = membersCol.onSnapshot((snapshot) => {
      const membersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      if (!initialLoads.current.members) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data() as Member;
            addNotification('info', 'নতুন সদস্য', `${data.name} পরিবারে যোগ দিয়েছেন।`, 'members');
          }
        });
      }
      setMembers(membersList);
      setIsSyncing(false);
      initialLoads.current.members = false;
    }, () => setIsSyncing(false));
    
    const unsubSubs = subscriptionsCol.onSnapshot((snapshot) => {
      const subsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      if (!initialLoads.current.subs) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            addNotification('success', 'চাঁদা জমা', 'তহবিলে নতুন চাঁদা জমা হয়েছে।', 'collections');
          }
        });
      }
      setSubscriptions(subsList.sort((a, b) => b.date.localeCompare(a.date)));
      initialLoads.current.subs = false;
    });
    
    const unsubExpenses = expensesCol.onSnapshot((snapshot) => {
      const expList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      if (!initialLoads.current.expenses) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data() as Expense;
            if (data.amount >= 5000) {
              addNotification('alert', 'বড় খরচ অ্যালার্ট', `৳${data.amount.toLocaleString()} খরচ হয়েছে: ${data.description}`, 'expenses');
            } else {
              addNotification('warning', 'নতুন খরচ', 'তহবিল থেকে টাকা খরচ হয়েছে।', 'expenses');
            }
          }
        });
      }
      setExpenses(expList.sort((a, b) => b.date.localeCompare(a.date)));
      initialLoads.current.expenses = false;
    });
    
    const unsubTrash = trashCol.onSnapshot((snapshot) => {
      const trashList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrashRecord));
      setTrashRecords(trashList.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)));
    });
    
    return () => {
      unsubMembers();
      unsubSubs();
      unsubExpenses();
      unsubTrash();
    };
  }, []);

  const totalCollections = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const balance = totalCollections - totalExpenses;

  const handleQuickAction = (view: ViewState, action?: string) => {
    handleViewChange(view);
    if (action) setInitialAction(action);
  };

  const handleQuickSubscription = (memberId: string) => {
    setPreSelectedMemberId(memberId);
    handleViewChange('collections');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const email = loginUsername.trim().toLowerCase() === 'admin' ? 'admin@kalipur.com' : loginUsername.trim();
    try {
      await auth.signInWithEmailAndPassword(email, loginPassword.trim());
      setIsLoginModalOpen(false);
      setLoginUsername('');
      setLoginPassword('');
      addNotification('success', 'লগইন সফল', 'অ্যাডমিন প্যানেলে স্বাগতম');
    } catch (error) {
      setLoginError('ভুল ইউজারনেম বা পাসওয়ার্ড!');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      handleViewChange('dashboard');
      addNotification('info', 'লগআউট', 'আপনি সফলভাবে লগআউট করেছেন');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard members={members} subscriptions={subscriptions} expenses={expenses} onAction={handleQuickAction} isAdmin={isAdmin} />;
      case 'members':
        return <MemberManager members={members} subscriptions={subscriptions} setMembers={() => {}} initialOpen={initialAction === 'add-member'} onCloseModal={() => setInitialAction(null)} onAddSubscription={handleQuickSubscription} isAdmin={isAdmin} />;
      case 'collections':
        return <CollectionManager members={members} subscriptions={subscriptions} setSubscriptions={() => {}} initialMemberId={preSelectedMemberId || undefined} onClearPreSelection={() => setPreSelectedMemberId(null)} isAdmin={isAdmin} addNotification={addNotification} />;
      case 'defaulters':
        return <DefaulterManager members={members} subscriptions={subscriptions} onAddSubscription={handleQuickSubscription} />;
      case 'expenses':
        return <ExpenseManager expenses={expenses} setExpenses={() => {}} initialOpen={initialAction === 'add-expense'} onCloseModal={() => setInitialAction(null)} isAdmin={isAdmin} addNotification={addNotification} />;
      case 'reports':
        return <Reports members={members} subscriptions={subscriptions} expenses={expenses} />;
      case 'trash':
        return <TrashBin trashRecords={trashRecords} members={members} isAdmin={isAdmin} />;
      default:
        return <Dashboard members={members} subscriptions={subscriptions} expenses={expenses} onAction={handleQuickAction} isAdmin={isAdmin} />;
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
         <div className="bg-white p-8 rounded-[2rem] shadow-xl flex flex-col items-center">
            <ShieldCheck size={48} className="text-emerald-600 mb-4 animate-bounce" />
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">কালিপুর পাহারাদার</h2>
            <div className="flex items-center gap-2 mt-4 text-emerald-600 font-bold">
               <Loader2 className="animate-spin" size={20} />
               <span>সিস্টেম লোড হচ্ছে...</span>
            </div>
         </div>
      </div>
    );
  }

  const mobileNavItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={22} /> },
    { id: 'members', label: 'সদস্য', icon: <Users size={22} /> },
    { id: 'collections', label: 'আদায়', icon: <Wallet size={22} /> },
    { id: 'expenses', label: 'খরচ', icon: <Receipt size={22} /> },
    { id: 'reports', label: 'রিপোর্ট', icon: <FileBarChart size={22} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
      <div className="hidden md:block no-print">
         <Sidebar activeView={activeView} setActiveView={handleViewChange} balance={balance} isAdmin={isAdmin} onLogin={() => setIsLoginModalOpen(true)} onLogout={handleLogout} />
      </div>

      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none px-4 md:px-0 max-w-sm w-full">
        {notifPermission === 'default' && showPermissionPrompt && (
          <div className="pointer-events-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-right-10 duration-300">
            <div className="flex items-center gap-2">
              <BellRing size={20} className="text-amber-400 animate-pulse" />
              <span className="text-xs font-bold">নোটিফিকেশন অন করুন</span>
            </div>
            <div className="flex gap-2">
              <button onClick={requestNotifPermission} className="bg-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors">অনুমতি দিন</button>
              <button onClick={() => setShowPermissionPrompt(false)} className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20"><X size={14} /></button>
            </div>
          </div>
        )}

        {notifications.map((note) => (
          <div key={note.id} className={`pointer-events-auto flex flex-col gap-3 p-4 rounded-[1.5rem] shadow-2xl border-l-4 animate-in slide-in-from-right-10 duration-300 backdrop-blur-md ${note.type === 'success' ? 'bg-white/95 border-emerald-500 text-emerald-900' : note.type === 'alert' ? 'bg-rose-50 border-rose-600 text-rose-900' : note.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white/95 border-blue-500 text-blue-900'}`}>
             <div className="flex items-start gap-3">
               <div className="mt-0.5">
                 {note.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600" />}
                 {note.type === 'alert' && <AlertTriangle size={18} className="text-rose-600" />}
                 {note.type === 'warning' && <AlertTriangle size={18} className="text-amber-600" />}
                 {note.type === 'info' && <Info size={18} className="text-blue-600" />}
               </div>
               <div className="flex-1">
                 <h4 className="font-black text-sm">{note.title}</h4>
                 <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">{note.message}</p>
               </div>
               <button onClick={() => removeNotification(note.id)} className="opacity-50 hover:opacity-100 p-1"><X size={16} /></button>
             </div>
             {note.actionView && (
               <button 
                 onClick={() => { handleViewChange(note.actionView!); removeNotification(note.id); }} 
                 className="flex items-center justify-center gap-2 py-2 bg-black/5 hover:bg-black/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
               >
                 <ExternalLink size={12} /> চলো দেখি
               </button>
             )}
          </div>
        ))}
      </div>

      <header className="md:hidden sticky top-0 bg-white/95 backdrop-blur-md z-50 p-4 border-b border-gray-100 flex justify-between items-center no-print safe-area-top shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-emerald-100">🛡️</div>
          <div>
            <h2 className="text-base font-black text-emerald-900 leading-tight">কালিপুর পাহারাদার</h2>
            <p className="text-[11px] font-black text-emerald-600">ব্যালেন্স: ৳{balance.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
           {!isAdmin ? (
             <button onClick={() => setIsLoginModalOpen(true)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:scale-95 transition-transform"><LogIn size={20} /></button>
           ) : (
             <button onClick={handleLogout} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl active:scale-95 transition-transform"><LogOut size={20} /></button>
           )}
        </div>
      </header>

      <main className="flex-1 main-content p-4 md:p-8 overflow-y-auto">
        <div className="hidden md:flex mb-8 justify-between items-center no-print">
          <div>
            <h1 className="text-3xl font-black text-emerald-800 tracking-tight">কালিপুর পাহারাদার ম্যানেজমেন্ট</h1>
            <p className="text-gray-500 font-bold">আর্থিক সহযোগিতায় কালিপুর গ্রামের প্রবাসীগন</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={requestNotifPermission} className={`p-3 rounded-2xl transition-all ${notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
              <BellRing size={20} />
            </button>
            <div className={`flex items-center gap-3 p-3 px-6 rounded-2xl shadow-sm border ${isAdmin ? 'bg-rose-50 border-rose-100' : 'bg-white border-emerald-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${isAdmin ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-400'}`}>{isAdmin ? <Unlock size={20} /> : <Lock size={20} />}</div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider ${isAdmin ? 'text-rose-700' : 'text-gray-700'}`}>{isAdmin ? 'অ্যাডমিন মোড' : 'ভিউ অনলি'}</p>
                <p className="text-[10px] text-gray-400 font-bold">{isAdmin ? 'লগআউট করতে ক্লিক করুন' : 'লগইন করতে ক্লিক করুন'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {renderView()}

        {/* Mobile Spacer to ensure content visibility above Bottom Nav */}
        <div className="h-24 md:hidden" />
      </main>

      <nav className="md:hidden mobile-bottom-nav bg-white border-t border-gray-100 flex justify-around items-center h-20 no-print px-2">
        {mobileNavItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id as ViewState)}
              className={`flex flex-col items-center justify-center flex-1 transition-all py-1 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-120' : 'hover:bg-gray-50'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-black mt-1.5 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-sm shadow-2xl relative">
            <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2"><XCircle size={28} /></button>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><Lock size={32} /></div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">অ্যাডমিন লগইন</h3>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">ইউজারনেম</label>
                 <input type="text" placeholder="username" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">পাসওয়ার্ড</label>
                 <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
              {loginError && <p className="text-rose-600 text-xs font-black text-center mt-2 flex items-center justify-center gap-1"><AlertTriangle size={14} /> {loginError}</p>}
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-lg mt-4">লগইন করুন</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;