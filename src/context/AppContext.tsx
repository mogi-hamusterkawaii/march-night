import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { Staff, CocktailItem, TableLocation, Order, OrderStatus, AppNotification, FlairBartendingOrder, ChekiPhotoOrder } from '../types';
import { INITIAL_STAFF, INITIAL_COCKTAILS, INITIAL_TABLES, INITIAL_ORDERS } from '../data/initialData';
import { playOrderSuccessSound, playStatusUpdateSound } from '../utils/audio';
import { supabase } from '../lib/supabase';

interface AppContextType {
  mode: 'customer' | 'admin';
  setMode: (mode: 'customer' | 'admin') => void;
  customerView: 'home' | 'bartending' | 'cheki' | 'orders_status';
  setCustomerView: (view: 'home' | 'bartending' | 'cheki' | 'orders_status') => void;
  
  // Auth Session & Admin Verification
  session: Session | null;
  isAdmin: boolean;
  adminLogout: () => Promise<void>;

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

// Unique Human-readable Order Number Generator
const generateOrderNumber = (prefix: 'FL' | 'CK'): string => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  const cryptoObj = typeof window !== 'undefined' ? (window.crypto || (window as any).msCrypto) : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(4);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < 4; i++) {
      rand += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 4; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `${prefix}-${month}${day}-${rand}`;
};

