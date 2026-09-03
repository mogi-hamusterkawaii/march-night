import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wine, Camera, CheckCircle2, Clock, AlertCircle, Sparkles, 
  ArrowLeft, ChevronRight, UserCheck, Flame, RefreshCw, LayoutDashboard,
  MapPin, User, Check
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { Order, OrderStatus } from '../../types';

export const CustomerOrderStatusView: React.FC = () => {
  const { 
    myOrders,
    setCustomerView, 
    lastPlacedOrder, 
    setLastPlacedOrder 
  } = useApp();

  // If this device has placed orders, show myOrders; if lastPlacedOrder exists and is valid, fallback to it
  const validLastPlaced = (lastPlacedOrder && typeof lastPlacedOrder === 'object' && 'id' in lastPlacedOrder && lastPlacedOrder.id) ? lastPlacedOrder : null;
  const validMyOrders = Array.isArray(myOrders) ? myOrders.filter(o => o && typeof o === 'object' && o.id) : [];

  const displayOrders = validMyOrders.length > 0 
    ? validMyOrders 
    : (validLastPlaced ? [validLastPlaced] : []);

  const formatOrderDateTime = (timestamp: number) => {
    if (!timestamp) return '剛剛';
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3.5 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-200 font-bold text-xs flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            已接單 • 待排程
          </span>
        );
      case 'preparing':
        return (
          <span className="px-3.5 py-1.5 rounded-full bg-blue-600/30 border border-blue-400/50 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.25)]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-300" />
            準備中 • 前往桌邊
          </span>
        );
      case 'in_service':
        return (
          <span className="px-3.5 py-1.5 rounded-full bg-[#9FB5C3] border border-[#9FB5C3] text-[#0b0f17] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(159,181,195,0.4)]">
            <Sparkles className="w-3.5 h-3.5 text-[#0b0f17]" />
            現場服務中
          </span>
        );
      case 'completed':
        return (
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            服務已完成
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            已取消
          </span>
        );
      default:
        return null;
    }
  };

  const steps = [
    { key: 'pending', label: '接單確認', desc: '店員已接收需求' },
    { key: 'preparing', label: '備料前往', desc: '準備道具前往桌邊' },
    { key: 'in_service', label: '桌邊進行', desc: '現場表演 / 拍攝' },
    { key: 'completed', label: '服務完成', desc: '享受美好時光' }
  ];

  const getStepStatus = (orderStatus: OrderStatus, stepKey: string) => {
    const statusOrder = ['pending', 'preparing', 'in_service', 'completed'];
    const currentIndex = statusOrder.indexOf(orderStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (orderStatus === 'cancelled') return 'inactive';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => { playClickSound(); setCustomerView('home'); }}
            className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-white">
              訂單即時進度
            </h1>
            <p className="text-xs text-[#9cb7d1] mt-1">
              即時追蹤花式調酒表演安排與店員拍立得攝影狀態
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { playClickSound(); setCustomerView('home'); }}
            className="px-4 py-2.5 rounded-2xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] border border-[#9FB5C3]/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(159,181,195,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>加點其他服務</span>
          </button>
        </div>
      </div>

      {/* Just Placed Success Banner */}
      {validLastPlaced && (
        <div className="bg-gradient-to-r from-blue-600/20 via-blue-900/20 to-white/[0.02] backdrop-blur-xl border border-blue-500/50 rounded-3xl p-5 sm:p-6 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-400/40 uppercase tracking-wider">
                    點單成功
                  </span>
                  <span className="text-xs text-white/50 font-mono">#{validLastPlaced.orderNo}</span>
                </div>
                <h2 className="font-serif-luxury text-lg sm:text-xl font-bold text-white mt-1.5">
                  已收到您的{validLastPlaced.serviceType === 'flair_bartending' ? '花式調酒' : '拍立得攝影'}點單！
                </h2>
                <p className="text-xs text-[#9cb7d1] mt-1 leading-relaxed">
                  桌位：<span className="text-white font-bold">{validLastPlaced.location}</span> • 
                  店員已收到通知並為您排程中，請於座位稍候享受美好的夜晚。
                </p>
              </div>
            </div>

            <button
              onClick={() => setLastPlacedOrder(null)}
              className="text-white/40 hover:text-white text-xs p-1.5 cursor-pointer transition-colors rounded-lg bg-white/[0.03] hover:bg-white/10"
            >
              ✕ 關閉
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {displayOrders.length === 0 ? (
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-white/[0.05] text-white/40 mx-auto flex items-center justify-center mb-4 border border-white/10">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="font-serif-luxury text-lg font-bold text-white">尚無進行中的訂單</h3>
          <p className="text-xs text-[#9cb7d1] mt-1.5 max-w-sm mx-auto">
            您尚未在此裝置送出任何花式調酒或拍立得攝影訂單，歡迎返回首頁挑選心儀的服務！
          </p>
          <button
            onClick={() => { playClickSound(); setCustomerView('home'); }}
            className="mt-6 px-7 py-3 rounded-2xl bg-[#9FB5C3] text-[#0b0f17] font-bold text-xs shadow-[0_0_20px_rgba(159,181,195,0.3)] hover:bg-[#b0c4d1] cursor-pointer transition-all"
          >
            立即前往選購服務
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayOrders.map((order) => {
            if (!order || !order.id) return null;
            const isFlair = order.serviceType === 'flair_bartending';
            const cocktailsList = isFlair && 'cocktails' in order && Array.isArray(order.cocktails) ? order.cocktails : [];
            const itemsList = !isFlair && 'items' in order && Array.isArray(order.items) ? order.items : [];

            return (
              <div
                key={order.id}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl transition-all hover:border-white/20"
                id={`order-card-${order.id}`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                      {isFlair ? <Wine className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif-luxury font-extrabold text-white text-base">
                          {isFlair ? '🍸 花式調酒' : (
                            itemsList.length === 1 ? itemsList[0].name : '📸 拍立得'
                          )}
                        </span>
                        <span className="text-xs font-mono text-blue-300/70 bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-500/20">
                          #{order.orderNo || ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9cb7d1] mt-1">
                        <span className="flex items-center gap-1 text-white/80">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          桌位：<strong className="text-white">{order.location || '未指定'}</strong>
                        </span>
                        <span className="text-white/30">•</span>
                        <span>下單時間：{formatOrderDateTime(order.createdAt)}</span>
                        {order.guestName && (
                          <>
                            <span className="text-white/30">•</span>
                            <span className="flex items-center gap-1 text-white/70">
                              <User className="w-3 h-3 text-blue-400" />
                              角色ID：{order.guestName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-center">{getStatusBadge(order.status)}</div>
                </div>

                {/* 4-Step Interactive Progress Tracker */}
                {order.status !== 'cancelled' && (
                  <div className="my-6 px-1 sm:px-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {steps.map((step, idx) => {
                        const stepStatus = getStepStatus(order.status, step.key);
                        const isDone = stepStatus === 'completed';
                        const isCurrent = stepStatus === 'active';

                        return (
                          <div
                            key={step.key}
                            className={`relative rounded-2xl p-3 border transition-all ${
                              isCurrent
                                ? 'bg-blue-600/20 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.25)]'
                                : isDone
                                ? 'bg-white/[0.03] border-white/20'
                                : 'bg-black/20 border-white/5 opacity-40'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : isCurrent
                                  ? 'bg-blue-500 text-white animate-pulse'
                                  : 'bg-white/10 text-white/40'
                              }`}>
                                {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                              </div>
                              <span className={`text-xs font-bold ${isCurrent ? 'text-white' : isDone ? 'text-white/90' : 'text-white/50'}`}>
                                {step.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#9cb7d1] pl-7">
                              {step.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Order Details Body */}
                <div className="mt-4 bg-[#0b0f17] border border-white/10 rounded-2xl p-4 sm:p-5">
                  
                  {/* Assigned Staff Box */}
                  <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-white/10">
                    {isFlair ? (
                      <>
                        {'centerStaffAvatar' in order && order.centerStaffAvatar && (
                          <img src={order.centerStaffAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-blue-400/50 shadow-md" />
                        )}
                        <div>
                          <div className="text-[11px] text-[#9cb7d1] font-semibold flex items-center gap-1">
                            <Flame className="w-3 h-3 text-blue-400" />
                            指定 C 位調酒師
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">{'centerStaffName' in order ? order.centerStaffName : '店員'}</div>
                          <div className="text-xs text-blue-300/80">服務品項：花式調酒</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {'staffAvatar' in order && order.staffAvatar && (
                          <img src={order.staffAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-blue-400/50 shadow-md" />
                        )}
                        <div>
                          <div className="text-[11px] text-[#9cb7d1] font-semibold flex items-center gap-1">
                            <Camera className="w-3 h-3 text-blue-400" />
                            指定攝影店員
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">{'staffName' in order ? order.staffName : '店員'}</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    {isFlair ? (
                      <div>
                        <div className="text-xs font-semibold text-white/80 mb-2">服務品項：</div>
                        <div className="text-xs text-white/90 py-1.5 flex items-center justify-between">
                          <span className="font-bold text-white">花式調酒 ({order.guestCount} 位)</span>
                          <span className="text-white font-mono font-bold">{(order.totalAmount || 400000).toLocaleString()} Gil</span>
                        </div>
                        {order.specialRequests && (
                          <div className="mt-2 text-[11px] text-white/60 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                            <span className="text-white/40 mr-1">需求備註:</span>
                            {order.specialRequests}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs font-semibold text-white/80 mb-2">服務品項：</div>
                        {itemsList.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-white font-medium">
                              {it.name} <span className="text-blue-400 font-bold">x {it.quantity} 張</span>
                            </span>
                            <span className="text-white font-mono">{((it.price || 0) * it.quantity).toLocaleString()} Gil</span>
                          </div>
                        ))}
                        {order.remarks && (
                          <div className="mt-2 text-[11px] text-white/60 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                            <span className="text-white/40 mr-1">備註:</span>
                            {order.remarks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Total */}
                  <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/10">
                    <span className="text-xs text-white/50">訂單總額</span>
                    <span className="font-serif-luxury text-2xl font-black text-white">{(order.totalAmount || 0).toLocaleString()} Gil</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
