export type ServiceCategory = 'flair_bartending' | 'cheki_photo';

export type ChekiServiceType = 'without_sign' | 'with_sign' | 'with_art_sign';

export type OrderStatus = 'pending' | 'preparing' | 'in_service' | 'completed' | 'cancelled';

export interface ChekiOptionConfig {
  available: boolean;
  price: number;
  description: string;
  badge?: string;
}

export interface Staff {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  title: string;
  bio: string;
  status: 'on_duty' | 'break' | 'off_duty';
  flairSpecialty: string;
  flairSkillRating: number; // 1-5
  centerAvailability: boolean;
  tags: string[];
  chekiServices: {
    without_sign: ChekiOptionConfig;
    with_sign: ChekiOptionConfig;
    with_art_sign: ChekiOptionConfig;
  };
  totalCenterOrdersCount?: number;
  totalChekiCount?: number;
}

export interface CocktailItem {
  id: string;
  name: string;
  englishName: string;
  price: number;
  category: 'signature_flair' | 'classic' | 'shots' | 'non_alcoholic';
  alcoholDegree: string;
  description: string;
  image: string;
  isFlairHighlight: boolean;
}

export interface TableLocation {
  id: string;
  code: string;
  name: string;
  area: 'B1酒吧' | '2F休息區';
  capacity: number;
}

export interface FlairOrderItem {
  cocktailId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface FlairBartendingOrder {
  id: string;
  orderNo: string;
  serviceType: 'flair_bartending';
  guestCount: number;
  location: string;
  centerStaffId: string;
  centerStaffName: string;
  centerStaffAvatar?: string;
  flairTheme: string; // e.g. 焰火炫技特調秀 / 雙人魔幻搖盪秀 / 紳士抒情斟酒
  cocktails: FlairOrderItem[];
  guestName?: string;
  specialRequests?: string;
  status: OrderStatus;
  createdAt: number;
  totalAmount: number;
}

export interface ChekiOrderItem {
  type: ChekiServiceType;
  name: string;
  price: number;
  quantity: number;
  poseRequest?: string;
}

export interface ChekiPhotoOrder {
  id: string;
  orderNo: string;
  serviceType: 'cheki_photo';
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  location: string;
  guestName: string;
  items: ChekiOrderItem[];
  remarks?: string;
  status: OrderStatus;
  createdAt: number;
  totalAmount: number;
}

export type Order = FlairBartendingOrder | ChekiPhotoOrder;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_new' | 'order_update' | 'info';
  timestamp: number;
  orderId?: string;
}
