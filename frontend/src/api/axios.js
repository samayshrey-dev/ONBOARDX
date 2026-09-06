import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fallback mock data generator for static Vercel deployment / offline backend
const handleMockFallback = (config) => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  console.warn(`[ONBOARDX Demo Mode] Serving simulated response for ${method.toUpperCase()} ${url}`);

  if (url.includes('auth/login/')) {
    let reqBody = {};
    try {
      reqBody = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    } catch (e) {
      reqBody = {};
    }

    const username = reqBody.username || 'partner_user';
    const isReviewer = username.toLowerCase().includes('review');
    const isAdmin = username.toLowerCase().includes('admin');

    const role = isAdmin ? 'ADMIN' : isReviewer ? 'REVIEWER' : 'PARTNER';
    const mockUser = {
      id: isAdmin ? 3 : isReviewer ? 2 : 1,
      username: username,
      email: isAdmin ? 'admin@onboardx.com' : isReviewer ? 'reviewer@onboardx.com' : 'partner@apexlogistics.in',
      role: role,
      first_name: isAdmin ? 'Vikram' : isReviewer ? 'Ananya' : 'Rajesh',
      last_name: isAdmin ? 'Deshmukh' : isReviewer ? 'Iyer' : 'Sharma',
      company_name: isAdmin ? 'ONBOARDX Enterprise Systems' : isReviewer ? 'ONBOARDX Compliance Hub' : 'Apex Logistics India Pvt Ltd',
      profile: {
        business_name: 'Apex Logistics India Pvt Ltd',
        phone: '+91 98765 43210',
        address: '702 Nariman Point, Mumbai, Maharashtra 400021',
        registration_number: 'GSTIN27AABCA1234F1ZM',
        website: 'https://apexlogistics.in'
      }
    };

    localStorage.setItem('demo_user', JSON.stringify(mockUser));
    return Promise.resolve({
      data: { access: 'demo_access_token', refresh: 'demo_refresh_token', user: mockUser },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    });
  }

  if (url.includes('auth/me/')) {
    const storedDemo = localStorage.getItem('demo_user');
    const user = storedDemo ? JSON.parse(storedDemo) : {
      id: 1,
      username: 'partner_user',
      email: 'partner@apexlogistics.in',
      role: 'PARTNER',
      first_name: 'Rajesh',
      last_name: 'Sharma',
      company_name: 'Apex Logistics India Pvt Ltd'
    };
    return Promise.resolve({ data: user, status: 200, statusText: 'OK', headers: {}, config });
  }

  if (url.includes('auth/register/')) {
    let reqData = {};
    try {
      reqData = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
    } catch (e) {
      reqData = {};
    }

    const newUser = {
      id: Date.now(),
      username: reqData.username || 'new_partner',
      email: reqData.email || 'partner@example.in',
      role: 'PARTNER',
      first_name: reqData.first_name || 'Partner',
      last_name: reqData.last_name || 'User',
      company_name: reqData.company_name || 'New Enterprise Partner'
    };
    localStorage.setItem('demo_user', JSON.stringify(newUser));
    return Promise.resolve({
      data: { tokens: { access: 'demo_access_token', refresh: 'demo_refresh_token' }, user: newUser },
      status: 201,
      statusText: 'Created',
      headers: {},
      config
    });
  }

  if (url.includes('auth/profile/')) {
    const storedDemo = localStorage.getItem('demo_user');
    const u = storedDemo ? JSON.parse(storedDemo) : {};
    return Promise.resolve({
      data: u.profile || {
        business_name: u.company_name || 'Apex Logistics India Pvt Ltd',
        phone: '+91 98765 43210',
        address: '702 Nariman Point, Mumbai, Maharashtra 400021',
        registration_number: 'GSTIN27AABCA1234F1ZM',
        website: 'https://apexlogistics.in'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    });
  }

  if (url.includes('onboarding/blueprints/')) {
    const mockBlueprints = [
      {
        id: 1,
        title: 'Standard Enterprise Vendor Blueprint',
        partner_type_code: 'VENDOR',
        description: 'Compliance onboarding workflow for standard enterprise logistics, software, and hardware vendors in India.',
        is_active: true,
        requirements: [
          { id: 101, document_name: 'GST Registration Certificate', is_mandatory: true, order: 1, description: 'Government issued GSTIN registration document.' },
          { id: 102, document_name: 'Company PAN Card', is_mandatory: true, order: 2, description: 'Permanent Account Number card of entity.' },
          { id: 103, document_name: 'Cancelled Cheque & Bank Account Details', is_mandatory: true, order: 3, description: 'Bank verification details for direct settlement.' },
          { id: 104, document_name: 'Audited Financial Statements (Last 2 Years)', is_mandatory: false, order: 4, description: 'Financial audit reports for credit line approval.' }
        ]
      },
      {
        id: 2,
        title: 'Regional Franchisee Partner Blueprint',
        partner_type_code: 'FRANCHISEE',
        description: 'Onboarding blueprint for regional franchise outlets and exclusive distribution partners.',
        is_active: true,
        requirements: [
          { id: 201, document_name: 'Trade License / Shops & Establishment Certificate', is_mandatory: true, order: 1 },
          { id: 202, document_name: 'Franchise Agreement Deed', is_mandatory: true, order: 2 },
          { id: 203, document_name: 'Identity Proof of Designated Directors (Aadhaar/Passport)', is_mandatory: true, order: 3 }
        ]
      }
    ];

    const bpMatch = url.match(/\/onboarding\/blueprints\/(\d+)\/?/);
    if (bpMatch) {
      const bpId = parseInt(bpMatch[1], 10);
      const foundBp = mockBlueprints.find(b => b.id === bpId) || mockBlueprints[0];
      return Promise.resolve({ data: foundBp, status: 200, statusText: 'OK', headers: {}, config });
    }

    return Promise.resolve({ data: mockBlueprints, status: 200, statusText: 'OK', headers: {}, config });
  }

  if (url.includes('onboarding/reviewer/queue/') || url.includes('onboarding/applications/')) {
    const apps = [
      {
        id: 1,
        application_number: 'APP-2026-8841',
        partner: 1,
        partner_name: 'Rajesh Sharma',
        business_name: 'Apex Logistics India Pvt Ltd',
        blueprint: 1,
        blueprint_name: 'Standard Enterprise Vendor Blueprint',
        status: 'UNDER_REVIEW',
        created_at: '2026-09-06T08:30:00Z',
        submitted_at: '2026-09-06T09:15:00Z',
        completed_percent: 75,
        is_editable: false,
        checklist_items: [
          { id: 1001, document_name: 'GST Registration Certificate', is_mandatory: true, order: 1, document: { id: 501, file_name: 'gst_certificate_apex.pdf', file: '#', status: 'APPROVED', reviewer_comment: 'GSTIN verified with government portal.' } },
          { id: 1002, document_name: 'Company PAN Card', is_mandatory: true, order: 2, document: { id: 502, file_name: 'pan_card_apex.pdf', file: '#', status: 'APPROVED', reviewer_comment: 'Valid entity PAN.' } },
          { id: 1003, document_name: 'Cancelled Cheque & Bank Account Details', is_mandatory: true, order: 3, document: { id: 503, file_name: 'cancelled_cheque_mumbai.pdf', file: '#', status: 'PENDING', reviewer_comment: null } },
          { id: 1004, document_name: 'Audited Financial Statements (Last 2 Years)', is_mandatory: false, order: 4, document: null }
        ]
      },
      {
        id: 2,
        application_number: 'APP-2026-9210',
        partner: 4,
        partner_name: 'Suresh Patel',
        business_name: 'Vanguard Distribution Networks',
        blueprint: 2,
        blueprint_name: 'Regional Franchisee Partner Blueprint',
        status: 'PENDING_APPROVAL',
        created_at: '2026-09-05T14:20:00Z',
        submitted_at: '2026-09-05T16:00:00Z',
        completed_percent: 100,
        is_editable: false,
        checklist_items: [
          { id: 2001, document_name: 'Trade License / Shops & Establishment Certificate', is_mandatory: true, order: 1, document: { id: 601, file_name: 'trade_license_vanguard.pdf', file: '#', status: 'APPROVED', reviewer_comment: 'Verified valid till 2028.' } },
          { id: 2002, document_name: 'Franchise Agreement Deed', is_mandatory: true, order: 2, document: { id: 602, file_name: 'franchise_deed_signed.pdf', file: '#', status: 'APPROVED', reviewer_comment: 'Duly signed and notarized.' } },
          { id: 2003, document_name: 'Identity Proof of Designated Directors (Aadhaar/Passport)', is_mandatory: true, order: 3, document: { id: 603, file_name: 'directors_aadhaar_docs.pdf', file: '#', status: 'APPROVED', reviewer_comment: 'Identity checks clear.' } }
        ]
      },
      {
        id: 3,
        application_number: 'APP-2026-1049',
        partner: 5,
        partner_name: 'Neha Kapoor',
        business_name: 'Zenith Tech Systems Pvt Ltd',
        blueprint: 1,
        blueprint_name: 'Standard Enterprise Vendor Blueprint',
        status: 'APPROVED',
        created_at: '2026-09-04T10:00:00Z',
        submitted_at: '2026-09-04T11:30:00Z',
        completed_percent: 100,
        is_editable: false,
        checklist_items: []
      }
    ];

    const appMatch = url.match(/\/onboarding\/applications\/(\d+)\/?/);
    if (appMatch) {
      const appId = parseInt(appMatch[1], 10);
      const foundApp = apps.find(a => a.id === appId) || apps[0];
      return Promise.resolve({ data: foundApp, status: 200, statusText: 'OK', headers: {}, config });
    }

    return Promise.resolve({ data: apps, status: 200, statusText: 'OK', headers: {}, config });
  }

  if (url.includes('documents/application/')) {
    return Promise.resolve({
      data: [
        { id: 501, file_name: 'gst_certificate_apex.pdf', file: '#', status: 'APPROVED', reviewer_comment: 'GSTIN verified with government portal.', uploaded_at: '2026-09-06T09:10:00Z', title: 'GST Registration Certificate', is_mandatory: true },
        { id: 502, file_name: 'pan_card_apex.pdf', file: '#', status: 'APPROVED', reviewer_comment: 'Valid entity PAN.', uploaded_at: '2026-09-06T09:12:00Z', title: 'Company PAN Card', is_mandatory: true },
        { id: 503, file_name: 'cancelled_cheque_mumbai.pdf', file: '#', status: 'PENDING', reviewer_comment: null, uploaded_at: '2026-09-06T09:14:00Z', title: 'Cancelled Cheque & Bank Account Details', is_mandatory: true }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    });
  }

  if (url.includes('activity/applications/')) {
    return Promise.resolve({
      data: [
        { id: 1, actor_name: 'Rajesh Sharma', action: 'SUBMITTED', description: 'Submitted application APP-2026-8841 for compliance verification.', created_at: '2026-09-06T09:15:00Z' },
        { id: 2, actor_name: 'Ananya Iyer (Compliance)', action: 'DOCUMENT_VERIFIED', description: 'Verified GST Registration Certificate.', created_at: '2026-09-06T09:40:00Z' },
        { id: 3, actor_name: 'Ananya Iyer (Compliance)', action: 'DOCUMENT_VERIFIED', description: 'Verified Company PAN Card.', created_at: '2026-09-06T09:42:00Z' }
      ],
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    });
  }

  // Default fallback for actions (POST/PATCH/DELETE)
  return Promise.resolve({
    data: { detail: 'Demo action executed successfully.', status: 'SUCCESS' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config
  });
};

// Response interceptor for token refresh & fallback mock handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Trigger mock fallback when backend returns 405 Method Not Allowed, 404 Not Found, or Network Error on Vercel
    if (!error.response || status === 405 || status === 404 || error.code === 'ERR_NETWORK') {
      return handleMockFallback(originalRequest);
    }

    if (error.response && status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken && refreshToken !== 'demo_mode_refresh_token') {
        try {
          const res = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('demo_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
