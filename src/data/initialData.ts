import { Staff, CocktailItem, TableLocation, Order } from '../types';

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff-1',
    name: '三月五日',
    nickname: 'March 5th',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    title: '首席火焰花式調酒師 / 店長',
    bio: '曾獲全國花式調酒大賽冠軍，擅長高難度瓶身拋接與空中烈焰點火表演，帶動全場氣氛頂點！',
    status: 'on_duty',
    flairSpecialty: '高空三瓶旋轉抛接 / 極光烈焰吞吐秀',
    flairSkillRating: 5,
    centerAvailability: true,
    tags: ['人氣冠軍', '火焰特技', '控場女王', '熱情開朗'],
    chekiServices: {
      without_sign: {
        available: true,
        price: 80000,
        description: '標準單人或合照拍立得一張，立即留存三月森夜美好時刻。',
        badge: '經典必拍'
      },
      with_sign: {
        available: true,
        price: 150000,
        description: '拍立得上親筆簽名、專屬署名與當日紀念日期。',
        badge: '超人氣'
      },
      with_art_sign: {
        available: true,
        price: 300000,
        description: '店長親手繪製特調圖騰、萌系愛心與專屬祝福寄語（精緻滿版塗鴉）。',
        badge: '極致珍藏'
      }
    },
    totalCenterOrdersCount: 48,
    totalChekiCount: 132
  },
  {
    id: 'staff-2',
    name: '琉璃',
    nickname: 'Ruri',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    title: '甜心女僕調酒師 / 人氣看板娘',
    bio: '笑容最具感染力，特調調酒充滿粉嫩夢幻色彩，拍照姿勢指導超親切專業！',
    status: 'on_duty',
    flairSpecialty: '魔幻搖盪萌力特調 / 雙手霓虹瓶身秀',
    flairSkillRating: 4,
    centerAvailability: true,
    tags: ['甜美互動', '拍立得神手', '粉系特調', '萌系加持'],
    chekiServices: {
      without_sign: {
        available: true,
        price: 80000,
        description: '拍立得合照一張，自然可愛定格。',
        badge: '快速留念'
      },
      with_sign: {
        available: true,
        price: 150000,
        description: '親筆簽名 + 專屬給你的暱稱 + 貼心悄悄話。',
        badge: '推薦'
      },
      with_art_sign: {
        available: true,
        price: 300000,
        description: '琉璃招牌手繪Q版貓咪與繁複閃亮彩繪裝飾，滿滿儀式感！',
        badge: '手繪神作'
      }
    },
    totalCenterOrdersCount: 39,
    totalChekiCount: 186
  },
  {
    id: 'staff-3',
    name: '影夜',
    nickname: 'Kageya',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    title: '極速紳士調酒師',
    bio: '俐落沉穩的調酒手法與低沉溫柔嗓音，在優雅中展現精準的花式搖壺與冰雕技巧。',
    status: 'on_duty',
    flairSpecialty: '流體力學超快節奏搖酒 / 水晶冰雕現場創作',
    flairSkillRating: 5,
    centerAvailability: true,
    tags: ['紳士沉穩', '極速花式', '水晶冰球', '氛圍感十足'],
    chekiServices: {
      without_sign: {
        available: true,
        price: 80000,
        description: '酷帥俐落的底片拍立得合照。',
      },
      with_sign: {
        available: true,
        price: 150000,
        description: '低調優雅的燙金風簽名與客製化紳士寄語。',
        badge: '經典'
      },
      with_art_sign: {
        available: true,
        price: 300000,
        description: '結合幾何線條與現代藝術感的手寫書法風簽繪。',
      }
    },
    totalCenterOrdersCount: 31,
    totalChekiCount: 94
  },
  {
    id: 'staff-4',
    name: '蜜雅',
    nickname: 'Miya',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    title: '藝術插畫系調酒師',
    bio: '美術系出身，簽繪設計無人能敵！調酒如同藝術品般層次分明，細膩唯美。',
    status: 'on_duty',
    flairSpecialty: '雙層漸層炫彩倒酒 / 乾冰霧氣視覺秀',
    flairSkillRating: 4,
    centerAvailability: true,
    tags: ['插畫繪師', '簽繪大師', '星空特調', '溫柔細膩'],
    chekiServices: {
      without_sign: {
        available: true,
        price: 80000,
        description: '標準拍立得一張。',
      },
      with_sign: {
        available: true,
        price: 150000,
        description: '專屬藝術花體字簽名 + 日期。',
      },
      with_art_sign: {
        available: true,
        price: 300000,
        description: '【全店最高人氣簽繪】完全客製化手繪圖案、角色頭像與華麗邊框彩繪！',
        badge: '鎮店簽繪'
      }
    },
    totalCenterOrdersCount: 26,
    totalChekiCount: 215
  },
  {
    id: 'staff-5',
    name: '凱爾',
    nickname: 'Kyle',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    title: '狂野派對調酒師',
    bio: '重低音派對控，擅長連續Shot杯瀑布點火與多人狂歡互動，點燃現場尖叫！',
    status: 'break',
    flairSpecialty: '10連發火焰Shot瀑布 / 空中反手倒接',
    flairSkillRating: 4,
    centerAvailability: true,
    tags: ['派對狂人', 'Shot杯瀑布', '能量爆棚', '氣氛帶動'],
    chekiServices: {
      without_sign: {
        available: true,
        price: 80000,
        description: '熱血派對拍立得合照。',
      },
      with_sign: {
        available: true,
        price: 150000,
        description: '狂野手寫簽名 + 派對口號。',
      },
      with_art_sign: {
        available: false,
        price: 300000,
        description: '今日暫停提供手繪簽繪。',
      }
    },
    totalCenterOrdersCount: 22,
    totalChekiCount: 68
  }
];

