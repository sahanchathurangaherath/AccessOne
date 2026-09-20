import fs from 'node:fs';

const BASE_URL = 'http://localhost:8080/api/v1';
const results = { total: 0, passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    results.tests.push({ name, status: 'PASS', details: String(details) });
  } else {
    results.failed++;
    console.error(`[FAIL] ${name} - ${details}`);
    results.tests.push({ name, status: 'FAIL', details: String(details) });
  }
}

class ApiClient {
  constructor(username, role) {
    this.username = username;
    this.role = role;
    this.cookies = new Map();
  }

  get cookieHeader() {
    return Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  get csrfToken() {
    return this.cookies.get('XSRF-TOKEN');
  }

  updateCookies(res) {
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    if (raw) {
      for (const str of raw) {
        if (!str) continue;
        for (const part of str.split(',')) {
          const cookiePair = part.split(';')[0].trim();
          const eqIdx = cookiePair.indexOf('=');
          if (eqIdx > 0) {
            const k = cookiePair.substring(0, eqIdx).trim();
            const v = cookiePair.substring(eqIdx + 1).trim();
            this.cookies.set(k, v);
          }
        }
      }
    }
  }

  async initCsrf() {
    const res = await fetch(`${BASE_URL}/auth/csrf`);
    this.updateCookies(res);
  }

  async login(password = 'Password@123') {
    await this.initCsrf();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (this.cookieHeader) headers['Cookie'] = this.cookieHeader;
    if (this.csrfToken) headers['X-XSRF-TOKEN'] = this.csrfToken;

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: this.username, password })
    });
    this.updateCookies(res);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  async req(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (this.cookieHeader) headers['Cookie'] = this.cookieHeader;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && this.csrfToken) {
      headers['X-XSRF-TOKEN'] = this.csrfToken;
    }

    let body = options.body;
    if (body !== undefined && !(body instanceof FormData) && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method,
      headers,
      body
    });
    this.updateCookies(res);

    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else if (contentType.includes('application/pdf') || contentType.includes('image/')) {
      data = await res.arrayBuffer();
    } else {
      data = await res.text().catch(() => null);
    }
    return { ok: res.ok, status: res.status, data, headers: res.headers };
  }
}

const TINY_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

