import React, { createContext, useContext, useState, useEffect } from 'react';
import { Staff, CocktailItem, TableLocation, Order, OrderStatus, AppNotification, FlairBartendingOrder, ChekiPhotoOrder } from '../types';
import { INITIAL_STAFF, INITIAL_COCKTAILS, INITIAL_TABLES, INITIAL_ORDERS } from '../data/initialData';
import { playOrderSuccessSound, playStatusUpdateSound } from '../utils/audio';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch,
  getDocs
} from 'firebase/firestore';

interface AppContextType {
  mode: 'customer' | 'admin';
  setMode: (mode: 'customer' | 'admin') => void;
  customerView: 'home' | 'bartending' | 'cheki' | 'orders_status';
  setCustomerView: (view: 'home' | 'bartending' | 'cheki' | 'orders_status') => void;
  
  // Data
  staffList: Staff[];
  cocktails: CocktailItem[];
  tables: TableLocation[];
  orders: Order[];
  myOrders: Order[]; // Orders specifically placed by this device/guest
  
  // Active Customer Session State
  guestLocation: string;
  setGuestLocation: (loc: string) => void;
  guestName: string;
  setGuestName: (name: string) => void;
  
  // Preselected Staff for direct navigation
  preselectedStaffId: string | null;
  setPreselectedStaffId: (id: string | null) => void;

  // Actions
  addFlairOrder: (data: {
    guestCount: number;
    location: string;
    centerStaffId: string;
    centerStaffName: string;
    centerStaffAvatar?: string;
    flairTheme: string;
    cocktails: Array<{ cocktailId: string; name: string; price: number; quantity: number; notes?: string }>;
    guestName?: string;
    specialRequests?: string;
    totalAmount: number;
  }) => Promise<FlairBartendingOrder>;

  addChekiOrder: (data: {
    staffId: string;
    staffName: string;
    staffAvatar?: string;
    location: string;
    guestName: string;
    items: Array<{ type: 'without_sign' | 'with_sign' | 'with_art_sign'; name: string; price: number; quantity: number; poseRequest?: string }>;
    remarks?: string;
    totalAmount: number;
  }) => Promise<ChekiPhotoOrder>;

  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  updateStaff: (staff: Staff) => Promise<void>;
  addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  
  updateCocktail: (item: CocktailItem) => Promise<void>;
  addCocktail: (item: Omit<CocktailItem, 'id'>) => Promise<void>;
  deleteCocktail: (id: string) => Promise<void>;

  updateTable: (table: TableLocation) => Promise<void>;
  addTable: (table: Omit<TableLocation, 'id'>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;

  clearAllOrders: () => Promise<void>;
  deleteSingleOrder: (orderId: string) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  lastPlacedOrder: Order | null;
  setLastPlacedOrder: (order: Order | null) => void;
  
  notifications: AppNotification[];
  dismissNotification: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Sync status
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [customerView, setCustomerView] = useState<'home' | 'bartending' | 'cheki' | 'orders_status'>('home');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // My Order IDs saved locally for guest privacy tracking
  const [myOrderIds, setMyOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lounge_my_order_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lounge_my_order_ids', JSON.stringify(myOrderIds));
  }, [myOrderIds]);