export const INITIAL_COCKTAILS: CocktailItem[] = [
  {
    id: 'cocktail-1',
    name: '烈焰鳳凰特調',
    englishName: 'Blazing Phoenix Flair',
    price: 480,
    category: 'signature_flair',
    alcoholDegree: '22% ABV',
    description: '店員現場以百加得151烈酒進行火焰旋轉澆注，伴隨肉桂粉火花四射，香氣迷人。',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80',
    isFlairHighlight: true
  },
  {
    id: 'cocktail-2',
    name: '魔幻極光銀河',
    englishName: 'Aurora Galaxy Shaker',
    price: 420,
    category: 'signature_flair',
    alcoholDegree: '15% ABV',
    description: '加入食用閃粉與天然蝶豆花，在花式搖壺中展現如同北極星空般旋轉的璀璨光芒。',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
    isFlairHighlight: true
  },
  {
    id: 'cocktail-3',
    name: '煙燻黑夜教父',
    englishName: 'Smoked Godfather',
    price: 450,
    category: 'classic',
    alcoholDegree: '28% ABV',
    description: '蘇格蘭威士忌搭配杏仁甜酒，使用橡木桶木屑在現場罩盅點燃冷煙燻，醇厚深邃。',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&auto=format&fit=crop&q=80',
    isFlairHighlight: false
  },
  {
    id: 'cocktail-4',
    name: '粉紅夢幻泡泡',
    englishName: 'Pink Bubble Dream',
    price: 380,
    category: 'signature_flair',
    alcoholDegree: '12% ABV',
    description: '蜜桃甜酒與蔓越莓氣泡水，店員現場以芳香氣槍打出巨大可食用精油煙霧泡泡！',
    image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&auto=format&fit=crop&q=80',
    isFlairHighlight: true
  },
  {
    id: 'cocktail-5',
    name: '狂歡火焰Shot輪盤 (6入)',
    englishName: 'Flaming Shot Roulette x6',
    price: 680,
    category: 'shots',
    alcoholDegree: '35% ABV',
    description: '連續排開點火的特選Shot，搭配C位店員主持的驚喜轉盤派對互動！',
    image: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400&auto=format&fit=crop&q=80',
    isFlairHighlight: true
  },
  {
    id: 'cocktail-6',
    name: '無酒精星燦微光',
    englishName: 'Sparkling Stardust Mocktail',
    price: 320,
    category: 'non_alcoholic',
    alcoholDegree: '0% (無酒精)',
    description: '白葡萄果露、接骨木花糖漿與無酒精香檳，一樣享受璀璨高雅的桌邊調製儀式。',
    image: 'https://images.unsplash.com/photo-1587223081156-6107a64f0d24?w=400&auto=format&fit=crop&q=80',
    isFlairHighlight: false
  }
];

