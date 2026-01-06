
import { Member, Subscription, Expense } from '../types';

export const initialMembers: Member[] = [
  {
    id: 'm1',
    name: 'মোঃ শফিক',
    houseName: 'বড় বাড়ী',
    mobile: '',
    photoUrl: 'https://picsum.photos/seed/shafiq/200',
    country: 'বাংলাদেশ',
    status: 'active'
  },
  {
    id: 'm2',
    name: 'মোঃ রুবেল',
    houseName: 'বড় বাড়ী',
    mobile: '',
    photoUrl: 'https://picsum.photos/seed/rubel/200',
    country: 'বাংলাদেশ',
    status: 'active'
  },
  {
    id: 'm3',
    name: 'মোঃ মামুন',
    houseName: 'হোসেন মেম্বার বাড়ী',
    mobile: '',
    photoUrl: 'https://picsum.photos/seed/mamun/200',
    country: 'বাংলাদেশ',
    status: 'active'
  }
];

export const initialSubscriptions: Subscription[] = [];

export const initialExpenses: Expense[] = [
  {
    id: 'e1',
    category: 'Biriyani',
    description: '২০২৫ এর প্রথম বিরিয়ানি বাজার',
    amount: 1500,
    date: '2025-12-08',
    items: [
      { id: 'i1', name: 'চাল ৫ কেজি', amount: 500 },
      { id: 'i2', name: 'মুরগির মাংস', amount: 800 },
      { id: 'i3', name: 'মসলাপাতি', amount: 200 }
    ]
  }
];
