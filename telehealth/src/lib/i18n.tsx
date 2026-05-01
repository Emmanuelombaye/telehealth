import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "en" | "es" | "fr" | "ar" | "zh" | "pt";

export const LOCALES: { code: Locale; label: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "es", label: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "zh", label: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "pt", label: "Português", flag: "🇧🇷", dir: "ltr" },
];

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.home": "Home", "nav.book": "Book", "nav.chat": "Chat", "nav.records": "Records", "nav.profile": "Profile",
    "nav.dashboard": "Dashboard", "nav.patients": "Patients", "nav.schedule": "Schedule",
    "nav.messages": "Messages", "nav.consult": "Consultation", "nav.labs": "Lab Requests",
    "nav.users": "User Management", "nav.audit": "Audit Logs", "nav.settings": "Settings",
    "greeting.morning": "Good morning", "greeting.afternoon": "Good afternoon", "greeting.evening": "Good evening",
    "action.bookVisit": "Book Visit", "action.joinRoom": "Join Room", "action.viewAll": "View All",
    "action.startChat": "Start Chat", "action.orderRefills": "Order Refills",
    "label.heartRate": "Heart Rate", "label.bloodSugar": "Blood Sugar", "label.steps": "Steps", "label.sleep": "Sleep",
    "label.upcomingAppts": "Upcoming Appointments", "label.recentDocs": "Recent Documents",
    "label.prescriptions": "Prescriptions", "label.identityVerified": "Identity Verified",
    "label.needHelp": "Need Help?", "label.needHelpDesc": "Chat with our AI or connect with a nurse.",
    "landing.hero": "Healthcare Without Borders",
    "landing.sub": "Connect with world-class doctors instantly. Secure, private, available in 6 languages.",
    "landing.cta": "Get Started Free",
    "landing.stats.patients": "Active Patients", "landing.stats.doctors": "Certified Doctors",
    "landing.stats.countries": "Countries", "landing.stats.uptime": "Uptime",
    "portal.patient": "Patient Portal", "portal.doctor": "Doctor Portal", "portal.admin": "Admin Portal",
    "portal.patient.desc": "Manage your health, book appointments, and chat with doctors.",
    "portal.doctor.desc": "Access patient records, manage schedule, and conduct consultations.",
    "portal.admin.desc": "Oversee system operations, audit logs, and user management.",
    "back": "Back", "search": "Search...", "logout": "Logout", "darkMode": "Dark Mode", "language": "Language",
  },
  es: {
    "nav.home": "Inicio", "nav.book": "Reservar", "nav.chat": "Chat", "nav.records": "Historial", "nav.profile": "Perfil",
    "nav.dashboard": "Panel", "nav.patients": "Pacientes", "nav.schedule": "Horario",
    "nav.messages": "Mensajes", "nav.consult": "Consulta", "nav.labs": "Laboratorio",
    "nav.users": "Usuarios", "nav.audit": "Auditoría", "nav.settings": "Configuración",
    "greeting.morning": "Buenos días", "greeting.afternoon": "Buenas tardes", "greeting.evening": "Buenas noches",
    "action.bookVisit": "Reservar Visita", "action.joinRoom": "Unirse", "action.viewAll": "Ver Todo",
    "action.startChat": "Iniciar Chat", "action.orderRefills": "Pedir Recarga",
    "label.heartRate": "Frecuencia Cardíaca", "label.bloodSugar": "Glucosa", "label.steps": "Pasos", "label.sleep": "Sueño",
    "label.upcomingAppts": "Próximas Citas", "label.recentDocs": "Documentos Recientes",
    "label.prescriptions": "Recetas", "label.identityVerified": "Identidad Verificada",
    "label.needHelp": "¿Necesitas Ayuda?", "label.needHelpDesc": "Chatea con nuestra IA o conecta con una enfermera.",
    "landing.hero": "Salud Sin Fronteras", "landing.sub": "Conéctate con médicos de clase mundial al instante.",
    "landing.cta": "Comenzar Gratis",
    "landing.stats.patients": "Pacientes Activos", "landing.stats.doctors": "Médicos Certificados",
    "landing.stats.countries": "Países", "landing.stats.uptime": "Disponibilidad",
    "portal.patient": "Portal del Paciente", "portal.doctor": "Portal del Médico", "portal.admin": "Portal Admin",
    "portal.patient.desc": "Gestiona tu salud, reserva citas y chatea con médicos.",
    "portal.doctor.desc": "Accede a historiales, gestiona horarios y realiza consultas.",
    "portal.admin.desc": "Supervisa operaciones, registros de auditoría y usuarios.",
    "back": "Atrás", "search": "Buscar...", "logout": "Cerrar Sesión", "darkMode": "Modo Oscuro", "language": "Idioma",
  },
  fr: {
    "nav.home": "Accueil", "nav.book": "Réserver", "nav.chat": "Chat", "nav.records": "Dossiers", "nav.profile": "Profil",
    "nav.dashboard": "Tableau de bord", "nav.patients": "Patients", "nav.schedule": "Planning",
    "nav.messages": "Messages", "nav.consult": "Consultation", "nav.labs": "Laboratoire",
    "nav.users": "Utilisateurs", "nav.audit": "Audit", "nav.settings": "Paramètres",
    "greeting.morning": "Bonjour", "greeting.afternoon": "Bon après-midi", "greeting.evening": "Bonsoir",
    "action.bookVisit": "Réserver", "action.joinRoom": "Rejoindre", "action.viewAll": "Voir Tout",
    "action.startChat": "Démarrer Chat", "action.orderRefills": "Commander Recharges",
    "label.heartRate": "Fréquence Cardiaque", "label.bloodSugar": "Glycémie", "label.steps": "Pas", "label.sleep": "Sommeil",
    "label.upcomingAppts": "Prochains Rendez-vous", "label.recentDocs": "Documents Récents",
    "label.prescriptions": "Ordonnances", "label.identityVerified": "Identité Vérifiée",
    "label.needHelp": "Besoin d'aide?", "label.needHelpDesc": "Chattez avec notre IA ou connectez-vous à une infirmière.",
    "landing.hero": "La Santé Sans Frontières", "landing.sub": "Consultez des médecins de classe mondiale instantanément.",
    "landing.cta": "Commencer Gratuitement",
    "landing.stats.patients": "Patients Actifs", "landing.stats.doctors": "Médecins Certifiés",
    "landing.stats.countries": "Pays", "landing.stats.uptime": "Disponibilité",
    "portal.patient": "Portail Patient", "portal.doctor": "Portail Médecin", "portal.admin": "Portail Admin",
    "portal.patient.desc": "Gérez votre santé, prenez des rendez-vous et chattez avec des médecins.",
    "portal.doctor.desc": "Accédez aux dossiers, gérez votre planning et effectuez des consultations.",
    "portal.admin.desc": "Supervisez les opérations, les journaux d'audit et les utilisateurs.",
    "back": "Retour", "search": "Rechercher...", "logout": "Déconnexion", "darkMode": "Mode Sombre", "language": "Langue",
  },
  ar: {
    "nav.home": "الرئيسية", "nav.book": "حجز", "nav.chat": "محادثة", "nav.records": "السجلات", "nav.profile": "الملف",
    "nav.dashboard": "لوحة التحكم", "nav.patients": "المرضى", "nav.schedule": "الجدول",
    "nav.messages": "الرسائل", "nav.consult": "الاستشارة", "nav.labs": "المختبر",
    "nav.users": "المستخدمون", "nav.audit": "سجل التدقيق", "nav.settings": "الإعدادات",
    "greeting.morning": "صباح الخير", "greeting.afternoon": "مساء الخير", "greeting.evening": "مساء النور",
    "action.bookVisit": "حجز زيارة", "action.joinRoom": "انضم", "action.viewAll": "عرض الكل",
    "action.startChat": "بدء المحادثة", "action.orderRefills": "طلب إعادة تعبئة",
    "label.heartRate": "معدل ضربات القلب", "label.bloodSugar": "سكر الدم", "label.steps": "الخطوات", "label.sleep": "النوم",
    "label.upcomingAppts": "المواعيد القادمة", "label.recentDocs": "المستندات الأخيرة",
    "label.prescriptions": "الوصفات الطبية", "label.identityVerified": "الهوية موثقة",
    "label.needHelp": "تحتاج مساعدة؟", "label.needHelpDesc": "تحدث مع مساعدنا الذكي أو تواصل مع ممرضة.",
    "landing.hero": "الرعاية الصحية بلا حدود", "landing.sub": "تواصل مع أطباء عالميين على الفور.",
    "landing.cta": "ابدأ مجاناً",
    "landing.stats.patients": "مريض نشط", "landing.stats.doctors": "طبيب معتمد",
    "landing.stats.countries": "دولة", "landing.stats.uptime": "وقت التشغيل",
    "portal.patient": "بوابة المريض", "portal.doctor": "بوابة الطبيب", "portal.admin": "بوابة الإدارة",
    "portal.patient.desc": "أدر صحتك واحجز المواعيد وتحدث مع الأطباء.",
    "portal.doctor.desc": "الوصول إلى السجلات وإدارة الجدول وإجراء الاستشارات.",
    "portal.admin.desc": "الإشراف على العمليات وسجلات التدقيق وإدارة المستخدمين.",
    "back": "رجوع", "search": "بحث...", "logout": "تسجيل الخروج", "darkMode": "الوضع الداكن", "language": "اللغة",
  },
  zh: {
    "nav.home": "首页", "nav.book": "预约", "nav.chat": "聊天", "nav.records": "记录", "nav.profile": "个人",
    "nav.dashboard": "仪表板", "nav.patients": "患者", "nav.schedule": "日程",
    "nav.messages": "消息", "nav.consult": "会诊", "nav.labs": "实验室",
    "nav.users": "用户管理", "nav.audit": "审计日志", "nav.settings": "设置",
    "greeting.morning": "早上好", "greeting.afternoon": "下午好", "greeting.evening": "晚上好",
    "action.bookVisit": "预约就诊", "action.joinRoom": "加入", "action.viewAll": "查看全部",
    "action.startChat": "开始聊天", "action.orderRefills": "续药",
    "label.heartRate": "心率", "label.bloodSugar": "血糖", "label.steps": "步数", "label.sleep": "睡眠",
    "label.upcomingAppts": "即将到来的预约", "label.recentDocs": "最近文件",
    "label.prescriptions": "处方", "label.identityVerified": "身份已验证",
    "label.needHelp": "需要帮助？", "label.needHelpDesc": "与我们的AI助手聊天或联系护士。",
    "landing.hero": "无国界医疗", "landing.sub": "即时连接世界级医生。安全、私密、支持6种语言。",
    "landing.cta": "免费开始",
    "landing.stats.patients": "活跃患者", "landing.stats.doctors": "认证医生",
    "landing.stats.countries": "国家", "landing.stats.uptime": "正常运行时间",
    "portal.patient": "患者门户", "portal.doctor": "医生门户", "portal.admin": "管理门户",
    "portal.patient.desc": "管理您的健康、预约和与医生聊天。",
    "portal.doctor.desc": "访问患者记录、管理日程和进行会诊。",
    "portal.admin.desc": "监督系统操作、审计日志和用户管理。",
    "back": "返回", "search": "搜索...", "logout": "退出登录", "darkMode": "深色模式", "language": "语言",
  },
  pt: {
    "nav.home": "Início", "nav.book": "Agendar", "nav.chat": "Chat", "nav.records": "Registros", "nav.profile": "Perfil",
    "nav.dashboard": "Painel", "nav.patients": "Pacientes", "nav.schedule": "Agenda",
    "nav.messages": "Mensagens", "nav.consult": "Consulta", "nav.labs": "Laboratório",
    "nav.users": "Usuários", "nav.audit": "Auditoria", "nav.settings": "Configurações",
    "greeting.morning": "Bom dia", "greeting.afternoon": "Boa tarde", "greeting.evening": "Boa noite",
    "action.bookVisit": "Agendar Visita", "action.joinRoom": "Entrar", "action.viewAll": "Ver Tudo",
    "action.startChat": "Iniciar Chat", "action.orderRefills": "Pedir Recarga",
    "label.heartRate": "Frequência Cardíaca", "label.bloodSugar": "Glicemia", "label.steps": "Passos", "label.sleep": "Sono",
    "label.upcomingAppts": "Próximas Consultas", "label.recentDocs": "Documentos Recentes",
    "label.prescriptions": "Prescrições", "label.identityVerified": "Identidade Verificada",
    "label.needHelp": "Precisa de Ajuda?", "label.needHelpDesc": "Converse com nosso assistente IA ou conecte-se a uma enfermeira.",
    "landing.hero": "Saúde Sem Fronteiras", "landing.sub": "Conecte-se com médicos de classe mundial instantaneamente.",
    "landing.cta": "Começar Grátis",
    "landing.stats.patients": "Pacientes Ativos", "landing.stats.doctors": "Médicos Certificados",
    "landing.stats.countries": "Países", "landing.stats.uptime": "Disponibilidade",
    "portal.patient": "Portal do Paciente", "portal.doctor": "Portal do Médico", "portal.admin": "Portal Admin",
    "portal.patient.desc": "Gerencie sua saúde, agende consultas e converse com médicos.",
    "portal.doctor.desc": "Acesse prontuários, gerencie agenda e realize consultas.",
    "portal.admin.desc": "Supervisione operações, logs de auditoria e usuários.",
    "back": "Voltar", "search": "Pesquisar...", "logout": "Sair", "darkMode": "Modo Escuro", "language": "Idioma",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  locale: "en", setLocale: () => {}, t: (k) => k, dir: "ltr",
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem("bh-locale") as Locale;
      return saved && translations[saved] ? saved : "en";
    } catch { return "en"; }
  });

  const localeInfo = LOCALES.find(l => l.code === locale)!;

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("bh-locale", l); } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeInfo.dir;
  }, [locale, localeInfo.dir]);

  const t = (key: string) => translations[locale]?.[key] ?? translations.en[key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir: localeInfo.dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

export function getGreeting(t: (k: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t("greeting.morning");
  if (h < 17) return t("greeting.afternoon");
  return t("greeting.evening");
}