export const INITIAL_TABLES: TableLocation[] = [
  { id: 'loc-b1', code: '1', name: 'B1酒吧', area: 'B1酒吧', capacity: 30 },
  { id: 'loc-2f', code: '2', name: '2F休息區', area: '2F休息區', capacity: 20 },
];

export const FLAIR_THEMES = [
  {
    id: 'theme-fire',
    name: '極限烈焰與火花秀',
    badge: '最震撼',
    description: '調酒師現場噴火、點燃酒液並搭配香料火花，全場歡呼聚焦！'
  },
  {
    id: 'theme-speed',
    name: '雙人高空流體拋接秀',
    badge: '高技巧',
    description: '空中三瓶同時換手旋轉拋接，精準度百發百中。'
  },
  {
    id: 'theme-magic',
    name: '夢幻乾冰與變色魔術秀',
    badge: '打卡首選',
    description: '魔術調色與芳香乾冰白霧瀰漫，氛圍夢幻破表。'
  },
  {
    id: 'theme-gentle',
    name: '尊榮桌邊專屬斟酒互動',
    badge: '細緻尊享',
    description: '一對一溫柔桌邊調製，調酒師細心講解風味與故事。'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-101',
    orderNo: 'FL-20260829-01',
    serviceType: 'flair_bartending',
    guestCount: 4,
    location: '1. B1酒吧',
    centerStaffId: 'staff-1',
    centerStaffName: '三月五日 (March 5th)',
    centerStaffAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    flairTheme: '花式調酒',
    cocktails: [],
    guestName: '林先生',
    specialRequests: '朋友生日，希望能有祝賀歡呼！',
    status: 'in_service',
    createdAt: Date.now() - 1000 * 60 * 18,
    totalAmount: 400000
  },
  {
    id: 'order-102',
    orderNo: 'CK-20260829-02',
    serviceType: 'cheki_photo',
    staffId: 'staff-2',
    staffName: '琉璃 (Ruri)',
    staffAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    location: '2. 2F休息區',
    guestName: '小宇',
    items: [
      { type: 'with_art_sign', name: '拍立得(簽繪)', price: 300000, quantity: 1, poseRequest: '想要合比大愛心+畫一隻小黑貓' },
      { type: 'without_sign', name: '拍立得(無簽)', price: 80000, quantity: 2 }
    ],
    remarks: '請琉璃店員準備空檔時過來拍攝即可～',
    status: 'preparing',
    createdAt: Date.now() - 1000 * 60 * 8,
    totalAmount: 460000
  },
  {
    id: 'order-103',
    orderNo: 'CK-20260829-03',
    serviceType: 'cheki_photo',
    staffId: 'staff-4',
    staffName: '蜜雅 (Miya)',
    staffAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    location: '1. B1酒吧',
    guestName: '王總經理',
    items: [
      { type: 'with_sign', name: '拍立得(有簽)', price: 150000, quantity: 3, poseRequest: '公司聚餐紀念，祝業績長紅' },
      { type: 'with_art_sign', name: '拍立得(簽繪)', price: 300000, quantity: 1, poseRequest: '畫代表吉祥的幸運草' }
    ],
    remarks: '包廂內燈光較暗，麻煩帶補光燈',
    status: 'pending',
    createdAt: Date.now() - 1000 * 60 * 2,
    totalAmount: 750000
  }
];
