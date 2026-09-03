import React from 'react';
import { Order, OrderStatus } from '../../types';
import { X, Printer, CheckCircle, Clock, Wine, Camera, MapPin, UserCheck, Flame } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface OrderReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  if (!isOpen || !order) return null;

  const isFlair = order.serviceType === 'flair_bartending';

  const formatOrderDateTime = (timestamp: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f17] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Visual Sheet */}
        <div className="bg-white text-neutral-900 p-6 rounded-2xl shadow-inner font-mono text-xs">
          
          <div className="text-center pb-3 border-b-2 border-dashed border-neutral-300">
            <h2 className="font-black text-base tracking-wider">三月森夜 MARCH NIGHT 出單條</h2>
            <div className="text-[10px] text-neutral-600 mt-0.5">VIP ORDER SLIP & RECEIPT</div>
            <div className="text-xs font-bold mt-1 text-neutral-800">#{order.orderNo}</div>
          </div>

          <div className="py-3 border-b border-dashed border-neutral-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">服務類型:</span>
              <span className="font-bold">{isFlair ? '🍸 花式調酒' : '📸 拍立得'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">所在桌位:</span>
              <span className="font-bold text-neutral-900">{order.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">角色ID:</span>
              <span className="font-bold">{order.guestName || '未填寫'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">出單時間:</span>
              <span className="font-mono font-medium">{formatOrderDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">指派服務人員:</span>
              <span className="font-bold text-blue-700">
                {isFlair ? order.centerStaffName : order.staffName}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="py-3 border-b-2 border-dashed border-neutral-300">
            <div className="font-bold mb-2 text-neutral-700">訂購品項明細：</div>
            {isFlair ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-900 font-black text-xs">
                  <span>花式調酒</span>
                  <span className="font-mono font-bold">{(order.totalAmount || 400000).toLocaleString()} Gil</span>
                </div>
                <div className="text-[11px] text-neutral-600">服務人數: {order.guestCount} 位</div>
                {order.specialRequests && (
                  <div className="mt-2 bg-neutral-100 p-2 rounded text-[11px] text-neutral-700">
                    備註需求: {order.specialRequests}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {order.items.map((it, i) => (
                  <div key={i} className="text-neutral-800">
                    <div className="flex justify-between font-semibold">
                      <span>{it.name} x {it.quantity}</span>
                      <span className="font-mono font-bold">{(it.price * it.quantity).toLocaleString()} Gil</span>
                    </div>
                    {it.poseRequest && (
                      <div className="text-[10px] text-blue-700">↳ 署名/手繪要求: {it.poseRequest}</div>
                    )}
                  </div>
                ))}
                {order.remarks && (
                  <div className="mt-2 bg-neutral-100 p-1.5 rounded text-[10px] text-neutral-700">
                    備註: {order.remarks}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between items-baseline pt-3 text-sm font-black">
            <span>應收總金額:</span>
            <span className="text-base text-neutral-900 font-mono">{order.totalAmount.toLocaleString()} Gil</span>
          </div>

          <div className="text-center text-[9px] text-neutral-400 mt-4">
            THANK YOU FOR CHOOSING OUR VIP SERVICE
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>變更訂單狀態：</span>
            <span className="font-bold text-blue-400">目前：{order.status}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                playClickSound();
                onUpdateStatus(order.id, 'preparing');
              }}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                order.status === 'preparing'
                  ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md shadow-blue-600/30'
                  : 'bg-[#070a10] text-white/60 border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              準備前往
            </button>
            <button
              onClick={() => {
                playClickSound();
                onUpdateStatus(order.id, 'in_service');
              }}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                order.status === 'in_service'
                  ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-md shadow-blue-500/30'
                  : 'bg-[#070a10] text-white/60 border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              進行中
            </button>
            <button
              onClick={() => {
                playClickSound();
                onUpdateStatus(order.id, 'completed');
              }}
              className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                order.status === 'completed'
                  ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md shadow-emerald-600/30'
                  : 'bg-[#070a10] text-white/60 border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              已完成
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white/80 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>列印此出單條</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
            >
              關閉
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

