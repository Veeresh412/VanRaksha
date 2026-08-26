/**
 * TEMPORARY demo data layer for frontend prototyping.
 * Replace service implementations with FastAPI calls — do NOT import this file from UI components.
 */

export const DEMO_LAYER_ENABLED = !import.meta.env.VITE_API_BASE_URL;

/** Shared demo password (min 8 chars for login validation). */
export const DEMO_PASSWORD = 'Demo@1234';

export const DEMO_USERS = [
  {
    id: 'demo-ravi',
    accountType: 'individual',
    name: 'Ravi Patil',
    email: 'ravi.patil@demo.local',
    password: DEMO_PASSWORD,
    phone: '9876501234',
    state: 'Maharashtra',
    district: 'Chandrapur',
    village: 'Ballarpur',
    verified: false,
    registeredAt: '2025-06-12T08:00:00.000Z',
    isDemo: true,
    trustStatus: {
      reporterTypeKey: 'communityMember',
      trustTier: 1,
      exifGpsVerified: false,
      registeredOrganization: false,
      verificationStatusKey: 'notAssessed',
      hintKey: 'communityTier2',
    },
  },
  {
    id: 'demo-meena',
    accountType: 'individual',
    name: 'Meena Sharma',
    email: 'meena.sharma@demo.local',
    password: DEMO_PASSWORD,
    phone: '9876505678',
    state: 'Maharashtra',
    district: 'Nagpur',
    village: 'Ramtek',
    verified: false,
    registeredAt: '2025-04-03T08:00:00.000Z',
    isDemo: true,
    trustStatus: {
      reporterTypeKey: 'communityMember',
      trustTier: 2,
      exifGpsVerified: true,
      registeredOrganization: false,
      verificationStatusKey: 'verified',
      hintKey: null,
    },
  },
  {
    id: 'demo-vanraksha-foundation',
    accountType: 'organization',
    name: 'VanRaksha Foundation',
    email: 'contact@vanraksha-foundation.demo',
    password: DEMO_PASSWORD,
    organizationId: 'VRF-2018-004',
    organizationType: 'ngo',
    phone: '9876512345',
    state: 'Maharashtra',
    district: 'Nagpur',
    address: 'Civil Lines, Nagpur',
    contactPersonName: 'Anita Deshmukh',
    verified: true,
    registeredAt: '2018-03-15T08:00:00.000Z',
    isDemo: true,
    trustStatus: {
      reporterTypeKey: 'ngoOrganization',
      trustTier: 3,
      exifGpsVerified: false,
      registeredOrganization: true,
      verificationStatusKey: 'verified',
      hintKey: null,
    },
  },
  {
    id: 'demo-green-earth',
    accountType: 'organization',
    name: 'Green Earth Collective',
    email: 'info@greenearth.demo',
    password: DEMO_PASSWORD,
    organizationId: 'GEC-2024-011',
    organizationType: 'ngo',
    phone: '9876523456',
    state: 'Maharashtra',
    district: 'Gadchiroli',
    address: 'Main Road, Gadchiroli',
    contactPersonName: 'Suresh Kulkarni',
    verified: false,
    registeredAt: '2024-11-20T08:00:00.000Z',
    isDemo: true,
    trustStatus: {
      reporterTypeKey: 'ngoOrganization',
      trustTier: null,
      exifGpsVerified: false,
      registeredOrganization: true,
      verificationStatusKey: 'pending',
      hintKey: 'orgVerification',
    },
  },
];

const DEMO_PHOTO = (name) => ({
  id: `photo-${name}`,
  name: `${name}.jpg`,
  url: null,
});

