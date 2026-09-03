import React, { createContext, useContext, useState, useEffect } from 'react';
import { Staff, CocktailItem, TableLocation, Order, OrderStatus, AppNotification, FlairBartendingOrder, ChekiPhotoOrder } from '../types';
import { INITIAL_STAFF, INITIAL_COCKTAILS, INITIAL_TABLES, INITIAL_ORDERS } from '../data/initialData';
import { playOrderSuccessSound, playStatusUpdateSound } from '../utils/audio';
import { supabase } from '../lib/supabase';

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
  dbType: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [customerView, setCustomerView] = useState<'home' | 'bartending' | 'cheki' | 'orders_status'>('home');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const dbType = 'Supabase';

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
  // NORMALIZERS FOR ROBUST RUNTIME SAFETY
  // ==========================================
  const normalizeStaff = (s: any): Staff => {
    if (!s) return INITIAL_STAFF[0];
    
    // Support nested chekiServices or flat photoPrice columns
    const withoutSignPrice = s.chekiServices?.without_sign?.price ?? s.photoPriceWithoutSign ?? 80000;
    const withSignPrice = s.chekiServices?.with_sign?.price ?? s.photoPriceWithSign ?? 150000;
    const withArtSignPrice = s.chekiServices?.with_art_sign?.price ?? s.photoPriceWithArtSign ?? 300000;

    return {
      id: String(s.id || 'staff-' + Math.random().toString(36).substr(2, 6)),
      name: s.name || '店員',
      nickname: s.nickname || '',
      avatar: s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      title: s.title || '特調調酒師',
      bio: s.bio || '',
      status: (s.status === 'on_duty' || s.status === 'break' || s.status === 'off_duty') ? s.status : 'on_duty',
      flairSpecialty: s.flairSpecialty || '花式特調表演',
      flairSkillRating: typeof s.flairSkillRating === 'number' ? s.flairSkillRating : 5,
      centerAvailability: s.centerAvailability !== false,
      tags: Array.isArray(s.tags) ? s.tags : ['專業服務'],
      chekiServices: {
        without_sign: {
          available: s.chekiServices?.without_sign?.available !== false,
          price: withoutSignPrice,
          description: s.chekiServices?.without_sign?.description || '標準單人或合照拍立得一張，留存三月森夜美好時刻。',
          badge: s.chekiServices?.without_sign?.badge || '經典必拍'
        },
        with_sign: {
          available: s.chekiServices?.with_sign?.available !== false,
          price: withSignPrice,
          description: s.chekiServices?.with_sign?.description || '拍立得上親筆簽名、專屬署名與當日紀念日期。',
          badge: s.chekiServices?.with_sign?.badge || '超人氣'
        },
        with_art_sign: {
          available: s.chekiServices?.with_art_sign?.available !== false,
          price: withArtSignPrice,
          description: s.chekiServices?.with_art_sign?.description || '店員親手繪製特調圖騰、萌系愛心與專屬祝福寄語。',
          badge: s.chekiServices?.with_art_sign?.badge || '極致珍藏'
        }
      },
      totalCenterOrdersCount: Number(s.totalCenterOrdersCount || 0),
      totalChekiCount: Number(s.totalChekiCount || 0)
    };
  };

  const serializeStaffForSupabase = (staff: Staff) => ({
    id: staff.id,
    name: staff.name,
    nickname: staff.nickname,
    title: staff.title,
    avatar: staff.avatar,
    status: staff.status,
    centerAvailability: staff.centerAvailability,
    flairSpecialty: staff.flairSpecialty,
    photoPriceWithoutSign: staff.chekiServices?.without_sign?.price ?? 80000,
    photoPriceWithSign: staff.chekiServices?.with_sign?.price ?? 150000,
    photoPriceWithArtSign: staff.chekiServices?.with_art_sign?.price ?? 300000,
    totalCenterOrdersCount: staff.totalCenterOrdersCount || 0,
    totalChekiCount: staff.totalChekiCount || 0
  });

  // ==========================================
  // REAL-TIME SUPABASE POSTGRESQL SYNCHRONIZATION
  // ==========================================

  // Helper to fetch all data from Supabase
  const loadInitialDataFromSupabase = async () => {
    try {
      // 1. Fetch Staff
      const { data: staffData, error: staffErr } = await supabase.from('staff').select('*');
      if (staffErr) {
        console.warn('Supabase staff fetch error (table may need creation):', staffErr.message);
      } else if (staffData && staffData.length > 0) {
        setStaffList(staffData.map(normalizeStaff));
      } else {
        // Auto-seed initial staff if table exists and is empty
        try {
          await supabase.from('staff').upsert(INITIAL_STAFF.map(serializeStaffForSupabase));
        } catch (e) {
          console.warn('Failed to seed initial staff:', e);
        }
      }

      // 2. Fetch Cocktails
      const { data: cocktailData, error: cocktailErr } = await supabase.from('cocktails').select('*');
      if (cocktailErr) {
        console.warn('Supabase cocktails fetch error:', cocktailErr.message);
      } else if (cocktailData && cocktailData.length > 0) {
        setCocktails(cocktailData as CocktailItem[]);
      } else {
        try {
          await supabase.from('cocktails').upsert(INITIAL_COCKTAILS);
        } catch (e) {
          console.warn('Failed to seed initial cocktails:', e);
        }
      }

      // 3. Fetch Tables
      const { data: tableData, error: tableErr } = await supabase.from('tables').select('*');
      if (tableErr) {
        console.warn('Supabase tables fetch error:', tableErr.message);
      } else if (tableData && tableData.length > 0) {
        const sorted = (tableData as TableLocation[]).sort((a, b) => a.area.localeCompare(b.area) || a.code.localeCompare(b.code));
        setTables(sorted);
      } else {
        try {
          await supabase.from('tables').upsert(INITIAL_TABLES);
        } catch (e) {
          console.warn('Failed to seed initial tables:', e);
        }
      }

      // 4. Fetch Orders
      const { data: orderData, error: orderErr } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
      if (orderErr) {
        console.warn('Supabase orders fetch error:', orderErr.message);
      } else if (orderData) {
        setOrders(orderData as Order[]);
      }

      setIsOnline(true);
    } catch (err) {
      console.warn('Supabase connection or initialization error:', err);
    }
  };

  useEffect(() => {
    loadInitialDataFromSupabase();

    // Setup Supabase Realtime Subscriptions
    const channel = supabase
      .channel('schema-db-changes')
      // Listen to Orders
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders(prev => {
              if (prev.some(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setOrders(prev => prev.filter(o => o.id !== deletedId));
          }
        }
      )
      // Listen to Staff
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newStaff = normalizeStaff(payload.new);
            setStaffList(prev => [...prev.filter(s => s.id !== newStaff.id), newStaff]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = normalizeStaff(payload.new);
            setStaffList(prev => prev.map(s => s.id === updated.id ? updated : s));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setStaffList(prev => prev.filter(s => s.id !== deletedId));
          }
        }
      )
      // Listen to Cocktails
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cocktails' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as CocktailItem;
            setCocktails(prev => [...prev.filter(c => c.id !== updated.id), updated]);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setCocktails(prev => prev.filter(c => c.id !== deletedId));
          }
        }
      )
      // Listen to Tables
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as TableLocation;
            setTables(prev => {
              const filtered = prev.filter(t => t.id !== updated.id);
              return [...filtered, updated].sort((a, b) => a.area.localeCompare(b.area) || a.code.localeCompare(b.code));
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setTables(prev => prev.filter(t => t.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsOnline(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter orders for the current guest
  const myOrders = orders.filter(o => myOrderIds.includes(o.id));

  // ==========================================
  // ORDER ACTIONS (SUPABASE INTEGRATION)
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

    // Save to Supabase
    try {
      await supabase.from('orders').insert(newOrder);

      // Update staff performance count in Supabase
      const targetStaff = staffList.find(s => s.id === data.centerStaffId);
      if (targetStaff) {
        const newCount = (targetStaff.totalCenterOrdersCount || 0) + 1;
        await supabase.from('staff').update({ totalCenterOrdersCount: newCount }).eq('id', targetStaff.id);
      }
    } catch (err) {
      console.error('Failed to sync flair order to Supabase:', err);
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

    // Save to Supabase
    try {
      await supabase.from('orders').insert(newOrder);
      
      const targetStaff = staffList.find(s => s.id === data.staffId);
      if (targetStaff) {
        const newTotalCheki = (targetStaff.totalChekiCount || 0) + totalQty;
        await supabase.from('staff').update({ totalChekiCount: newTotalCheki }).eq('id', targetStaff.id);
      }
    } catch (err) {
      console.error('Failed to sync cheki order to Supabase:', err);
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
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
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

  // Staff Management (Supabase)
  const updateStaff = async (updated: Staff) => {
    try {
      await supabase.from('staff').upsert(serializeStaffForSupabase(updated));
    } catch (err) {
      console.error('Failed to update staff in Supabase:', err);
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
      await supabase.from('staff').insert(serializeStaffForSupabase(newStaff));
    } catch (err) {
      console.error('Failed to add staff to Supabase:', err);
    }
    setStaffList(prev => [...prev, newStaff]);
  };

  const deleteStaff = async (id: string) => {
    try {
      await supabase.from('staff').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete staff in Supabase:', err);
    }
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  // Cocktails Management (Supabase)
  const updateCocktail = async (item: CocktailItem) => {
    try {
      await supabase.from('cocktails').upsert(item);
    } catch (err) {
      console.error('Failed to update cocktail in Supabase:', err);
    }
    setCocktails(prev => prev.map(c => c.id === item.id ? item : c));
  };

  const addCocktail = async (item: Omit<CocktailItem, 'id'>) => {
    const newItem: CocktailItem = {
      ...item,
      id: 'cocktail-' + Date.now()
    };
    try {
      await supabase.from('cocktails').insert(newItem);
    } catch (err) {
      console.error('Failed to add cocktail in Supabase:', err);
    }
    setCocktails(prev => [...prev, newItem]);
  };

  const deleteCocktail = async (id: string) => {
    try {
      await supabase.from('cocktails').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete cocktail in Supabase:', err);
    }
    setCocktails(prev => prev.filter(c => c.id !== id));
  };

  // Tables Management (Supabase)
  const updateTable = async (table: TableLocation) => {
    try {
      await supabase.from('tables').upsert(table);
    } catch (err) {
      console.error('Failed to update table in Supabase:', err);
    }
    setTables(prev => prev.map(t => t.id === table.id ? table : t));
  };

  const addTable = async (table: Omit<TableLocation, 'id'>) => {
    const newTable: TableLocation = {
      ...table,
      id: 'loc-' + Date.now()
    };
    try {
      await supabase.from('tables').insert(newTable);
    } catch (err) {
      console.error('Failed to add table in Supabase:', err);
    }
    setTables(prev => [...prev, newTable]);
  };

  const deleteTable = async (id: string) => {
    try {
      await supabase.from('tables').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete table in Supabase:', err);
    }
    setTables(prev => prev.filter(t => t.id !== id));
  };

  // Single Order Deletion (Supabase)
  const deleteSingleOrder = async (orderId: string) => {
    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (err) {
      console.error('Failed to delete order in Supabase:', err);
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setMyOrderIds(prev => prev.filter(id => id !== orderId));
    if (lastPlacedOrder?.id === orderId) {
      setLastPlacedOrder(null);
    }
  };

  // Clear ALL Orders for Next Day Operation
  const clearAllOrders = async () => {
    try {
      // In Supabase, delete all rows from orders
      await supabase.from('orders').delete().neq('id', '0');
    } catch (err) {
      console.error('Failed to clear orders in Supabase:', err);
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

  // Reset System to Default (Supabase)
  const resetToDefaultData = async () => {
    try {
      // Clean existing
      await Promise.all([
        supabase.from('staff').delete().neq('id', '0'),
        supabase.from('cocktails').delete().neq('id', '0'),
        supabase.from('tables').delete().neq('id', '0'),
        supabase.from('orders').delete().neq('id', '0')
      ]);

      // Re-populate initial
      await Promise.all([
        supabase.from('staff').upsert(INITIAL_STAFF),
        supabase.from('cocktails').upsert(INITIAL_COCKTAILS),
        supabase.from('tables').upsert(INITIAL_TABLES),
        supabase.from('orders').upsert(INITIAL_ORDERS)
      ]);
    } catch (err) {
      console.error('Failed to batch reset Supabase:', err);
    }

    setStaffList(INITIAL_STAFF);
    setCocktails(INITIAL_COCKTAILS);
    setTables(INITIAL_TABLES);
    setOrders(INITIAL_ORDERS);
    setMyOrderIds([]);
    localStorage.removeItem('lounge_my_order_ids');

    addNotification({
      title: '雲端系統重設完成',
      message: '已將 Supabase 雲端資料庫之店員名單、調酒品項與示範訂單重置為官方預設值。',
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
        isOnline,
        dbType
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
