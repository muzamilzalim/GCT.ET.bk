
export interface Attachment {
  data: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  translation?: string;
  lang?: string;
  attachments?: Attachment[];
  isImage?: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  TRANSLATING = 'TRANSLATING'
}

export interface UserProfile {
  name: string;
  city: string;
  address: string;
  email: string;
  institution: string;
  profilePic: string;
  idNumber: string;
}

export type Theme = 'dark' | 'light';
export type AppLang = 'English' | 'Urdu' | 'Hindi' | 'Punjabi' | 'Pashto' | 'Chinese';

export type PrimaryColor = 'blue' | 'purple' | 'green' | 'pink' | 'orange';

export const COLOR_THEMES: Record<PrimaryColor, { hex: string, shadow: string, text: string, border: string }> = {
  blue: { hex: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.5)', text: 'text-blue-400', border: 'border-blue-500/30' },
  purple: { hex: '#a855f7', shadow: 'rgba(168, 85, 247, 0.5)', text: 'text-purple-400', border: 'border-purple-500/30' },
  green: { hex: '#22c55e', shadow: 'rgba(34, 197, 94, 0.5)', text: 'text-green-400', border: 'border-green-500/30' },
  pink: { hex: '#ec4899', shadow: 'rgba(236, 72, 153, 0.5)', text: 'text-pink-400', border: 'border-pink-500/30' },
  orange: { hex: '#f97316', shadow: 'rgba(249, 115, 22, 0.5)', text: 'text-orange-400', border: 'border-orange-500/30' }
};

export const SUPPORTED_LANGUAGES: { code: AppLang, name: string }[] = [
  { code: 'English', name: 'English' },
  { code: 'Urdu', name: 'اردو' },
  { code: 'Hindi', name: 'हिन्दी' },
  { code: 'Punjabi', name: 'ਪੰਜਾਬੀ' },
  { code: 'Pashto', name: 'پښتو' },
  { code: 'Chinese', name: '中文' }
];

export const UI_TRANSLATIONS: Record<AppLang, any> = {
  English: {
    status: "SYSTEM CORE ONLINE",
    subStatus: "Electrical Technology AI Unit",
    inputHint: "Enter diagnostic query...",
    settings: "System Config",
    theme: "Chassis Skin",
    color: "Energy Core Color",
    lang: "Neural Interface Lang",
    created: "Created By Muzamil",
    profile: "Engineer Profile",
    idTitle: "IDENTITY SYNC",
    genId: "GENERATE ID",
    download: "EXTRACT DATA",
    rescan: "RE-INITIALIZE",
    address: "LOCATION",
    email: "CONTACT GMAIL",
    city: "CITY"
  },
  Urdu: {
    status: "سسٹم کور آن لائن",
    subStatus: "الیکٹریکل ٹیکنالوجی یونٹ",
    inputHint: "سوال درج کریں...",
    settings: "ترتیبات",
    theme: "تھیم",
    color: "توانائی کا رنگ",
    lang: "زبان",
    created: "Created By Muzamil",
    profile: "پروفائل",
    idTitle: "شناخت",
    genId: "کارڈ بنائیں",
    download: "ڈیٹا حاصل کریں",
    rescan: "دوبارہ شروع کریں",
    address: "پتہ",
    email: "ای میل",
    city: "شہر"
  },
  Hindi: {
    status: "सिस्टम ऑनलाइन",
    subStatus: "विद्युत प्रौद्योगिकी AI",
    inputHint: "प्रश्न पूछें...",
    settings: "सेटिंग्स",
    theme: "थीम",
    color: "ऊर्जा रंग",
    lang: "भाषा",
    created: "Created By Muzamil",
    profile: "प्रोफ़ाइल",
    idTitle: "पहचान",
    genId: "आईडी बनाएं",
    download: "डेटा निकालें",
    rescan: "री-स्कैन",
    address: "पता",
    email: "ईमेल",
    city: "शहर"
  },
  Punjabi: {
    status: "ਸਿਸਟਮ ਆਨਲਾਈਨ",
    subStatus: "ਇਲੈਕਟ੍ਰੀਕਲ AI ਯੂਨਿਟ",
    inputHint: "ਸਵਾਲ ਪੁੱਛੋ...",
    settings: "ਸੈਟਿੰਗਾਂ",
    theme: "ਥੀਮ",
    color: "ਰੰਗ",
    lang: "ਭਾਸ਼ਾ",
    created: "Created By Muzamil",
    profile: "ਪ੍ਰੋਫਾਈਲ",
    idTitle: "ਪਛਾਣ",
    genId: "ID ਬਣਾਓ",
    download: "ਡਾਊਨਲੋਡ",
    rescan: "ਰੀ-ਸਕੈਨ",
    address: "ਪਤਾ",
    email: "ਈਮੇਲ",
    city: "ਸ਼ਹਿਰ"
  },
  Pashto: {
    status: "سیسټم آن لاین",
    subStatus: "د برېښنا تیکنالوژۍ AI",
    inputHint: "پوښتنه وکړئ...",
    settings: "تنظیمات",
    theme: "تھیم",
    color: "رنګ",
    lang: "ژبه",
    created: "Created By Muzamil",
    profile: "پروفایل",
    idTitle: "پیژندنه",
    genId: "ID جوړ کړئ",
    download: "ډاونلوډ",
    rescan: "بیا سکین",
    address: "پته",
    email: "ایمیل",
    city: "ښار"
  },
  Chinese: {
    status: "系统核心在线",
    subStatus: "电气技术 AI 单元",
    inputHint: "输入诊断查询...",
    settings: "系统配置",
    theme: "底盘皮肤",
    color: "核心能量颜色",
    lang: "神经接口语言",
    created: "Muzamil 创建",
    profile: "工程师简介",
    idTitle: "身份同步",
    genId: "生成身份卡",
    download: "提取数据",
    rescan: "重新初始化",
    address: "位置",
    email: "联系邮箱",
    city: "城市"
  }
};

export const ELECTRICAL_TEMPLATES = [
  "What is electric current?",
  "Define Voltage and potential difference",
  "What is Power Factor and how to improve it?",
  "Importance of Earthing in electrical systems",
  "Explain the working of a Refrigerator",
  "Generate a diagram of a simple series circuit"
];
