import React, { useState } from 'react';
import { TrashRecord, Member } from '../types';
import { Trash2, RotateCcw, AlertTriangle, Calendar, User, Banknote, ShoppingBag, XCircle, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { db, trashCol, subscriptionsCol, expensesCol, membersCol } from '../services/firebase';

interface TrashBinProps {
  trashRecords: TrashRecord[];
  members: Member[];
  isAdmin: boolean;
}

const TrashBin: React.FC<TrashBinProps> = ({ trashRecords, members, isAdmin }) => {
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getCollectionRef = (type: string) => {
    switch (type) {
      case 'subscription': return subscriptionsCol;
      case 'expense': return expensesCol;
      case 'member': return membersCol;
      default: return null;
    }
  };
  
  const handleRestore = async () => {
    if (!restoreConfirmId || !isAdmin) return;
    const record = trashRecords.find(r => r.id === restoreConfirmId);
    if (!record) return;

    setIsProcessing(true);
    try {
      const collectionRef = getCollectionRef(record.type);
      if (!collectionRef) throw new Error("Invalid record type");

      // Clean up data before restoring
      const dataToRestore = { ...record.data };
      delete dataToRestore.snapshotMemberName;
      delete dataToRestore.id; 

      await collectionRef.doc(record.originalId).set(dataToRestore);
      await db.collection("trash").doc(record.id).delete();
      setRestoreConfirmId(null);
    } catch (err) {
      alert('রিস্টোর করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteConfirmId || !isAdmin) return;
    
    setIsProcessing(true);
    try {
      await db.collection("trash").doc(deleteConfirmId).delete();
      setDeleteConfirmId(null);
    } catch (err) {
      alert('মুছে ফেলতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  const getMemberName = (memberId: string) => members.find(m => m.id === memberId)?.name;

  const getRecordTitle = (record: TrashRecord) => {
    if (record.type === 'subscription') {
      const liveName = getMemberName(record.data.memberId);
      const displayName = liveName || record.data.snapshotMemberName || 'মুছে ফেলা সদস্য';
      return `${displayName} (${record.data.month})`;
    } else if (record.type === 'expense') {
      return record.data.description;
    } else if (record.type === 'member') {
      return record.data.name; 
    }
    return 'অজানা রেকর্ড';
  };

  const getRecordAmount = (record: TrashRecord) => {
     if (record.type === 'member') return '---';
     return `৳${record.data.amount?.toLocaleString() || 0}`;
  };

  if (!isAdmin) {
    return (
       <div className="bg-white rounded-[2rem] p-8 text-center border-2 border-emerald-50 shadow-sm no-print mt-8">
           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
             <Lock size={32} />
           </div>
           <h2 className="text-xl font-black text-gray-800">অ্যাক্সেস সংরক্ষিত</h2>
           <p className="text-gray-500 mt-2">রিসাইকেল বিন ম্যানেজ করতে দয়া করে অ্যাডমিন হিসেবে লগইন করুন।</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-start gap-4 no-print">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-lg font-black text-amber-800">রিসাইকেল বিন (ডিলিটকৃত তথ্য)</h3>
          <p className="text-sm text-amber-700 font-medium">এখানে ডিলিট করা চাঁদা, খরচ এবং সদস্যের রেকর্ডগুলো জমা থাকে। আপনি চাইলে এগুলো রিস্টোর করতে পারেন অথবা চিরতরে মুছে ফেলতে পারেন।</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {trashRecords.length > 0 ? trashRecords.map(record => (
          <div key={record.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-md transition-all">
            <div className="flex items-center gap-5 flex-1">
              <div className={`p-4 rounded-2xl ${
                record.type === 'subscription' ? 'bg-emerald-50 text-emerald-600' : 
                record.type === 'expense' ? 'bg-rose-50 text-rose-600' : 
                'bg-blue-50 text-blue-600'
              }`}>
                {record.type === 'subscription' ? <Banknote size={24} /> : 
                 record.type === 'expense' ? <ShoppingBag size={24} /> : 
                 <User size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    record.type === 'subscription' ? 'bg-emerald-100 text-emerald-700' : 
                    record.type === 'expense' ? 'bg-rose-100 text-rose-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {record.type === 'subscription' ? 'চাঁদা আদায়' : 
                     record.type === 'expense' ? 'খরচ' : 
                     'সদস্য'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Calendar size={10} />
                    ডিলিট হয়েছে: {new Date(record.deletedAt).toLocaleString('bn-BD')}
                  </span>
                </div>
                <h4 className="text-lg font-black text-gray-800">
                  {getRecordTitle(record)}
                </h4>
                <p className="text-sm font-bold text-gray-500">পরিমাণ: {getRecordAmount(record)}</p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setRestoreConfirmId(record.id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
              >
                <RotateCcw size={18} />
                রিস্টোর
              </button>
              <button 
                onClick={() => setDeleteConfirmId(record.id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-700 px-6 py-3 rounded-2xl font-bold hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
              >
                <Trash2 size={18} />
                চিরতরে ডিলিট
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border-4 border-dashed border-gray-50">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-gray-200" />
             </div>
             <p className="text-gray-400 font-black uppercase tracking-widest text-sm">রিসাইকেল বিন বর্তমানে খালি</p>
          </div>
        )}
      </div>

      {/* --- RESTORE CONFIRMATION MODAL --- */}
      {restoreConfirmId && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500] animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <RotateCcw size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">ডাটা রিস্টোর করবেন?</h3>
              <p className="text-gray-500 font-medium text-sm mb-8">
                আপনি কি নিশ্চিত যে এই রেকর্ডটি পুনরায় মূল তালিকায় ফিরিয়ে আনতে চান?
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setRestoreConfirmId(null)} 
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-black text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> বাতিল
                </button>
                <button 
                  onClick={handleRestore}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {isProcessing ? 'রিস্টোর হচ্ছে...' : 'হ্যাঁ, রিস্টোর করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PERMANENT DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmId && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500] animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">চিরতরে মুছে ফেলতে চান?</h3>
              <p className="text-gray-500 font-medium text-sm mb-8">
                সতর্কতা: এটি আর কখনোই ফিরে পাওয়া যাবে না। আপনি কি নিশ্চিত?
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-black text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> বাতিল
                </button>
                <button 
                  onClick={handlePermanentDelete}
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black text-sm hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  {isProcessing ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashBin;