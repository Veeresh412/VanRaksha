export const LANGUAGE_STORAGE_KEY = 'vanraksha.language'

export const supportedLanguageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'mr', label: 'Marathi (मराठी)' },
]

const fallbackLanguage = 'en'

function isSupportedLanguage(language) {
  return supportedLanguageOptions.some((option) => option.value === language)
}

export function normalizeLanguage(language) {
  return isSupportedLanguage(language) ? language : fallbackLanguage
}

export function getStoredLanguage() {
  if (typeof window === 'undefined') return fallbackLanguage

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return normalizeLanguage(storedLanguage)
}

export function setStoredLanguage(language) {
  const normalizedLanguage = normalizeLanguage(language)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage)
    window.dispatchEvent(
      new CustomEvent('vanraksha-language-change', {
        detail: { language: normalizedLanguage },
      }),
    )
  }

  return normalizedLanguage
}

const dictionary = {
  en: {
    'topbar.searchPlaceholder': 'Search by Flag ID, location or report',
    'topbar.notifications': 'Recent Notifications',
    'topbar.noNotifications': 'No new notifications.',
    'topbar.logout': 'Log Out',

    'sidebar.dashboard': 'Dashboard',
    'sidebar.jurisdictions': 'Jurisdictions',
    'sidebar.alertFlags': 'Alert Flags',
    'sidebar.satellitePings': 'Satellite Pings',
    'sidebar.citizenReports': 'Citizen Reports',
    'sidebar.accuracyTrend': 'Accuracy Trend',
    'sidebar.adminSettings': 'Admin Settings',
    'sidebar.usersRoles': 'Users & Roles',
    'sidebar.myJurisdiction': 'My Jurisdiction',

    'login.title': 'Dashboard Login',
    'login.subtitle': 'Phone + OTP secure sign in',
    'login.profileType': 'Profile Type',
    'login.phoneNumber': 'Phone Number',
    'login.enterOtp': 'Enter OTP',
    'login.sendOtp': 'Send OTP',
    'login.verifyLogin': 'Verify & Login',
    'login.changeDetails': 'Change phone or profile',

    'alerts.authenticity': 'Authenticity',
    'alerts.verified': 'Verified',
    'alerts.potentialAi': 'Potential AI',
    'alerts.verifiedNgo': 'Verified NGO Report',
    'alerts.speechToText': 'Transcribed via Speech-to-Text',
    'alerts.citizenFallback': 'Citizen-submitted observation is available for review.',
    'alerts.citizenNarrative': 'Citizen Narrative',

    'dashboard.longTermTitle': 'Long-Term Deforestation Trends',
    'dashboard.longTermSubtitle': 'Six-month trend view with forecast support',
    'dashboard.timelineTitle': 'Timeline Trend (Mar–Aug)',
    'dashboard.timelineNote': 'Visual placeholder for six-month forest trend monitoring.',
    'dashboard.hotZonesTitle': 'Predicted Hot Zones (ML Forecast)',
    'dashboard.vulnerability': 'Vulnerability Score',
  },
  hi: {
    'topbar.searchPlaceholder': 'फ्लैग आईडी, स्थान या रिपोर्ट से खोजें',
    'topbar.notifications': 'हाल की सूचनाएँ',
    'topbar.noNotifications': 'कोई नई सूचना नहीं।',
    'topbar.logout': 'लॉग आउट',

    'sidebar.dashboard': 'डैशबोर्ड',
    'sidebar.jurisdictions': 'क्षेत्राधिकार',
    'sidebar.alertFlags': 'अलर्ट फ़्लैग',
    'sidebar.satellitePings': 'सैटेलाइट पिंग्स',
    'sidebar.citizenReports': 'नागरिक रिपोर्ट',
    'sidebar.accuracyTrend': 'सटीकता प्रवृत्ति',
    'sidebar.adminSettings': 'एडमिन सेटिंग्स',
    'sidebar.usersRoles': 'उपयोगकर्ता और भूमिकाएँ',
    'sidebar.myJurisdiction': 'मेरा क्षेत्राधिकार',

    'login.title': 'डैशबोर्ड लॉगिन',
    'login.subtitle': 'फ़ोन + ओटीपी सुरक्षित साइन इन',
    'login.profileType': 'प्रोफ़ाइल प्रकार',
    'login.phoneNumber': 'फ़ोन नंबर',
    'login.enterOtp': 'ओटीपी दर्ज करें',
    'login.sendOtp': 'ओटीपी भेजें',
    'login.verifyLogin': 'सत्यापित करें और लॉगिन करें',
    'login.changeDetails': 'फ़ोन या प्रोफ़ाइल बदलें',

    'alerts.authenticity': 'प्रामाणिकता',
    'alerts.verified': 'सत्यापित',
    'alerts.potentialAi': 'संभावित एआई',
    'alerts.verifiedNgo': 'सत्यापित एनजीओ रिपोर्ट',
    'alerts.speechToText': 'स्पीच-टू-टेक्स्ट से लिप्यंतरण',
    'alerts.citizenFallback': 'नागरिक द्वारा भेजा गया अवलोकन समीक्षा हेतु उपलब्ध है।',
    'alerts.citizenNarrative': 'नागरिक विवरण',

    'dashboard.longTermTitle': 'दीर्घकालिक वनों की कटाई की प्रवृत्तियाँ',
    'dashboard.longTermSubtitle': 'पूर्वानुमान समर्थन के साथ छह-महीने का रुझान दृश्य',
    'dashboard.timelineTitle': 'समयरेखा रुझान (मार्च–अगस्त)',
    'dashboard.timelineNote': 'छह-महीने के वन रुझान निगरानी के लिए विज़ुअल प्लेसहोल्डर।',
    'dashboard.hotZonesTitle': 'पूर्वानुमानित हॉट ज़ोन (एमएल फोरकास्ट)',
    'dashboard.vulnerability': 'असंरक्षा स्कोर',
  },
  mr: {
    'topbar.searchPlaceholder': 'फ्लॅग आयडी, स्थान किंवा अहवालाने शोधा',
    'topbar.notifications': 'अलीकडील सूचना',
    'topbar.noNotifications': 'नवीन सूचना नाहीत.',
    'topbar.logout': 'लॉग आउट',

    'sidebar.dashboard': 'डॅशबोर्ड',
    'sidebar.jurisdictions': 'कार्यकक्षा',
    'sidebar.alertFlags': 'अलर्ट फ्लॅग्स',
    'sidebar.satellitePings': 'सॅटेलाइट पिंग्स',
    'sidebar.citizenReports': 'नागरिक अहवाल',
    'sidebar.accuracyTrend': 'अचूकता कल',
    'sidebar.adminSettings': 'अॅडमिन सेटिंग्ज',
    'sidebar.usersRoles': 'वापरकर्ते आणि भूमिका',
    'sidebar.myJurisdiction': 'माझी कार्यकक्षा',

    'login.title': 'डॅशबोर्ड लॉगिन',
    'login.subtitle': 'फोन + ओटीपी सुरक्षित साइन इन',
    'login.profileType': 'प्रोफाइल प्रकार',
    'login.phoneNumber': 'फोन नंबर',
    'login.enterOtp': 'ओटीपी प्रविष्ट करा',
    'login.sendOtp': 'ओटीपी पाठवा',
    'login.verifyLogin': 'पडताळा आणि लॉगिन',
    'login.changeDetails': 'फोन किंवा प्रोफाइल बदला',

    'alerts.authenticity': 'प्रामाणिकता',
    'alerts.verified': 'पडताळलेले',
    'alerts.potentialAi': 'संभाव्य एआय',
    'alerts.verifiedNgo': 'पडताळलेला एनजीओ अहवाल',
    'alerts.speechToText': 'स्पीच-टू-टेक्स्टद्वारे लिप्यंतरित',
    'alerts.citizenFallback': 'नागरिकाकडून सादर केलेले निरीक्षण पुनरावलोकनासाठी उपलब्ध आहे.',
    'alerts.citizenNarrative': 'नागरिक निवेदन',

    'dashboard.longTermTitle': 'दीर्घकालीन वनक्षय प्रवृत्ती',
    'dashboard.longTermSubtitle': 'अंदाज सहाय्यासह सहा महिन्यांचा कल दृश्य',
    'dashboard.timelineTitle': 'टाइमलाइन कल (मार्च–ऑगस्ट)',
    'dashboard.timelineNote': 'सहा महिन्यांच्या वन प्रवृत्ती निरीक्षणासाठी दृश्य प्लेसहोल्डर.',
    'dashboard.hotZonesTitle': 'अंदाजित हॉट झोन्स (एमएल फोरकास्ट)',
    'dashboard.vulnerability': 'असुरक्षितता स्कोर',
  },
}

export function translate(language, key) {
  const normalizedLanguage = normalizeLanguage(language)

  return (
    dictionary[normalizedLanguage]?.[key] ??
    dictionary[fallbackLanguage]?.[key] ??
    key
  )
}