// UUID v4 Generator
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const isAdmin = !!session;

  const [mode, setModeState] = useState<'customer' | 'admin'>('customer');
  const [customerView, setCustomerView] = useState<'home' | 'bartending' | 'cheki' | 'orders_status'>('home');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const dbType = 'Supabase PostgreSQL';

  // Safe mode setter: guests cannot switch to admin without authenticated session
  const setMode = (newMode: 'customer' | 'admin') => {
    if (newMode === 'admin' && !session) {
      console.warn('Attempted to switch to admin without authenticated session.');
      return;
    }
    setModeState(newMode);
  };

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
  // NORMALIZERS FOR RUNTIME SAFETY
  // ==========================================
  const normalizeStaff = (s: any): Staff => {
    if (!s) return INITIAL_STAFF[0];
    
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
  // SUPABASE AUTH SESSION MANAGEMENT
  // ==========================================
  useEffect(() => {
    // 1. Check initial active session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.warn('Failed to retrieve Supabase auth session:', error.message);
      }
      setSession(initialSession);
      if (initialSession) {
        setModeState('admin');
      }
    });

    // 2. Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        setModeState('admin');
      } else {
        setModeState('customer');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const adminLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setModeState('customer');
      setCustomerView('home');
      addNotification({
        title: '已安全登出後台',
        message: '已結束 Supabase 管理員身分驗證，切換回訪客前台。',
        type: 'info'
      });
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // ==========================================
  // PUBLIC DATA LOADING (Staff, Cocktails, Tables)
  // ==========================================
  const loadPublicData = useCallback(async () => {
    try {
      // 1. Staff (Public read)
      const { data: staffData, error: staffErr } = await supabase.from('staff').select('*');
      if (staffErr) {
        console.warn('Supabase staff fetch error:', staffErr.message);
      } else if (staffData && staffData.length > 0) {
        setStaffList(staffData.map(normalizeStaff));
      }

      // 2. Cocktails (Public read)
      const { data: cocktailData, error: cocktailErr } = await supabase.from('cocktails').select('*');
      if (cocktailErr) {
        console.warn('Supabase cocktails fetch error:', cocktailErr.message);
      } else if (cocktailData && cocktailData.length > 0) {
        setCocktails(cocktailData as CocktailItem[]);
      }

      // 3. Tables (Public read)
      const { data: tableData, error: tableErr } = await supabase.from('tables').select('*');
      if (tableErr) {
        console.warn('Supabase tables fetch error:', tableErr.message);
      } else if (tableData && tableData.length > 0) {
        const sorted = (tableData as TableLocation[]).sort((a, b) => a.area.localeCompare(b.area) || a.code.localeCompare(b.code));
        setTables(sorted);
      }

      setIsOnline(true);
    } catch (err) {
      console.warn('Failed to load public data from Supabase:', err);
    }
  }, []);

  // ==========================================
  // SECURE ORDER LOADING
  // Admin: reads all orders
  // Guest: strictly reads only own orders via RPC or filtered query
  // ==========================================
  const loadOrdersData = useCallback(async () => {
    if (isAdmin) {
      // Authenticated Admin: Load all orders
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false });

      if (orderErr) {
        console.warn('Admin orders fetch error:', orderErr.message);
      } else if (orderData) {
        setOrders(orderData as Order[]);
      }
    } else {
      // Unauthenticated Guest: STRICT ISOLATION
      // If guest has placed no orders, do NOT perform unnecessary network fetch
      if (myOrderIds.length === 0) {
        setOrders([]);
        return;
      }

      // Try secure RPC function first
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('get_guest_orders_by_text', { order_ids: myOrderIds });

      if (!rpcErr && rpcData) {
        setOrders(rpcData as Order[]);
      } else {
        // Fallback to explicit ID filtering (never broad select(*))
        const { data: filteredData, error: fallbackErr } = await supabase
          .from('orders')
          .select('*')
          .in('id', myOrderIds)
          .order('createdAt', { ascending: false });

        if (fallbackErr) {
          console.warn('Guest orders fetch error:', fallbackErr.message);
        } else if (filteredData) {
          setOrders(filteredData as Order[]);
        }
      }
    }
  }, [isAdmin, myOrderIds]);

  // Trigger initial public data loading on mount
  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  // Reload orders whenever auth state or local orders change
  useEffect(() => {
    loadOrdersData();
  }, [loadOrdersData]);

  // ==========================================
  // SUPABASE REALTIME SUBSCRIPTIONS
  // - Public tables (staff, cocktails, tables) listen globally
  // - Orders:
  //   * Admin listens to all changes (*: INSERT, UPDATE, DELETE)
  //   * Guest ONLY listens to UPDATE events on their own orders
  // ==========================================
  useEffect(() => {
    const channelName = isAdmin ? 'admin-channel' : 'guest-channel';
    const channel = supabase.channel(channelName);

    // Public staff changes
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (payload) => {
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
    });

    // Public cocktails changes
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'cocktails' }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const updated = payload.new as CocktailItem;
        setCocktails(prev => [...prev.filter(c => c.id !== updated.id), updated]);
      } else if (payload.eventType === 'DELETE') {
        const deletedId = (payload.old as { id: string }).id;
        setCocktails(prev => prev.filter(c => c.id !== deletedId));
      }
    });

    // Public tables changes
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
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
    });

    if (isAdmin) {
      // ADMIN: Listen to all order events
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
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
      });
    } else {
      // GUEST: ONLY listen to UPDATE events on their own orders
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as Order;
        if (myOrderIds.includes(updated.id)) {
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
          if (soundEnabled) playStatusUpdateSound();
        }
      });
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsOnline(true);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, myOrderIds, soundEnabled]);

  // Derived: orders placed by this device
  const myOrders = orders.filter(o => myOrderIds.includes(o.id));

  // ==========================================
  // ORDER CREATION ACTIONS (STRICT ERROR HANDLING)
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
    const orderId = generateUUID();
    const orderNo = generateOrderNumber('FL');

    const newOrder: FlairBartendingOrder = {
      id: orderId,
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

    // 1. Insert into Supabase with STRICT error check
    const { error: insertErr } = await supabase.from('orders').insert(newOrder);
    if (insertErr) {
      console.error('Supabase flair order insert error:', insertErr);
      throw new Error(`訂單建立失敗：${insertErr.message || '資料庫寫入異常，請確認連線'}`);
    }

    // 2. Also insert order items if table exists (ignore if optional)
    try {
      if (data.cocktails && data.cocktails.length > 0) {
        const itemRows = data.cocktails.map(c => ({
          order_id: orderId,
          item_type: 'cocktail',
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          sub_details: c.notes || ''
        }));
        await supabase.from('order_items').insert(itemRows);
      }
    } catch (e) {
      // order_items is secondary; primary order succeeded
      console.warn('Non-fatal order_items insert error:', e);
    }

    // 3. Update staff center counter
    const targetStaff = staffList.find(s => s.id === data.centerStaffId);
    if (targetStaff) {
      const newCount = (targetStaff.totalCenterOrdersCount || 0) + 1;
      await supabase.from('staff').update({ totalCenterOrdersCount: newCount }).eq('id', targetStaff.id);
    }

    // 4. CONFIRMED SUCCESS: Update local state
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
    const orderId = generateUUID();
    const orderNo = generateOrderNumber('CK');

    const newOrder: ChekiPhotoOrder = {
      id: orderId,
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

    // 1. Insert into Supabase with STRICT error check
    const { error: insertErr } = await supabase.from('orders').insert(newOrder);
    if (insertErr) {
      console.error('Supabase cheki order insert error:', insertErr);
      throw new Error(`訂單建立失敗：${insertErr.message || '資料庫寫入異常，請確認連線'}`);
    }

    // 2. Also insert order items if table exists
    try {
      if (data.items && data.items.length > 0) {
        const itemRows = data.items.map(item => ({
          order_id: orderId,
          item_type: 'cheki',
          name: `${item.name} (${item.type === 'without_sign' ? '無簽' : item.type === 'with_sign' ? '親簽' : '繪簽'})`,
          price: item.price,
          quantity: item.quantity,
          sub_details: item.poseRequest || ''
        }));
        await supabase.from('order_items').insert(itemRows);
      }
    } catch (e) {
      console.warn('Non-fatal order_items insert error:', e);
    }

    // 3. Update staff cheki count
    const targetStaff = staffList.find(s => s.id === data.staffId);
    if (targetStaff) {
      const newTotalCheki = (targetStaff.totalChekiCount || 0) + totalQty;
      await supabase.from('staff').update({ totalChekiCount: newTotalCheki }).eq('id', targetStaff.id);
    }

    // 4. CONFIRMED SUCCESS: Update local state
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

  // ==========================================
  // ADMIN ACTIONS (STRICT ERROR HANDLING)
  // ==========================================

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      console.error('Failed to update status in Supabase:', error);
      throw new Error(`更新訂單狀態失敗：${error.message}`);
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

  // Staff Management
  const updateStaff = async (updated: Staff) => {
    const { error } = await supabase.from('staff').upsert(serializeStaffForSupabase(updated));
    if (error) {
      console.error('Failed to update staff in Supabase:', error);
      throw new Error(`更新店員資料失敗：${error.message}`);
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
    const { error } = await supabase.from('staff').insert(serializeStaffForSupabase(newStaff));
    if (error) {
      console.error('Failed to add staff to Supabase:', error);
      throw new Error(`新增店員失敗：${error.message}`);
    }
    setStaffList(prev => [...prev, newStaff]);
  };

  const deleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete staff in Supabase:', error);
      throw new Error(`刪除店員失敗：${error.message}`);
    }
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  // Cocktails Management
  const updateCocktail = async (item: CocktailItem) => {
    const { error } = await supabase.from('cocktails').upsert(item);
    if (error) {
      console.error('Failed to update cocktail in Supabase:', error);
      throw new Error(`更新調酒品項失敗：${error.message}`);
    }
    setCocktails(prev => prev.map(c => c.id === item.id ? item : c));
  };

  const addCocktail = async (item: Omit<CocktailItem, 'id'>) => {
    const newItem: CocktailItem = {
      ...item,
      id: 'cocktail-' + Date.now()
    };
    const { error } = await supabase.from('cocktails').insert(newItem);
    if (error) {
      console.error('Failed to add cocktail in Supabase:', error);
      throw new Error(`新增調酒品項失敗：${error.message}`);
    }
    setCocktails(prev => [...prev, newItem]);
  };

  const deleteCocktail = async (id: string) => {
    const { error } = await supabase.from('cocktails').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete cocktail in Supabase:', error);
      throw new Error(`刪除調酒品項失敗：${error.message}`);
    }
    setCocktails(prev => prev.filter(c => c.id !== id));
  };

  // Tables Management
  const updateTable = async (table: TableLocation) => {
    const { error } = await supabase.from('tables').upsert(table);
    if (error) {
      console.error('Failed to update table in Supabase:', error);
      throw new Error(`更新桌位資訊失敗：${error.message}`);
    }
    setTables(prev => prev.map(t => t.id === table.id ? table : t));
  };

  const addTable = async (table: Omit<TableLocation, 'id'>) => {
    const newTable: TableLocation = {
      ...table,
      id: 'loc-' + Date.now()
    };
    const { error } = await supabase.from('tables').insert(newTable);
    if (error) {
      console.error('Failed to add table in Supabase:', error);
      throw new Error(`新增桌位失敗：${error.message}`);
    }
    setTables(prev => [...prev, newTable]);
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete table in Supabase:', error);
      throw new Error(`刪除桌位失敗：${error.message}`);
    }
    setTables(prev => prev.filter(t => t.id !== id));
  };

  // Single Order Deletion
  const deleteSingleOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) {
      console.error('Failed to delete order in Supabase:', error);
      throw new Error(`刪除訂單失敗：${error.message}`);
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setMyOrderIds(prev => prev.filter(id => id !== orderId));
    if (lastPlacedOrder?.id === orderId) {
      setLastPlacedOrder(null);
    }
  };

  // Clear ALL Orders for Next Day Operation
  const clearAllOrders = async () => {
    // In PostgreSQL / Supabase, delete all rows
    const { error } = await supabase.from('orders').delete().neq('status', 'nonexistent_status_to_delete_all');
    if (error) {
      console.error('Failed to clear orders in Supabase:', error);
      throw new Error(`清空訂單失敗：${error.message}`);
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
      await Promise.all([
        supabase.from('staff').delete().neq('id', 'nonexistent'),
        supabase.from('cocktails').delete().neq('id', 'nonexistent'),
        supabase.from('tables').delete().neq('id', 'nonexistent'),
        supabase.from('orders').delete().neq('id', 'nonexistent')
      ]);

      await Promise.all([
        supabase.from('staff').upsert(INITIAL_STAFF.map(serializeStaffForSupabase)),
        supabase.from('cocktails').upsert(INITIAL_COCKTAILS),
        supabase.from('tables').upsert(INITIAL_TABLES),
        supabase.from('orders').upsert(INITIAL_ORDERS)
      ]);
    } catch (err: any) {
      console.error('Failed to batch reset Supabase:', err);
      throw new Error(`重設資料庫失敗：${err.message || '連線逾時'}`);
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
        session,
        isAdmin,
        adminLogout,
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
