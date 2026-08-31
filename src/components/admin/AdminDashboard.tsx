import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wine, Camera, Users, Settings, Plus, Edit2, Trash2, CheckCircle2, 
  Clock, AlertCircle, Sparkles, TrendingUp, Flame, Heart, FileText, 
  RotateCcw, DollarSign, Layers, MapPin, Eye, Star, Moon, Download, Check, ShieldAlert 
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { Order, OrderStatus, Staff, TableLocation } from '../../types';
import { StaffModal } from './StaffModal';
import { OrderReceiptModal } from './OrderReceiptModal';

export const AdminDashboard: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    clearAllOrders,
    deleteSingleOrder,
    staffList,
    updateStaff,
    addStaff,
    deleteStaff,
    tables,
    addTable,
    updateTable,
    deleteTable,
    resetToDefaultData,
    setMode,
    setCustomerView
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'staff' | 'tables' | 'analytics'>('orders');
  
  // Orders filter
  const [serviceFilter, setServiceFilter] = useState<'all' | 'flair_bartending' | 'cheki_photo'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  // Modals state
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Daily Closing & Clear Orders Modal
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Export Daily CSV function
  const exportDailyReportCSV = () => {
    if (orders.length === 0) {
      alert('目前尚無訂單可供匯出！');
      return;
    }

    const headers = ['訂單編號', '下單時間', '服務類型', '席位/桌號', '客人暱稱', '指定店員/C位', '品項細節/主題', '訂單金額(Gil)', '狀態'];
    
    const rows = orders.map(o => {
      const isFlair = o.serviceType === 'flair_bartending';
      const timeStr = new Date(o.createdAt).toLocaleString();
      const serviceName = isFlair ? '花式調酒' : '拍立得攝影';
      const staffName = isFlair ? o.centerStaffName : o.staffName;
      const details = isFlair 
        ? `主題:${o.flairTheme} | ${o.cocktails.map(c => `${c.name}x${c.quantity}`).join(';')}`
        : o.items.map(it => `${it.name}x${it.quantity}`).join(';');
      const statusMap: Record<OrderStatus, string> = {
        pending: '待處理',
        preparing: '準備中',
        in_service: '服務中',
        completed: '已完成',
        cancelled: '已取消'
      };

      return [
        `"${o.orderNo}"`,
        `"${timeStr}"`,
        `"${serviceName}"`,
        `"${o.location}"`,
        `"${o.guestName || '未填寫'}"`,
        `"${staffName}"`,
        `"${details}"`,
        o.totalAmount,
        `"${statusMap[o.status] || o.status}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `三月森夜_營業營收報表_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New Table quick add
  const [newTableCode, setNewTableCode] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableArea, setNewTableArea] = useState<TableLocation['area']>('B1酒吧');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Computed Stats
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'in_service').length;
  const flairOrdersCount = orders.filter(o => o.serviceType === 'flair_bartending' && o.status !== 'cancelled').length;
  
  const totalChekiCount = orders
    .filter(o => o.serviceType === 'cheki_photo' && o.status !== 'cancelled')
    .reduce((sum, o) => {
      if (o.serviceType === 'cheki_photo') {
        return sum + o.items.reduce((s, i) => s + i.quantity, 0);
      }
      return sum;
    }, 0);

  // Filtered Orders
  const filteredOrders = orders.filter(order => {
    if (serviceFilter !== 'all' && order.serviceType !== serviceFilter) return false;
    if (statusFilter === 'active' && !(order.status === 'pending' || order.status === 'preparing' || order.status === 'in_service')) return false;
    if (statusFilter === 'pending' && order.status !== 'pending') return false;
    if (statusFilter === 'completed' && order.status !== 'completed') return false;
    return true;
  });

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim() || !newTableCode.trim()) return;
    addTable({
      code: newTableCode.trim(),
      name: newTableName.trim(),
      area: newTableArea,
      capacity: Number(newTableCapacity) || 2
    });
    setNewTableCode('');
    setNewTableName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
      
      {/* Ambient background glow */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-96 h-96 bg-[#5c7c99]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-blue-600/20 text-[#9cb7d1] border border-blue-500/30 text-[11px] font-bold uppercase tracking-widest">
              MARCH NIGHT • ADMIN CONTROL
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Firebase 雲端即時連線 (march-night)
            </span>
          </div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            三月森夜 MARCH NIGHT 服務與訂單管理後台
          </h1>
          <p className="text-xs text-[#9cb7d1] mt-1">
            花式調酒指定C位調度、拍立得攝影各項服務定價與現場即時接單看板
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              playClickSound();
              setIsClosingModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all flex items-center gap-2 cursor-pointer"
            title="打烊結算與清空今日訂單"
          >
            <Moon className="w-4 h-4 text-amber-400" />
            <span>打烊結算 / 清空訂單</span>
          </button>
          
          <button
            onClick={() => {
              playClickSound();
              setMode('customer');
              setCustomerView('home');
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] font-bold text-xs shadow-[0_0_20px_rgba(159,181,195,0.3)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Wine className="w-4 h-4" />
            <span>切換回客人前台</span>
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('確定要重設所有店員、菜單與訂單為系統初始預設值嗎？（這將會重設您新增的自訂店員）')) {
                resetToDefaultData();
              }
            }}
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/10 text-white/40 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
            title="重設全系統為預設值"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>今日營業實收總額</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif-luxury text-2xl font-black text-white mt-1.5 font-mono">
            {totalRevenue.toLocaleString()} Gil
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>調酒與拍立得服務營收</span>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>現場進行/待處理訂單</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-serif-luxury text-2xl font-black text-blue-300 mt-1.5">
            {activeOrdersCount} <span className="text-xs text-white/40 font-normal">筆進行中</span>
          </div>
          <div className="text-[11px] text-blue-300/80 mt-1">
            待出杯/前往桌邊服務
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>花式調酒表演場次</span>
            <Flame className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-serif-luxury text-2xl font-black text-white mt-1.5">
            {flairOrdersCount} <span className="text-xs text-white/40 font-normal">場表演</span>
          </div>
          <div className="text-[11px] text-white/40 mt-1">
            C位店員出秀紀錄
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between text-white/50 text-xs">
            <span>拍立得攝影銷售總量</span>
            <Camera className="w-4 h-4 text-[#9cb7d1]" />
          </div>
          <div className="font-serif-luxury text-2xl font-black text-[#9cb7d1] mt-1.5">
            {totalChekiCount} <span className="text-xs text-white/40 font-normal">張底片</span>
          </div>
          <div className="text-[11px] text-[#9cb7d1]/80 mt-1">
            無簽 / 有簽 / 簽繪
          </div>
        </div>
      </div>

      {/* Main Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-8 overflow-x-auto">
        <button
          onClick={() => { playClickSound(); setActiveTab('orders'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/40'
              : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/10'
          }`}
          id="tab-admin-orders"
        >
          <Clock className="w-4 h-4" />
          <span>即時訂單看板</span>
          {activeOrdersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#9FB5C3] text-[#0b0f17] text-[10px] font-black flex items-center justify-center">
              {activeOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('staff'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/40'
              : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/10'
          }`}
          id="tab-admin-staff"
        >
          <Users className="w-4 h-4" />
          <span>店員與C位排班 ({staffList.length})</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('tables'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tables'
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/40'
              : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/10'
          }`}
          id="tab-admin-tables"
        >
          <MapPin className="w-4 h-4" />
          <span>桌位區域管理 ({tables.length})</span>
        </button>

        <button
          onClick={() => { playClickSound(); setActiveTab('analytics'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/40'
              : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/10'
          }`}
          id="tab-admin-analytics"
        >
          <TrendingUp className="w-4 h-4" />
          <span>營運數據與人氣排行</span>
        </button>
      </div>

      {/* TAB 1: 即時訂單看板 (Live Orders) */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/50 font-semibold mr-1">服務類別:</span>
              <button
                onClick={() => setServiceFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  serviceFilter === 'all' ? 'bg-blue-600 text-white font-bold border border-blue-400/30' : 'text-white/50 hover:text-white'
                }`}
              >
                全部服務
              </button>
              <button
                onClick={() => setServiceFilter('flair_bartending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  serviceFilter === 'flair_bartending' ? 'bg-blue-600/30 text-blue-200 border border-blue-400/40 font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                <Wine className="w-3.5 h-3.5" />
                🍸 花式調酒
              </button>
              <button
                onClick={() => setServiceFilter('cheki_photo')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  serviceFilter === 'cheki_photo' ? 'bg-blue-600/30 text-blue-200 border border-blue-400/40 font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                📸 拍立得攝影
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/50 font-semibold mr-1">狀態篩選:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-blue-600 text-white font-bold border border-blue-400/30' : 'text-white/50 hover:text-white'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'active' ? 'bg-blue-600/30 text-blue-200 border border-blue-400/40 font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                進行中/待處理
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === 'completed' ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-400/40 font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                已完成
              </button>
            </div>
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center text-white/50 text-sm shadow-2xl">
              沒有符合條件的訂單記錄
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredOrders.map(order => {
                const isFlair = order.serviceType === 'flair_bartending';

                return (
                  <div
                    key={order.id}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-blue-500/30 transition-all"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-300 border border-blue-500/30">
                            {isFlair ? <Wine className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif-luxury font-bold text-white text-base">
                                {isFlair ? '花式調酒表演' : '拍立得攝影服務'}
                              </span>
                              <span className="text-xs font-mono text-white/40">#{order.orderNo}</span>
                            </div>
                            <div className="text-xs text-[#9cb7d1] font-medium mt-0.5">
                              📍 {order.location} • 角色ID：{order.guestName || '未填寫'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReceiptOrder(order);
                              setIsReceiptModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white/80 border border-white/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                            title="查看出單條"
                          >
                            <FileText className="w-4 h-4 text-white/50" />
                            <span className="text-[11px]">出單條</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`確定要刪除訂單 #${order.orderNo} 嗎？此操作將從雲端資料庫永久移除。`)) {
                                deleteSingleOrder(order.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-all cursor-pointer"
                            title="刪除此筆訂單"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Assigned Staff & Details */}
                      <div className="mt-4 bg-[#0b0f17] p-4 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between text-xs pb-2.5 border-b border-white/10">
                          <span className="text-white/50">指派服務人員:</span>
                          <span className="font-bold text-white flex items-center gap-1">
                            {isFlair ? (
                              <>
                                <Flame className="w-3.5 h-3.5 text-blue-400" />
                                {order.centerStaffName}
                              </>
                            ) : (
                              <>
                                <Camera className="w-3.5 h-3.5 text-blue-400" />
                                {order.staffName}
                              </>
                            )}
                          </span>
                        </div>

                        {isFlair ? (
                          <div className="mt-2.5 text-xs space-y-1.5">
                            <div className="text-white/50 flex justify-between">
                              <span>主題:</span>
                              <span className="text-white/80">{order.flairTheme}</span>
                            </div>
                            {order.cocktails.length > 0 && (
                              <div className="text-white/80 text-[11px] pt-1">
                                調酒: {order.cocktails.map(c => `${c.name} x${c.quantity}`).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2.5 text-xs space-y-1.5">
                            <div className="text-white/80 text-[11px]">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between py-0.5">
                                  <span>{it.name} x{it.quantity}</span>
                                  <span className="text-white/50 font-mono">{(it.price * it.quantity).toLocaleString()} Gil</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-between items-center text-xs">
                          <span className="text-white/40 font-mono">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-serif-luxury text-base font-black text-white font-mono">總計 {order.totalAmount.toLocaleString()} Gil</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Status Bar */}
                    <div className="mt-4 pt-3.5 border-t border-white/10">
                      <div className="text-[11px] text-white/50 mb-2 flex justify-between">
                        <span>目前狀態: <strong className="text-white">{order.status}</strong></span>
                        <span>切換進度：</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'pending')}
                          className={`py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            order.status === 'pending'
                              ? 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                              : 'bg-white/[0.03] text-white/50 hover:text-white border border-white/10'
                          }`}
                        >
                          待處理
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className={`py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            order.status === 'preparing'
                              ? 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                              : 'bg-white/[0.03] text-white/50 hover:text-white border border-white/10'
                          }`}
                        >
                          準備中
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'in_service')}
                          className={`py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            order.status === 'in_service'
                              ? 'bg-[#9FB5C3] text-[#0b0f17] font-black shadow-[0_0_12px_rgba(159,181,195,0.4)]'
                              : 'bg-white/[0.03] text-white/50 hover:text-white border border-white/10'
                          }`}
                        >
                          進行中
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className={`py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            order.status === 'completed'
                              ? 'bg-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(5,150,105,0.4)]'
                              : 'bg-white/[0.03] text-white/50 hover:text-white border border-white/10'
                          }`}
                        >
                          已完成
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 店員與C位排班 (Staff & Pricing) */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 sm:p-6 rounded-3xl shadow-2xl">
            <div>
              <h2 className="font-serif-luxury text-lg font-bold text-white">店員陣容與拍立得服務定價管理</h2>
              <p className="text-xs text-white/50 mt-1">
                可即時切換在班/休息狀態、開放花式調酒C位指定，以及設定個別店員的「無簽/有簽/簽繪」價格。
              </p>
            </div>
            <button
              onClick={() => {
                setEditingStaff(null);
                setIsStaffModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(37,99,235,0.3)] shrink-0 cursor-pointer"
              id="btn-add-staff"
            >
              <Plus className="w-4 h-4" />
              <span>新增店員</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {staffList.map(staff => (
              <div
                key={staff.id}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between hover:border-blue-500/30 transition-all"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={staff.avatar}
                        alt={staff.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-serif-luxury font-bold text-white text-base">{staff.name}</h3>
                          <span className="text-xs text-white/40">({staff.nickname})</span>
                        </div>
                        <div className="text-xs text-[#9cb7d1] font-medium truncate max-w-[140px]">{staff.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingStaff(staff);
                          setIsStaffModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="編輯店員"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`確定要刪除店員「${staff.name}」嗎？`)) {
                            deleteStaff(staff.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-950/40 text-white/40 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Toggle Bar */}
                  <div className="mt-4 flex items-center justify-between bg-[#0b0f17] p-2.5 rounded-2xl border border-white/10">
                    <span className="text-xs text-white/50 font-medium">排班狀態:</span>
                    <div className="flex items-center gap-1.5">
                      {(['on_duty', 'break', 'off_duty'] as const).map(st => (
                        <button
                          key={st}
                          onClick={() => updateStaff({ ...staff, status: st })}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                            staff.status === st
                              ? st === 'on_duty'
                                ? 'bg-emerald-500 text-black shadow-sm font-black'
                                : st === 'break'
                                ? 'bg-blue-400 text-black shadow-sm font-black'
                                : 'bg-white/20 text-white'
                              : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {st === 'on_duty' ? '在班' : st === 'break' ? '休息' : '下班'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flair C-Position Specialty */}
                  <div className="mt-3.5 bg-[#0b0f17] p-3 rounded-2xl border border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-blue-400" />
                        花式調酒 C 位:
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        staff.centerAvailability ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40' : 'bg-white/5 text-white/30'
                      }`}>
                        {staff.centerAvailability ? '開放指定' : '關閉'}
                      </span>
                    </div>
                    <p className="text-white/70 text-[11px] mt-1.5 line-clamp-1">
                      {staff.flairSpecialty}
                    </p>
                  </div>

                  {/* Cheki Services Pricing Grid */}
                  <div className="mt-3.5 bg-[#0b0f17] p-3 rounded-2xl border border-white/10">
                    <div className="text-[11px] text-[#9cb7d1] font-bold flex items-center gap-1 mb-2">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      拍立得 3 大項目定價:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/[0.02] p-2 rounded-xl border border-white/10">
                        <div className="text-[10px] text-white/40">無簽</div>
                        <div className="font-bold text-white mt-0.5">{staff.chekiServices.without_sign.price.toLocaleString()} Gil</div>
                      </div>
                      <div className="bg-white/[0.02] p-2 rounded-xl border border-white/10">
                        <div className="text-[10px] text-blue-300/70">有簽</div>
                        <div className="font-bold text-blue-200 mt-0.5">{staff.chekiServices.with_sign.price.toLocaleString()} Gil</div>
                      </div>
                      <div className="bg-white/[0.02] p-2 rounded-xl border border-white/10">
                        <div className="text-[10px] text-[#9cb7d1]/70">簽繪</div>
                        <div className="font-bold text-[#9cb7d1] mt-0.5">
                          {staff.chekiServices.with_art_sign.available ? `${staff.chekiServices.with_art_sign.price.toLocaleString()} Gil` : '未開'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                  <span>累計C位: {staff.totalCenterOrdersCount || 0} 次</span>
                  <span>累計拍立得: {staff.totalChekiCount || 0} 張</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 桌位與包廂區域管理 (Tables & Areas) */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {/* Quick Add Table Form */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <h2 className="font-serif-luxury text-lg font-bold text-white mb-4">新增桌位 / 吧檯席位 / VIP包廂</h2>
            <form onSubmit={handleAddTableSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5">桌位代碼</label>
                <input
                  type="text"
                  required
                  placeholder="例如：Bar-05, VIP-03"
                  value={newTableCode}
                  onChange={e => setNewTableCode(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-white/50 mb-1.5">桌位名稱說明</label>
                <input
                  type="text"
                  required
                  placeholder="例如：吧檯搖滾席 5號 / 皇家星空包廂"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5">區域分類</label>
                <select
                  value={newTableArea}
                  onChange={e => setNewTableArea(e.target.value as TableLocation['area'])}
                  className="w-full bg-[#0b0f17] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="B1酒吧">1. B1酒吧</option>
                  <option value="2F休息區">2. 2F休息區</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)] cursor-pointer"
                >
                  + 新增桌位
                </button>
              </div>
            </form>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map(table => (
              <div
                key={table.id}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif-luxury font-bold text-white text-base">{table.code}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#0b0f17] text-white/60 border border-white/10">
                      {table.area}
                    </span>
                  </div>
                  <div className="text-xs text-white/80 mt-1">{table.name}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">容納人數: {table.capacity} 人</div>
                </div>

                <button
                  onClick={() => deleteTable(table.id)}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-950/40 text-white/40 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
                  title="刪除桌位"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 營運數據與人氣排行 (Analytics) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Center Bartender Leaderboard */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/10">
                <Flame className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif-luxury font-bold text-white text-base">🔥 最受歡迎花式調酒 C 位排行榜</h3>
              </div>

              <div className="space-y-3">
                {[...staffList]
                  .sort((a, b) => (b.totalCenterOrdersCount || 0) - (a.totalCenterOrdersCount || 0))
                  .map((staff, idx) => (
                    <div
                      key={staff.id}
                      className="bg-[#0b0f17] p-3.5 rounded-2xl border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : idx === 1 ? 'bg-white/80 text-black' : idx === 2 ? 'bg-white/40 text-white' : 'bg-white/10 text-white/50'
                        }`}>
                          {idx + 1}
                        </span>
                        <img src={staff.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                        <div>
                          <div className="font-bold text-white text-xs">{staff.name} ({staff.nickname})</div>
                          <div className="text-[10px] text-white/50">{staff.flairSpecialty}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-serif-luxury text-sm font-black text-white">
                          {staff.totalCenterOrdersCount || 0} <span className="text-[10px] font-normal text-white/40">場</span>
                        </div>
                        <div className="text-[10px] text-white/40">C位總點單</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cheki Specialist Leaderboard */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/10">
                <Camera className="w-5 h-5 text-[#9cb7d1]" />
                <h3 className="font-serif-luxury font-bold text-white text-base">📸 拍立得攝影人氣排行 (累計張數)</h3>
              </div>

              <div className="space-y-3">
                {[...staffList]
                  .sort((a, b) => (b.totalChekiCount || 0) - (a.totalChekiCount || 0))
                  .map((staff, idx) => (
                    <div
                      key={staff.id}
                      className="bg-[#0b0f17] p-3.5 rounded-2xl border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-[#9FB5C3] text-[#0b0f17] shadow-[0_0_10px_rgba(159,181,195,0.4)]' : idx === 1 ? 'bg-white/80 text-black' : idx === 2 ? 'bg-white/40 text-white' : 'bg-white/10 text-white/50'
                        }`}>
                          {idx + 1}
                        </span>
                        <img src={staff.avatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
                        <div>
                          <div className="font-bold text-white text-xs">{staff.name} ({staff.nickname})</div>
                          <div className="text-[10px] text-[#9cb7d1]">
                            簽繪: {staff.chekiServices.with_art_sign.price.toLocaleString()} Gil / 有簽: {staff.chekiServices.with_sign.price.toLocaleString()} Gil
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-serif-luxury text-sm font-black text-[#9cb7d1]">
                          {staff.totalChekiCount || 0} <span className="text-[10px] font-normal text-white/40">張</span>
                        </div>
                        <div className="text-[10px] text-white/40">拍立得拍攝</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>

          {/* Cheki Service 3-tier Breakdown Summary */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <h3 className="font-serif-luxury font-bold text-white text-base mb-5">拍立得 3 大服務項目銷售分佈</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0b0f17] border border-white/10 p-5 rounded-2xl text-center">
                <div className="text-xs text-white/50 font-medium">拍立得 (無簽)</div>
                <div className="font-serif-luxury text-2xl font-black text-white mt-1.5 font-mono">
                  {orders.reduce((acc, o) => {
                    if (o.serviceType === 'cheki_photo') {
                      return acc + o.items.filter(i => i.type === 'without_sign').reduce((s, i) => s + i.quantity, 0);
                    }
                    return acc;
                  }, 0)} 張
                </div>
                <div className="text-[10px] text-white/40 mt-1">基本底片留念</div>
              </div>

              <div className="bg-[#0b0f17] border border-white/10 p-5 rounded-2xl text-center">
                <div className="text-xs text-blue-300 font-medium">拍立得 (有簽)</div>
                <div className="font-serif-luxury text-2xl font-black text-blue-200 mt-1.5 font-mono">
                  {orders.reduce((acc, o) => {
                    if (o.serviceType === 'cheki_photo') {
                      return acc + o.items.filter(i => i.type === 'with_sign').reduce((s, i) => s + i.quantity, 0);
                    }
                    return acc;
                  }, 0)} 張
                </div>
                <div className="text-[10px] text-blue-300/70 mt-1">親筆署名寄語</div>
              </div>

              <div className="bg-[#0b0f17] border border-white/10 p-5 rounded-2xl text-center">
                <div className="text-xs text-[#9cb7d1] font-medium">拍立得 (簽繪)</div>
                <div className="font-serif-luxury text-2xl font-black text-[#9cb7d1] mt-1.5 font-mono">
                  {orders.reduce((acc, o) => {
                    if (o.serviceType === 'cheki_photo') {
                      return acc + o.items.filter(i => i.type === 'with_art_sign').reduce((s, i) => s + i.quantity, 0);
                    }
                    return acc;
                  }, 0)} 張
                </div>
                <div className="text-[10px] text-[#9cb7d1]/70 mt-1">限量滿版手繪彩繪</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      <StaffModal
        staff={editingStaff}
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditingStaff(null);
        }}
        onSave={(data) => {
          if ('id' in data) {
            updateStaff(data as Staff);
          } else {
            addStaff(data);
          }
        }}
      />

      {/* Order Receipt Modal */}
      <OrderReceiptModal
        order={selectedReceiptOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceiptOrder(null);
        }}
        onUpdateStatus={(orderId, status) => {
          updateOrderStatus(orderId, status);
          if (selectedReceiptOrder && selectedReceiptOrder.id === orderId) {
            setSelectedReceiptOrder({ ...selectedReceiptOrder, status });
          }
        }}
      />

      {/* Daily Closing & Orders Reset Modal */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b0f17] border border-white/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-amber-950/40 via-blue-950/30 to-purple-950/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-lg text-white">
                    營業打烊結算 & 隔日清單重置
                  </h3>
                  <p className="text-xs text-white/50">
                    清空訂單歷史紀錄、歸零營收，為明日營業做準備
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClosingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body Content */}
            <div className="p-6 space-y-5">
              {/* Performance Stats Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                  <div className="text-xs text-white/50">今日營業總額</div>
                  <div className="font-serif-luxury text-xl font-black text-amber-300 font-mono mt-1">
                    {totalRevenue.toLocaleString()} Gil
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                  <div className="text-xs text-white/50">今日累積訂單</div>
                  <div className="font-serif-luxury text-xl font-black text-white font-mono mt-1">
                    {orders.length} 筆
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                  <div className="text-xs text-white/50">花式調酒表演</div>
                  <div className="font-serif-luxury text-lg font-bold text-blue-300 font-mono mt-1">
                    {flairOrdersCount} 場
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                  <div className="text-xs text-white/50">拍立得拍攝總數</div>
                  <div className="font-serif-luxury text-lg font-bold text-emerald-300 font-mono mt-1">
                    {totalChekiCount} 張
                  </div>
                </div>
              </div>

              {/* CSV Export Option */}
              <div className="bg-blue-600/10 border border-blue-500/25 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-blue-200 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>匯出今日營收報表 (CSV)</span>
                  </div>
                  <div className="text-[11px] text-[#9cb7d1]">
                    建議在清空前下載備份，以利對帳與歷史保存
                  </div>
                </div>
                <button
                  onClick={exportDailyReportCSV}
                  disabled={orders.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載報表</span>
                </button>
              </div>

              {/* Safe Note Alert */}
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-300/90">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>安全保留保證</strong>：清空只會清除訂單紀錄與今日金額，<strong>店員名單、自訂拍立得個人價格、調酒菜單與桌位資料將 100% 完整保留</strong>，不用重新建立！
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-white/[0.02] border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white/70 text-xs font-medium transition-colors cursor-pointer"
              >
                取消返回
              </button>
              <button
                type="button"
                disabled={isClearing || orders.length === 0}
                onClick={async () => {
                  if (window.confirm('確定要清空今日所有訂單紀錄嗎？營業額將歸零以迎接新的一天營業。')) {
                    setIsClearing(true);
                    try {
                      await clearAllOrders();
                      setIsClosingModalOpen(false);
                    } finally {
                      setIsClearing(false);
                    }
                  }
                }}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearing ? '正在清空雲端訂單...' : '確認清空今日訂單 (營業額歸零)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