  // Main State
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [cocktails, setCocktails] = useState<CocktailItem[]>(INITIAL_COCKTAILS);
  const [tables, setTables] = useState<TableLocation[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>([]);

  // Active Customer Session State
  const [guestLocation, setGuestLocation] = useState<string>(() => {
    const saved = localStorage.getItem('lounge_guest_loc');
    if (saved && (saved.includes('B1') || saved.includes('2F'))) {
      return saved;
    }
    return '1. B1酒吧';
  });

  const [guestName, setGuestName] = useState<string>(() => {
    return localStorage.getItem('lounge_guest_name') || '';
  });

  const [preselectedStaffId, setPreselectedStaffId] = useState<string | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    localStorage.setItem('lounge_guest_loc', guestLocation);
  }, [guestLocation]);

  useEffect(() => {
    localStorage.setItem('lounge_guest_name', guestName);
  }, [guestName]);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now()
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 8)]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ==========================================
  // REAL-TIME FIRESTORE SYNCHRONIZATION
  // ==========================================

  // 1. Subscribe to Staff List
  useEffect(() => {
    const staffRef = collection(db, 'staff');
    const unsubscribe = onSnapshot(staffRef, (snapshot) => {
      if (snapshot.empty) {
        // Initialize Firestore with default staff if empty
        const batch = writeBatch(db);
        INITIAL_STAFF.forEach(staff => {
          batch.set(doc(db, 'staff', staff.id), staff);
        });
        batch.commit().catch(console.error);
        setStaffList(INITIAL_STAFF);
      } else {
        const loadedStaff: Staff[] = [];
        snapshot.forEach(docSnap => {
          loadedStaff.push(docSnap.data() as Staff);
        });
        setStaffList(loadedStaff);
      }
    }, (error) => {
      console.warn('Firestore staff subscription fallback to local:', error);
      setIsOnline(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Cocktails
  useEffect(() => {
    const cocktailsRef = collection(db, 'cocktails');
    const unsubscribe = onSnapshot(cocktailsRef, (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_COCKTAILS.forEach(item => {
          batch.set(doc(db, 'cocktails', item.id), item);
        });
        batch.commit().catch(console.error);
        setCocktails(INITIAL_COCKTAILS);
      } else {
        const loaded: CocktailItem[] = [];
        snapshot.forEach(docSnap => {
          loaded.push(docSnap.data() as CocktailItem);
        });
        setCocktails(loaded);
      }
    }, (error) => {
      console.warn('Firestore cocktails subscription fallback:', error);
    });

    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Tables
  useEffect(() => {
    const tablesRef = collection(db, 'tables');
    const unsubscribe = onSnapshot(tablesRef, (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_TABLES.forEach(table => {
          batch.set(doc(db, 'tables', table.id), table);
        });
        batch.commit().catch(console.error);
        setTables(INITIAL_TABLES);
      } else {
        const loaded: TableLocation[] = [];
        snapshot.forEach(docSnap => {
          loaded.push(docSnap.data() as TableLocation);
        });
        // Sort by area and code
        loaded.sort((a, b) => a.area.localeCompare(b.area) || a.code.localeCompare(b.code));
        setTables(loaded);
      }
    }, (error) => {
      console.warn('Firestore tables subscription fallback:', error);
    });

    return () => unsubscribe();
  }, []);

  // 4. Subscribe to Real-Time Orders
  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      if (snapshot.empty) {
        setOrders([]);
      } else {
        const loadedOrders: Order[] = [];
        snapshot.forEach(docSnap => {
          loadedOrders.push(docSnap.data() as Order);
        });
        setOrders(loadedOrders);
      }
    }, (error) => {
      console.warn('Firestore orders subscription fallback to local:', error);
      setIsOnline(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter orders for the current guest
  const myOrders = orders.filter(o => myOrderIds.includes(o.id));

  // ==========================================
  // ORDER ACTIONS (FIRESTORE CLOUD INTEGRATION)
  // ==========================================

  const addFlairOrder = async (data: {
    guestCount: number;
    location: string;
    centerStaffId: string;
    centerStaffName: string;
    centerStaffAvatar?: string;
    flairTheme: string;
    cocktails: Array<{ cocktailId: string; name: string; price: number; quantity: number; notes?: string }>;
    guestName?: string;
    specialRequests?: string;
    totalAmount: number;
  }): Promise<FlairBartendingOrder> => {
    const timestamp = Date.now();
    const orderNo = `FL-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: FlairBartendingOrder = {
      id: 'order-' + timestamp,
      orderNo,
      serviceType: 'flair_bartending',
      guestCount: data.guestCount,
      location: data.location,
      centerStaffId: data.centerStaffId,
      centerStaffName: data.centerStaffName,
      centerStaffAvatar: data.centerStaffAvatar,
      flairTheme: data.flairTheme,
      cocktails: data.cocktails,
      guestName: data.guestName || '未填寫',
      specialRequests: data.specialRequests,
      status: 'pending',
      createdAt: timestamp,
      totalAmount: data.totalAmount
    };

    // Save to Cloud Firestore
    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);
      
      // Update staff performance count in Firestore
      const targetStaff = staffList.find(s => s.id === data.centerStaffId);
      if (targetStaff) {
        await updateDoc(doc(db, 'staff', targetStaff.id), {
          totalCenterOrdersCount: (targetStaff.totalCenterOrdersCount || 0) + 1
        });
      }
    } catch (err) {
      console.error('Failed to sync flair order to Firestore:', err);
    }

    // Local state updates
    setOrders(prev => [newOrder, ...prev]);
    setMyOrderIds(prev => [newOrder.id, ...prev]);
    setLastPlacedOrder(newOrder);

    if (soundEnabled) playOrderSuccessSound();

    addNotification({
      title: '🍸 新花式調酒訂單',
      message: `${newOrder.location} • 指定C位：${newOrder.centerStaffName} (${newOrder.guestCount}位客)`,
      type: 'order_new',
      orderId: newOrder.id
    });

    return newOrder;
  };

  const addChekiOrder = async (data: {
    staffId: string;
    staffName: string;
    staffAvatar?: string;
    location: string;
    guestName: string;
    items: Array<{ type: 'without_sign' | 'with_sign' | 'with_art_sign'; name: string; price: number; quantity: number; poseRequest?: string }>;
    remarks?: string;
    totalAmount: number;
  }): Promise<ChekiPhotoOrder> => {
    const timestamp = Date.now();
    const orderNo = `CK-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: ChekiPhotoOrder = {
      id: 'order-' + timestamp,
      orderNo,
      serviceType: 'cheki_photo',
      staffId: data.staffId,
      staffName: data.staffName,
      staffAvatar: data.staffAvatar,
      location: data.location,
      guestName: data.guestName || '未填寫',
      items: data.items,
      remarks: data.remarks,
      status: 'pending',
      createdAt: timestamp,
      totalAmount: data.totalAmount
    };

    const totalQty = data.items.reduce((acc, i) => acc + i.quantity, 0);

    // Save to Cloud Firestore
    try {
      await setDoc(doc(db, 'orders', newOrder.id), newOrder);
      
      const targetStaff = staffList.find(s => s.id === data.staffId);
      if (targetStaff) {
        await updateDoc(doc(db, 'staff', targetStaff.id), {
          totalChekiCount: (targetStaff.totalChekiCount || 0) + totalQty
        });
      }
    } catch (err) {
      console.error('Failed to sync cheki order to Firestore:', err);
    }

    // Local state updates
    setOrders(prev => [newOrder, ...prev]);
    setMyOrderIds(prev => [newOrder.id, ...prev]);
    setLastPlacedOrder(newOrder);

    if (soundEnabled) playOrderSuccessSound();

    addNotification({
      title: '📸 新拍立得攝影訂單',
      message: `${newOrder.location} • 指定店員：${newOrder.staffName} (${totalQty}張拍立得)`,
      type: 'order_new',
      orderId: newOrder.id
    });

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (err) {
      console.error('Failed to update status in Firestore:', err);
    }

    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    }));

    if (soundEnabled) playStatusUpdateSound();

    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const statusNames: Record<OrderStatus, string> = {
        pending: '待處理',
        preparing: '準備前往 / 備料中',
        in_service: '服務進行中',
        completed: '已完成',
        cancelled: '已取消'
      };

      addNotification({
        title: '訂單狀態更新',
        message: `${targetOrder.orderNo} 狀態已變更為「${statusNames[newStatus]}」`,
        type: 'order_update',
        orderId
      });
    }
  };

  // Staff Management (Firestore)
  const updateStaff = async (updated: Staff) => {
    try {
      await setDoc(doc(db, 'staff', updated.id), updated);
    } catch (err) {
      console.error('Failed to update staff in Firestore:', err);
    }
    setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const addStaff = async (newStaffData: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...newStaffData,
      id: 'staff-' + Date.now(),
      totalCenterOrdersCount: 0,
      totalChekiCount: 0
    };
    try {
      await setDoc(doc(db, 'staff', newStaff.id), newStaff);
    } catch (err) {
      console.error('Failed to add staff to Firestore:', err);
    }
    setStaffList(prev => [...prev, newStaff]);
  };

  const deleteStaff = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (err) {
      console.error('Failed to delete staff in Firestore:', err);
    }
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  // Cocktails Management (Firestore)
  const updateCocktail = async (item: CocktailItem) => {
    try {
      await setDoc(doc(db, 'cocktails', item.id), item);
    } catch (err) {
      console.error('Failed to update cocktail in Firestore:', err);
    }
    setCocktails(prev => prev.map(c => c.id === item.id ? item : c));
  };

  const addCocktail = async (item: Omit<CocktailItem, 'id'>) => {
    const newItem: CocktailItem = {
      ...item,
      id: 'cocktail-' + Date.now()
    };
    try {
      await setDoc(doc(db, 'cocktails', newItem.id), newItem);
    } catch (err) {
      console.error('Failed to add cocktail in Firestore:', err);
    }
    setCocktails(prev => [...prev, newItem]);
  };

  const deleteCocktail = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cocktails', id));
    } catch (err) {
      console.error('Failed to delete cocktail in Firestore:', err);
    }
    setCocktails(prev => prev.filter(c => c.id !== id));
  };

  // Tables Management (Firestore)
  const updateTable = async (table: TableLocation) => {
    try {
      await setDoc(doc(db, 'tables', table.id), table);
    } catch (err) {
      console.error('Failed to update table in Firestore:', err);
    }
    setTables(prev => prev.map(t => t.id === table.id ? table : t));
  };

  const addTable = async (table: Omit<TableLocation, 'id'>) => {
    const newTable: TableLocation = {
      ...table,
      id: 'loc-' + Date.now()
    };
    try {
      await setDoc(doc(db, 'tables', newTable.id), newTable);
    } catch (err) {
      console.error('Failed to add table in Firestore:', err);
    }
    setTables(prev => [...prev, newTable]);
  };

  const deleteTable = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (err) {
      console.error('Failed to delete table in Firestore:', err);
    }
    setTables(prev => prev.filter(t => t.id !== id));
  };

  // Single Order Deletion (Firestore)
  const deleteSingleOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error('Failed to delete order in Firestore:', err);
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setMyOrderIds(prev => prev.filter(id => id !== orderId));
    if (lastPlacedOrder?.id === orderId) {
      setLastPlacedOrder(null);
    }
  };

  // Clear ALL Orders for Next Day Operation (Keeps staff, cocktails, tables safe!)
  const clearAllOrders = async () => {
    try {
      const orderSnap = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      orderSnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error('Failed to clear orders in Firestore:', err);
    }

    setOrders([]);
    setMyOrderIds([]);
    setLastPlacedOrder(null);
    localStorage.removeItem('lounge_my_order_ids');

    addNotification({
      title: '今日訂單已結清清空',
      message: '已清除所有歷史訂單，營業額歸零！店員名冊、自訂價格與菜單完整保留。',
      type: 'info'
    });
  };

  // Reset System to Default
  const resetToDefaultData = async () => {
    try {
      const batch = writeBatch(db);
      
      // Clean existing
      const [staffSnap, cocktailSnap, tableSnap, orderSnap] = await Promise.all([
        getDocs(collection(db, 'staff')),
        getDocs(collection(db, 'cocktails')),
        getDocs(collection(db, 'tables')),
        getDocs(collection(db, 'orders'))
      ]);

      staffSnap.forEach(d => batch.delete(d.ref));
      cocktailSnap.forEach(d => batch.delete(d.ref));
      tableSnap.forEach(d => batch.delete(d.ref));
      orderSnap.forEach(d => batch.delete(d.ref));

      // Re-populate initial
      INITIAL_STAFF.forEach(s => batch.set(doc(db, 'staff', s.id), s));
      INITIAL_COCKTAILS.forEach(c => batch.set(doc(db, 'cocktails', c.id), c));
      INITIAL_TABLES.forEach(t => batch.set(doc(db, 'tables', t.id), t));
      INITIAL_ORDERS.forEach(o => batch.set(doc(db, 'orders', o.id), o));

      await batch.commit();
    } catch (err) {
      console.error('Failed to batch reset Firestore:', err);
    }

    setStaffList(INITIAL_STAFF);
    setCocktails(INITIAL_COCKTAILS);
    setTables(INITIAL_TABLES);
    setOrders(INITIAL_ORDERS);
    setMyOrderIds([]);
    localStorage.removeItem('lounge_my_order_ids');

    addNotification({
      title: '雲端系統重設完成',
      message: '已將 Firestore 雲端資料庫之店員名單、調酒品項與示範訂單重置為官方預設值。',
      type: 'info'
    });
  };

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        customerView,
        setCustomerView,
        staffList,
        cocktails,
        tables,
        orders,
        myOrders,
        guestLocation,
        setGuestLocation,
        guestName,
        setGuestName,
        preselectedStaffId,
        setPreselectedStaffId,
        addFlairOrder,
        addChekiOrder,
        updateOrderStatus,
        updateStaff,
        addStaff,
        deleteStaff,
        updateCocktail,
        addCocktail,
        deleteCocktail,
        updateTable,
        addTable,
        deleteTable,
        clearAllOrders,
        deleteSingleOrder,
        resetToDefaultData,
        lastPlacedOrder,
        setLastPlacedOrder,
        notifications,
        dismissNotification,
        soundEnabled,
        setSoundEnabled,
        isOnline
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