export const DEMO_REPORTS = [
  {
    id: 'VR-0047',
    userId: 'demo-meena',
    submitterName: 'Meena Sharma',
    reporterType: 'citizen',
    title: 'Potential vegetation loss',
    description: 'Potential vegetation loss',
    status: 'under_review',
    trustTier: 2,
    verificationStatus: 'verified',
    corroborationStatus: 'awaiting',
    latitude: 21.395742,
    longitude: 79.323456,
    locationSource: 'device_capture',
    submittedAt: '2025-08-10T09:15:00.000Z',
    isDemo: true,
    photos: [
      {
        ...DEMO_PHOTO('vegetation-loss-0047'),
        geoTagStatus: 'verified',
        authenticityStatus: 'verified',
      },
    ],
    videos: [],
    evidenceVerification: {
      geoTagStatus: 'verified',
      authenticityStatus: 'verified',
    },
  },
  {
    id: 'VR-0048',
    userId: 'demo-ravi',
    submitterName: 'Ravi Patil',
    reporterType: 'citizen',
    title: 'Possible forest encroachment',
    description: 'Possible forest encroachment',
    status: 'processing',
    trustTier: 1,
    verificationStatus: 'processing',
    corroborationStatus: 'awaiting',
    latitude: 19.961493,
    longitude: 79.296432,
    locationSource: 'device_capture',
    submittedAt: '2025-08-14T11:30:00.000Z',
    isDemo: true,
    photos: [
      {
        ...DEMO_PHOTO('encroachment-0048'),
        geoTagStatus: 'processing',
        authenticityStatus: 'processing',
      },
    ],
    videos: [],
    evidenceVerification: {
      geoTagStatus: 'processing',
      authenticityStatus: 'processing',
    },
  },
  {
    id: 'VR-0049',
    userId: 'demo-vanraksha-foundation',
    submitterName: 'VanRaksha Foundation',
    reporterType: 'organization',
    title: 'Unauthorized tree clearing',
    description: 'Unauthorized tree clearing',
    status: 'resolved',
    trustTier: 3,
    verificationStatus: 'verified',
    corroborationStatus: 'corroborated',
    latitude: 20.168562,
    longitude: 80.012345,
    locationSource: 'device_capture',
    submittedAt: '2025-07-22T07:45:00.000Z',
    isDemo: true,
    photos: [
      {
        ...DEMO_PHOTO('tree-clearing-0049'),
        geoTagStatus: 'verified',
        authenticityStatus: 'verified',
      },
    ],
    videos: [{ id: 'video-clearing-0049', name: 'clearing-site.mp4', url: null }],
    evidenceVerification: {
      geoTagStatus: 'verified',
      authenticityStatus: 'verified',
    },
  },
  {
    id: 'VR-0050',
    userId: 'demo-ravi',
    submitterName: 'Ravi Patil',
    reporterType: 'citizen',
    title: 'New construction near forest boundary',
    description: 'New construction near forest boundary',
    status: 'submitted',
    trustTier: 1,
    verificationStatus: 'pending',
    corroborationStatus: 'awaiting',
    latitude: 19.874321,
    longitude: 79.412876,
    locationSource: 'device_capture',
    submittedAt: '2025-08-18T16:20:00.000Z',
    isDemo: true,
    photos: [
      {
        ...DEMO_PHOTO('construction-0050'),
        geoTagStatus: 'pending',
        authenticityStatus: 'pending',
      },
    ],
    videos: [],
    evidenceVerification: {
      geoTagStatus: 'pending',
      authenticityStatus: 'pending',
    },
  },
  {
    id: 'VR-0051',
    userId: 'demo-meena',
    submitterName: 'Meena Sharma',
    reporterType: 'citizen',
    title: 'Possible vegetation clearing',
    description: 'Possible vegetation clearing',
    status: 'under_review',
    trustTier: 2,
    verificationStatus: 'verified',
    corroborationStatus: 'partial',
    latitude: 21.102345,
    longitude: 79.087654,
    locationSource: 'device_capture',
    submittedAt: '2025-08-05T13:10:00.000Z',
    isDemo: true,
    photos: [
      {
        ...DEMO_PHOTO('vegetation-clearing-0051'),
        geoTagStatus: 'verified',
        authenticityStatus: 'verified',
      },
    ],
    videos: [],
    evidenceVerification: {
      geoTagStatus: 'verified',
      authenticityStatus: 'verified',
    },
  },
  {
    id: 'VR-0052',
    userId: 'demo-green-earth',
    submitterName: 'Green Earth Collective',
    reporterType: 'organization',
    title: 'Suspected clearing near community forest patch',
    description: 'Suspected clearing near community forest patch',
    status: 'submitted',
    trustTier: null,
    verificationStatus: 'pending',
    corroborationStatus: 'awaiting',
    latitude: 20.045612,
    longitude: 80.018234,
    locationSource: 'device_capture',
    submittedAt: '2025-08-19T10:45:00.000Z',
    isDemo: true,
    photos: [
      {
        ...DEMO_PHOTO('clearing-0052'),
        geoTagStatus: 'pending',
        authenticityStatus: 'pending',
      },
    ],
    videos: [],
    evidenceVerification: {
      geoTagStatus: 'pending',
      authenticityStatus: 'pending',
    },
  },
];

/** Preset demo accounts for presenter quick-login (see Login page). */
export const DEMO_LOGIN_ACCOUNTS = [
  { userId: 'demo-ravi', labelKey: 'login.demoAccountTier1Ravi' },
  { userId: 'demo-vanraksha-foundation', labelKey: 'login.demoAccountTier3Ngo' },
];

export function getDemoUserById(userId) {
  return DEMO_USERS.find((user) => user.id === userId) ?? null;
}

export function findDemoUser(identifier, password) {
  const normalized = identifier.trim().toLowerCase();
  return DEMO_USERS.find(
    (user) =>
      (user.email?.toLowerCase() === normalized ||
        user.organizationId?.toLowerCase() === normalized) &&
      user.password === password
  );
}

export function findDemoUserByPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!digits) return null;
  return DEMO_USERS.find((user) => user.phone === digits) ?? null;
}

export function toDemoSessionUser(user) {
  const session = { ...user };
  delete session.password;
  return session;
}

export function getDemoReportsForUser(userId) {
  if (!userId) return [];
  return DEMO_REPORTS.filter((report) => report.userId === userId);
}

export function getDemoReportById(id) {
  return DEMO_REPORTS.find((report) => report.id === id) ?? null;
}

export function isDemoReport(id) {
  return DEMO_REPORTS.some((report) => report.id === id);
}
