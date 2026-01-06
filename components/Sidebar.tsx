
import React from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Receipt, 
  FileBarChart, 
  ShieldCheck,
  Trash2,
  LogIn,
  LogOut,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  balance: number;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, balance, isAdmin, onLogin, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={20} /> },
    { id: 'members', label: 'সদস্য তালিকা', icon: <Users size={20} /> },
    { id: 'collections', label: 'চাঁদা আদায়', icon: <Wallet size={20} /> },
    { id: 'defaulters', label: 'বকেয়া তালিকা', icon: <AlertCircle size={20} />, isSpecial: true },
    { id: 'expenses', label: 'খরচের হিসাব', icon: <Receipt size={20} /> },
    { id: 'reports', label: 'রিপোর্ট', icon: <FileBarChart size={20} /> },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'trash', label: 'রিসাইকেল বিন', icon: <Trash2 size={20} /> });
  }

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 h-screen sticky top-0 no-print flex flex-col overflow-y-auto">
      <div className="p-6 flex items-center gap-3 text-emerald-600">
        <ShieldCheck size={32} />
        <span className="font-bold text-xl tracking-tight">কালিপুর</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          const isSpecial = (item as any).isSpecial;

          let buttonClasses = `w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 `;
          
          if (isActive) {
            buttonClasses += isSpecial 
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 ring-2 ring-rose-500 ring-offset-1' 
              : 'bg-emerald-50 text-emerald-700';
          } else {
            buttonClasses += isSpecial
              ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
              : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600';
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewState)}
              className={buttonClasses}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
              {isSpecial && !isActive && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-3 border-t border-gray-100 mt-auto">
        <div className="bg-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-100">
          <p className="text-xs opacity-80 mb-1 font-bold uppercase tracking-wider">মোট ব্যালেন্স</p>
          <p className="text-xl font-black">৳ {balance.toLocaleString()}</p>
        </div>

        {isAdmin ? (
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100">
            <LogOut size={16} /> লগআউট
          </button>
        ) : (
          <button onClick={onLogin} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
            <LogIn size={16} /> অ্যাডমিন লগইন
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