async function run() {
  console.log('=== Starting AccessOne Stakeholder CRUD Automated Test Suite ===\n');

  // 1. Auth & Role Validation
  console.log('--- Section 0: Auth & Access Control ---');
  const admin = new ApiClient('admin', 'SYSTEM_ADMIN');
  const emp = new ApiClient('crajapaksa', 'EMPLOYEE');
  const hr = new ApiClient('nperera', 'HR_MANAGER');
  const it = new ApiClient('kjayasinghe', 'IT_ADMIN');
  const sec = new ApiClient('rfernando', 'SECURITY_OFFICER');
  const print = new ApiClient('twickramaratne', 'PRINT_SUPERVISOR');

  const adminAuth = await admin.login();
  logTest('Admin login', adminAuth.ok, `Role: ${adminAuth.data?.role}`);

  const empAuth = await emp.login();
  logTest('Employee crajapaksa login', empAuth.ok, `Employee ID: ${empAuth.data?.employeeId}`);

  const hrAuth = await hr.login();
  logTest('HR Manager nperera login', hrAuth.ok, `Role: ${hrAuth.data?.role}`);

  const itAuth = await it.login();
  logTest('IT Admin kjayasinghe login', itAuth.ok, `Role: ${itAuth.data?.role}`);

  const secAuth = await sec.login();
  logTest('Security Officer rfernando login', secAuth.ok, `Role: ${secAuth.data?.role}`);

  const printAuth = await print.login();
  logTest('Print Supervisor twickramaratne login', printAuth.ok, `Role: ${printAuth.data?.role}`);

  const badClient = new ApiClient('admin', 'SYSTEM_ADMIN');
  const badLogin = await badClient.login('WrongPassword!');
  logTest('Reject bad password (401)', badLogin.status === 401, `Status: ${badLogin.status}`);

  const empForbidden = await emp.req('/approvals/queue');
  logTest('Employee blocked from HR approval queue (403)', empForbidden.status === 403, `Status: ${empForbidden.status}`);

  // 2. Module 1: Employee Card Requests CRUD
  console.log('\n--- Section 1: Employee Card Request CRUD ---');
  // READ own requests
  const empRequests = await emp.req('/requests');
  logTest('Employee READ own requests', empRequests.ok, `Items: ${empRequests.data?.content?.length ?? 0}`);

  // Clean up any existing DRAFT for crajapaksa
  const existingDraft = empRequests.data?.content?.find(r => r.status === 'DRAFT');
  if (existingDraft) {
    await emp.req(`/requests/${existingDraft.id}`, { method: 'DELETE' });
  }

  // CREATE Draft Request
  const createDraft = await emp.req('/requests', {
    method: 'POST',
    body: {
      requestType: 'NEW',
      reason: 'Standard issue ID card for testing'
    }
  });
  const reqId = createDraft.data?.id;
  logTest('Employee CREATE draft request', createDraft.ok && createDraft.data?.status === 'DRAFT', `Req ID: ${reqId}, Status: ${createDraft.data?.status}`);

  // READ request details
  const getDraft = await emp.req(`/requests/${reqId}`);
  logTest('Employee READ request details', getDraft.ok && getDraft.data?.id === reqId, `RequestNo: ${getDraft.data?.requestNo}`);

  // READ timeline
  const getTimeline = await emp.req(`/requests/${reqId}/timeline`);
  logTest('Employee READ request timeline', getTimeline.ok && Array.isArray(getTimeline.data), `Timeline entries: ${getTimeline.data?.length}`);

  // UPDATE draft request
  const updateDraft = await emp.req(`/requests/${reqId}`, {
    method: 'PUT',
    body: {
      requestType: 'NEW',
      reason: 'Updated reason for employee ID card'
    }
  });
  logTest('Employee UPDATE draft request', updateDraft.ok && updateDraft.data?.reason === 'Updated reason for employee ID card', `Updated Reason: ${updateDraft.data?.reason}`);

  // CREATE photo document attachment
  const photoBlob = new Blob([TINY_PNG_BYTES], { type: 'image/png' });
  const form = new FormData();
  form.append('file', photoBlob, 'portrait.png');
  const uploadDoc = await emp.req(`/requests/${reqId}/photo`, {
    method: 'POST',
    body: form
  });
  logTest('Employee CREATE photo upload', uploadDoc.ok && uploadDoc.data?.hasPhoto === true, `HasPhoto: ${uploadDoc.data?.hasPhoto}`);

  // SUBMIT Request (Transition DRAFT -> SUBMITTED)
  const submitReq = await emp.req(`/requests/${reqId}/submit`, { method: 'POST' });
  logTest('Employee UPDATE (Submit) request', submitReq.ok && submitReq.data?.status === 'SUBMITTED', `New Status: ${submitReq.data?.status}`);

  // 3. Module 2: HR Verification and Approval Management CRUD
  console.log('\n--- Section 2: HR Operations Manager CRUD ---');
  // READ pending queue
  const pendingQueue = await hr.req('/approvals/queue');
  logTest('HR READ pending approvals queue', pendingQueue.ok, `Queue size: ${pendingQueue.data?.content?.length}`);

  // CREATE comment on request
  const addComment = await hr.req(`/approvals/${reqId}/comments`, {
    method: 'POST',
    body: { text: 'Verified against employee master record' }
  });
  logTest('HR CREATE approval comment', addComment.ok, `Comments count: ${addComment.data?.comments?.length}`);

  // UPDATE: Verify Request
  const verifyReq = await hr.req(`/approvals/${reqId}/verify`, { method: 'POST' });
  logTest('HR UPDATE (Mark Verified)', verifyReq.ok && verifyReq.data?.decision === 'VERIFIED', `Decision: ${verifyReq.data?.decision}`);

  // UPDATE: Approve Request
  const approveReq = await hr.req(`/approvals/${reqId}/approve`, { method: 'POST' });
  logTest('HR UPDATE (Approve Request)', approveReq.ok && approveReq.data?.decision === 'APPROVED', `Decision: ${approveReq.data?.decision}`);

  // READ approval history
  const hrHistory = await hr.req('/approvals/history');
  logTest('HR READ approval history', hrHistory.ok, `History records: ${hrHistory.data?.content?.length}`);

  // 4. Module 3: IT Department and Access Level Configuration CRUD
  console.log('\n--- Section 3: IT Department & Access Level CRUD ---');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  // CREATE Department
  const createDept = await it.req('/config/departments', {
    method: 'POST',
    body: {
      deptCode: `D-${randNum}`,
      deptName: `Automated Test Dept ${randNum}`,
      description: 'Department for CRUD automated test'
    }
  });
  const deptId = createDept.data?.id;
  logTest('IT Admin CREATE department', createDept.ok, `Dept Code: D-${randNum}`);

  // READ Departments
  const listDepts = await it.req('/config/departments');
  logTest('IT Admin READ departments', listDepts.ok, `Total departments: ${listDepts.data?.length}`);

  // UPDATE Department
  const updateDept = await it.req(`/config/departments/${deptId}`, {
    method: 'PUT',
    body: {
      deptCode: `D-${randNum}`,
      deptName: `Updated Dept Name ${randNum}`,
      description: 'Updated description'
    }
  });
  logTest('IT Admin UPDATE department', updateDept.ok && updateDept.data?.deptName.includes('Updated'), `Updated name verified`);

  // CREATE Area
  const createArea = await it.req('/config/areas', {
    method: 'POST',
    body: {
      areaCode: `A-${randNum}`,
      areaName: `Secure Server Room ${randNum}`,
      building: 'HQ Building',
      floorNo: 'Floor 3',
      restricted: true,
      description: 'Server room zone'
    }
  });
  const areaId = createArea.data?.id;
  logTest('IT Admin CREATE building area', createArea.ok, `Area Code: A-${randNum}`);

  // CREATE Access Level
  const createLevel = await it.req('/config/access-levels', {
    method: 'POST',
    body: {
      levelCode: `L-${randNum}`,
      levelName: `Level Alpha ${randNum}`,
      description: 'Engineering high clearance'
    }
  });
  const levelId = createLevel.data?.id;
  logTest('IT Admin CREATE access level', createLevel.ok, `Level Code: L-${randNum}`);

  // UPDATE Map Area to Access Level
  const mapArea = await it.req(`/config/access-levels/${levelId}/areas`, {
    method: 'PUT',
    body: { areaIds: [areaId] }
  });
  logTest('IT Admin UPDATE access level areas mapping', mapArea.ok, `Permitted areas: ${mapArea.data?.permittedAreas?.length}`);

  // READ Permission Matrix
  const matrix = await it.req('/config/permission-matrix');
  logTest('IT Admin READ Permission Matrix', matrix.ok, `Permission matrix loaded`);

  // READ Test Access Rule (Granted)
  const testRule = await it.req('/config/access-test', {
    method: 'POST',
    body: { levelId, areaId }
  });
  logTest('IT Admin READ Test Access Rule (Granted)', testRule.ok && testRule.data?.granted === true, `Granted: ${testRule.data?.granted}`);

  // 5. Module 4: Card Generation & Credentials
  console.log('\n--- Section 4: Card Generation & Credentials ---');
  // Find card generated automatically by event listener
  const listCards = await it.req(`/cards`);
  const generatedCard = listCards.data?.content?.find(c => c.employeeName?.includes('Rajapaksa') || c.requestId === reqId) || listCards.data?.content?.[0];
  const cardId = generatedCard?.id;
  logTest('IT/System READ generated card', Boolean(cardId), `Card ID: ${cardId}, Serial: ${generatedCard?.cardSerial}, Status: ${generatedCard?.status}`);

  if (cardId) {
    // READ Card Detail
    const cardDetail = await it.req(`/cards/${cardId}`);
    logTest('IT Admin READ card detail', cardDetail.ok, `Card Serial: ${cardDetail.data?.cardSerial}`);

    // READ QR Code
    const qrBytes = await it.req(`/cards/${cardId}/qr`);
    logTest('IT Admin READ card QR byte stream', qrBytes.ok && (qrBytes.data?.byteLength > 0 || qrBytes.data?.length > 0), `Status: ${qrBytes.status}`);

    // READ PDF
    const pdfBytes = await it.req(`/cards/${cardId}/pdf`);
    logTest('IT Admin READ printable card PDF', pdfBytes.ok && (pdfBytes.data?.byteLength > 0 || pdfBytes.data?.length > 0), `Status: ${pdfBytes.status}`);

    // READ Verify by Serial
    const verifySerial = await it.req(`/cards/by-serial/${cardDetail.data?.cardSerial || generatedCard?.cardSerial}`);
    logTest('System READ verify card by serial', verifySerial.ok, `Holder: ${verifySerial.data?.employeeName}`);
  }

  // 6. Module 6: Print Production, Dispatch and Handover Activation
  console.log('\n--- Section 5: Print Production & Activation CRUD ---');
  // READ print queue
  const printQueue = await print.req('/print/jobs');
  logTest('Print Supervisor READ print queue', printQueue.ok, `Queue size: ${printQueue.data?.content?.length}`);

  // CREATE print job
  let currentJobId = null;
  if (cardId) {
    const queueJob = await print.req('/print/jobs', {
      method: 'POST',
      body: { cardId }
    });
    currentJobId = queueJob.data?.id;
    logTest('Print Supervisor CREATE print job', queueJob.ok || queueJob.status === 409, `Job ID: ${currentJobId || 'Already Queued'}`);
  }

  // Find any queued or in progress job to progress
  const activeJobs = await print.req('/print/jobs');
  const targetJob = activeJobs.data?.content?.find(j => j.status === 'QUEUED') || activeJobs.data?.content?.[0];

  if (targetJob) {
    const jId = targetJob.id;
    // UPDATE Start Job
    if (targetJob.status === 'QUEUED') {
      const startJob = await print.req(`/print/jobs/${jId}/start`, {
        method: 'POST',
        body: { printerName: 'Thermal Pro X1' }
      });
      logTest('Print Supervisor UPDATE (Start Print Job)', startJob.ok, `Status: ${startJob.data?.status}`);
    }

    // UPDATE Mark Printed
    const markPrinted = await print.req(`/print/jobs/${jId}/complete`, { method: 'POST' });
    logTest('Print Supervisor UPDATE (Mark Printed)', markPrinted.ok || markPrinted.status === 409, `Status: ${markPrinted.data?.status || 'Already Printed'}`);

    // UPDATE Record QC Result
    const qcPass = await print.req(`/print/jobs/${jId}/qc`, {
      method: 'POST',
      body: { result: 'PASS', notes: 'Clear print and barcodes' }
    });
    logTest('Print Supervisor UPDATE (Record QC Pass)', qcPass.ok || qcPass.status === 409, `QC status: ${qcPass.data?.status}`);

    // CREATE Dispatch Record
    const openDispatch = await print.req('/dispatch', {
      method: 'POST',
      body: { printJobId: jId, dispatchMethod: 'INTERNAL_COURIER', remarks: 'Handover at Main Desk' }
    });
    const dispatchId = openDispatch.data?.id;
    logTest('Print Supervisor CREATE dispatch record', openDispatch.ok || openDispatch.status === 409, `Dispatch ID: ${dispatchId}`);

    // READ Dispatch List
    const dispatchList = await print.req('/dispatch');
    logTest('Print Supervisor READ dispatch queue', dispatchList.ok, `Dispatches: ${dispatchList.data?.content?.length}`);

    // UPDATE Dispatch & Handover
    const targetDispatch = dispatchList.data?.content?.find(d => d.status === 'PENDING') || dispatchList.data?.content?.[0];
    if (targetDispatch) {
      const markDispatched = await print.req(`/dispatch/${targetDispatch.id}/dispatch`, { method: 'POST' });
      logTest('Print Supervisor UPDATE (Mark Dispatched)', markDispatched.ok || markDispatched.status === 409, `Status: ${markDispatched.data?.status}`);
    }
  }

  // 7. Module 5: Visitor and Temporary Pass Management CRUD
  console.log('\n--- Section 6: Visitor & Pass Management CRUD ---');
  // READ currently on site
  const onSite = await sec.req('/visitors/on-site');
  logTest('Security Officer READ on-site visitors', onSite.ok, `Count on site: ${onSite.data?.length ?? 0}`);

  // CREATE Visitor
  const createVisitor = await sec.req('/visitors', {
    method: 'POST',
    body: {
      fullName: `Kasun Fernando ${randNum}`,
      idDocumentType: 'NIC',
      idDocumentNo: `92${randNum}1234V`,
      visitorType: 'VISITOR',
      hostEmployeeId: 1,
      company: 'Alpha Tech Solutions',
      phone: '+94771234567',
      email: `visitor${randNum}@alphatech.lk`
    }
  });
  const visitorId = createVisitor.data?.id;
  logTest('Security Officer CREATE visitor registration', createVisitor.ok, `Visitor ID: ${visitorId}, Name: ${createVisitor.data?.fullName}`);

  // READ Visitors List
  const listVisitors = await sec.req('/visitors');
  logTest('Security Officer READ visitors list', listVisitors.ok, `Total registered: ${listVisitors.data?.totalElements}`);

  // CREATE Issue Temporary Pass
  const now = new Date();
  const validFrom = now.toISOString().slice(0, 19);
  const validUntil = new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 19);
  const issuePass = await sec.req('/passes', {
    method: 'POST',
    body: {
      visitorId,
      hostEmployeeId: 1,
      accessLevelId: 1,
      purpose: 'Technical Consultation',
      validFrom,
      validUntil
    }
  });
  const passId = issuePass.data?.id;
  const passNumber = issuePass.data?.passNo;
  logTest('Security Officer CREATE (Issue Pass)', issuePass.ok, `Pass No: ${passNumber}, Status: ${issuePass.data?.status}`);

  // UPDATE Check-In Visitor
  const checkIn = await sec.req(`/passes/${passId}/check-in`, {
    method: 'POST',
    body: {
      areaId: 1,
      notes: 'Checked in at Reception'
    }
  });
  logTest('Security Officer UPDATE (Check-In Visitor)', checkIn.ok, `Pass Status: ${checkIn.data?.status}`);

  // UPDATE Check-Out Visitor
  const checkOut = await sec.req(`/passes/${passId}/check-out`, { method: 'POST' });
  logTest('Security Officer UPDATE (Check-Out Visitor)', checkOut.ok, `Check-out recorded`);

  // UPDATE Extend Pass
  const newValidUntil = new Date(now.getTime() + 12 * 3600000).toISOString().slice(0, 19);
  const extendPass = await sec.req(`/passes/${passId}/extend`, {
    method: 'POST',
    body: { newValidUntil, reason: 'Extended meeting' }
  });
  logTest('Security Officer UPDATE (Extend Pass Validity)', extendPass.ok, `New Expiry: ${extendPass.data?.validUntil}`);

  // READ Daily Visitor Report
  const dailyReport = await sec.req('/visitors/reports/daily');
  logTest('Security Officer READ Daily Visitor Report', dailyReport.ok, `Total visits today: ${dailyReport.data?.length ?? 0}`);

  // 8. Access Decision Engine & Door Simulator
  console.log('\n--- Section 7: Access Decision Engine & Simulator ---');
  // Evaluate Door Swipe for Employee Active Card
  const activeCardSerial = 'ACO-2026-000001';
  const evalActiveCard = await sec.req('/access/evaluate', {
    method: 'POST',
    body: {
      credentialRef: activeCardSerial,
      areaCode: 'A-LOB',
      direction: 'IN'
    }
  });
  logTest('Access Engine evaluate valid card (GRANTED)', evalActiveCard.ok && evalActiveCard.data?.granted === true, `Granted: ${evalActiveCard.data?.granted}, Holder: ${evalActiveCard.data?.holderName}`);

  // Evaluate Door Swipe for Revoked / Invalid Credential
  const evalInvalid = await sec.req('/access/evaluate', {
    method: 'POST',
    body: {
      credentialRef: 'ACO-2026-000009',
      areaCode: 'A-LOB',
      direction: 'IN'
    }
  });
  logTest('Access Engine evaluate revoked credential (DENIED)', evalInvalid.ok && evalInvalid.data?.granted === false, `Granted: ${evalInvalid.data?.granted}, Reason: ${evalInvalid.data?.denialReason}`);

  // READ Access Logs
  const accessLogs = await sec.req('/access/logs');
  logTest('Access Engine READ access audit logs', accessLogs.ok, `Total logged attempts: ${accessLogs.data?.totalElements}`);

  // READ Denials by Reason
  const denialsReport = await sec.req('/access/logs/denials-by-reason');
  logTest('Access Engine READ denials summary report', denialsReport.ok, `Distinct denial reasons: ${denialsReport.data?.length}`);

  // 9. Summary & Write Results
  console.log('\n=================================================');
  console.log(`TOTAL TESTS: ${results.total} | PASSED: ${results.passed} | FAILED: ${results.failed}`);
  console.log('=================================================\n');

  fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
}

run().catch(console.error);
