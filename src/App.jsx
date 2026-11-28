import React, { useEffect, useRef, useState } from 'react';
import SyntheticEvidenceReplay from './SyntheticEvidenceReplay';
import { CaseCloseout, CaseSummary, FollowUpTracker, OperativeNote, PreOpContext, ReviewQueue } from './WorkflowStages';
import {
  Activity, AlertTriangle, ArrowLeft, Bell, CalendarDays, Check,
  ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3,
  Eye, FileText, LayoutDashboard, Menu, MessageSquareText, Mic, MoreHorizontal,
  PackageCheck, PanelLeftClose, Play, Search, Settings, Stethoscope,
  Upload, Users, Video, X,
} from 'lucide-react';

const patient = {
  name: 'Demo Patient',
  id: 'UHID MH-24-018642',
  age: 58,
  sex: 'Male',
  blood: '—',
  procedure: 'RIGHT Total Knee Replacement',
  surgeon: 'Dr. Arjun Mehta',
  anesthetist: 'Dr. N. Iyer',
};
const procedureDate = '2025-02-12';

function dateAfterDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime()) || !Number.isInteger(Number(days)) || Number(days) < 1) return '';
  date.setDate(date.getDate() + Number(days));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(dateString) {
  if (!dateString) return 'Not scheduled';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

const requiredMedicationOrderFields = ['medication', 'strength', 'dose', 'route', 'frequency', 'duration'];
const medicationOrderFields = [...requiredMedicationOrderFields, 'quantity'];

function hasMedicationOrderValues(order) {
  return medicationOrderFields.some((field) => String(order[field]).trim());
}

function hasIncompleteMedicationOrder(order) {
  return requiredMedicationOrderFields.some((field) => !String(order[field]).trim());
}

function downloadLocalFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

const initialEvents = [
  { id: 1, time: '09:43:12', title: 'Tourniquet inflated', detail: 'Right thigh · 300 mmHg', type: 'procedure', status: 'verified', source: 'Monitor + audio', confidence: 100 },
  { id: 2, time: '09:48:03', title: 'Incision', detail: 'Midline incision, right knee', type: 'procedure', status: 'verified', source: 'Video + audio', confidence: 98 },
  { id: 3, time: '10:14:52', title: 'Bone cuts completed', detail: 'Distal femoral and proximal tibial cuts observed', type: 'milestone', status: 'verified', source: 'Video', confidence: 89 },
  { id: 4, time: '10:27:19', title: 'Tibial baseplate opened', detail: 'Size 3 · Lot TB3-48291 · sterile field transfer observed', type: 'implant', status: 'verified', source: 'Barcode + nurse', confidence: 100 },
  { id: 5, time: '10:22:08', title: 'Femoral trial size 4 assessed', detail: 'Verbal confirmation obscured by instrument noise', type: 'implant', status: 'pending', source: 'Video + audio', confidence: 72, needsReview: true },
  { id: 6, time: '10:31:46', title: 'Femoral component size 4 implanted', detail: 'Implantation inferred from video sequence', type: 'implant', status: 'pending', source: 'Video + audio', confidence: 94, needsReview: true },
  { id: 7, time: '11:04:17', title: 'Final range of motion 0–115°', detail: 'Angle estimate requires clinician confirmation', type: 'milestone', status: 'pending', source: 'Video + audio', confidence: 81, needsReview: true },
];

const procedureSteps = [
  { name: 'Preparation', state: 'done', time: '09:43' },
  { name: 'Approach', state: 'done', time: '09:48' },
  { name: 'Bone preparation', state: 'done', time: '10:14' },
  { name: 'Implantation', state: 'active', time: '10:31' },
  { name: 'Closure', state: 'next', time: '—' },
];

function buildDraftNote(events) {
  const verifiedEvents = events.filter((event) => event.status === 'verified')
    .sort((a, b) => a.time.localeCompare(b.time));
  const eventLines = verifiedEvents.length
    ? verifiedEvents.map((event) => `${event.time} — ${event.title}: ${event.detail}`).join('\n')
    : 'No events have been verified yet.';
  const pendingCount = events.filter((event) => event.status === 'pending').length;
  return (
    `DRAFT OPERATIVE NOTE — REQUIRES CLINICIAN REVIEW\n\n` +
    `Patient: ${patient.name} · 58 M · ${patient.id}\n` +
    `Procedure: ${patient.procedure}\n` +
    `Lead surgeon: ${patient.surgeon}\n` +
    `Estimated blood loss: 180 mL\n\n` +
    `Verified timeline events:\n${eventLines}\n\n` +
    `Events still awaiting review: ${pendingCount}\n\n` +
    `This prototype draft uses synthetic demonstration data. Verify all details and complete the clinical record through the approved hospital workflow.`
  );
}

function App() {
  const [events, setEvents] = useState(initialEvents);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('Timeline');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [sessionRunning, setSessionRunning] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [noteReviewed, setNoteReviewed] = useState(false);
  const [reviewEditing, setReviewEditing] = useState(false);
  const [reviewDetail, setReviewDetail] = useState('');
  const [signerName, setSignerName] = useState(patient.surgeon);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [handoverConfirmed, setHandoverConfirmed] = useState(false);
  const [exportDownloaded, setExportDownloaded] = useState(false);
  const [clinicalDocumentDownloaded, setClinicalDocumentDownloaded] = useState(false);
  const [caseClosedAt, setCaseClosedAt] = useState('');
  const [followUpDays, setFollowUpDays] = useState('');
  const [followUpPlanDate, setFollowUpPlanDate] = useState('');
  const [postoperativeInstructions, setPostoperativeInstructions] = useState('');
  const [medicationOrders, setMedicationOrders] = useState([]);
  const [addendumText, setAddendumText] = useState('');
  const [addenda, setAddenda] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState('case');
  const [selectedFollowUpId, setSelectedFollowUpId] = useState('followup-demo-001');
  const [followUpVisits, setFollowUpVisits] = useState([{
    id: 'followup-demo-001',
    visitDate: '2025-02-26',
    visitType: 'Two-week post-operative review',
    status: 'attended',
    condition: 'Synthetic example only: patient-reported pain 3/10; walking with a frame; incision documented as clean and dry.',
    painScore: '3/10 (patient-reported)',
    mobility: 'Walking with a frame (synthetic example)',
    incision: 'Clean and dry (synthetic example)',
    nextVisitDate: '2025-03-26',
    clinician: patient.surgeon,
    syntheticDemoData: true,
  }]);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'I am ready. Ask me about the patient, procedure, or recorded events.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [reviewEvent, setReviewEvent] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaName, setMediaName] = useState('');
  const [mediaMode, setMediaMode] = useState('synthetic');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!sessionRunning) return undefined;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionRunning]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const timeString = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const plannedFollowUpDate = followUpDays
    ? (followUpPlanDate || dateAfterDays(localDateString(new Date()), followUpDays))
    : '';
  const filteredEvents = (filter === 'All' ? events : events.filter((event) => event.type === filter.toLowerCase()))
    .slice()
    .sort((a, b) => b.time.localeCompare(a.time));

  const startCase = () => {
    if (!identityVerified) return;
    setElapsed(0);
    setSessionRunning(true);
    setSessionEnded(false);
    setWorkflowStep(1);
  };

  const endSession = () => {
    setSessionRunning(false);
    setSessionEnded(true);
    setWorkflowStep(2);
  };

  const verifyEvent = (id) => {
    const updatedEvents = events.map((event) => event.id === id
      ? { ...event, status: 'verified', detail: reviewEvent?.id === id && reviewEditing ? reviewDetail : event.detail }
      : event);
    setEvents(updatedEvents);
    if (workflowStep >= 3) setDraftText(buildDraftNote(updatedEvents));
    setDraftSaved(false);
  };

  const rejectEvent = (id) => {
    setEvents((current) => current.map((event) => event.id === id ? { ...event, status: 'rejected' } : event));
  };

  const openReview = (event, editing = false) => {
    setReviewEvent(event);
    setReviewDetail(event.detail);
    setReviewEditing(editing);
  };

  const approveHighConfidence = () => {
    setEvents((current) => current.map((event) => event.status === 'pending' && event.confidence >= 90
      ? { ...event, status: 'verified' }
      : event));
  };

  const generateNote = () => {
    if (events.some((event) => event.status === 'pending')) return;
    setDraftText(buildDraftNote(events));
    setDraftSaved(false);
    setWorkflowStep(3);
  };

  const completeNoteReview = () => {
    setNoteReviewed(true);
    setWorkflowStep(4);
  };

  const exportDraft = () => {
    const file = new Blob([draftText], { type: 'text/plain;charset=utf-8' });
    downloadLocalFile(file, 'operative-note-demo.txt');
  };

  const exportCaseBundle = () => {
    const bundle = {
      caseId: 'ORB-DEMO-003',
      syntheticDemoData: true,
      generatedAt: new Date().toISOString(),
      patient: { name: patient.name, id: patient.id, age: patient.age },
      procedure: patient.procedure,
      procedureDate,
      operativeNoteDraft: draftText,
      events: events.map(({ id, time, title, detail, source, status, confidence }) => ({
        id, time, title, detail, source, status, confidence,
      })),
      handover: { receivingTeamMember: receiverName, acknowledged: handoverConfirmed },
      clinicianEnteredPostoperativeInstructions: postoperativeInstructions,
      clinicianEnteredMedicationOrders: medicationOrders.filter(hasMedicationOrderValues).map(({ id, ...order }) => order),
      followUpPlan: {
        daysAfterCloseout: followUpDays ? Number(followUpDays) : null,
        scheduledDate: followUpDays ? (followUpPlanDate || dateAfterDays(localDateString(new Date()), followUpDays)) : null,
      },
      addenda,
      followUpVisits,
      caseClosedAt: caseClosedAt || null,
      exportStatus: 'Local download only; no HIMS/EHR transmission configured.',
    };
    downloadLocalFile(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }), 'case-closeout-demo.json');
    setExportDownloaded(true);
  };

  const downloadClinicalSummary = () => {
    const plannedDate = followUpDays ? (followUpPlanDate || dateAfterDays(localDateString(new Date()), followUpDays)) : '';
    const eventRows = events.map((event) => (
      `<tr><td>${escapeHtml(event.time)}</td><td>${escapeHtml(event.title)}</td><td>${escapeHtml(event.detail)}</td><td>${escapeHtml(event.status)}</td></tr>`
    )).join('');
    const followUpRows = followUpVisits.map((visit) => (
      `<tr><td>${escapeHtml(formatDate(visit.visitDate))}</td><td>${escapeHtml(visit.visitType)}</td><td>${visit.status === 'scheduled' ? 'Scheduled' : 'Visited'}</td><td>${escapeHtml(visit.condition)}</td></tr>`
    )).join('');
    const enteredMedicationOrders = medicationOrders.filter(hasMedicationOrderValues);
    const medicationRows = enteredMedicationOrders.length
      ? enteredMedicationOrders.map((order) => {
        const complete = requiredMedicationOrderFields.every((field) => String(order[field]).trim());
        return `<tr><td>${escapeHtml(order.medication || '—')}</td><td>${escapeHtml(order.strength || '—')}</td><td>${escapeHtml(order.dose || '—')}</td><td>${escapeHtml(order.route || '—')}</td><td>${escapeHtml(order.frequency || '—')}</td><td>${escapeHtml(order.duration || '—')}</td><td>${escapeHtml(order.quantity || '—')}</td><td>${complete ? 'Clinician entered' : 'Incomplete · do not issue'}</td></tr>`;
      }).join('')
      : '<tr><td colspan="8">No medication orders entered by the clinician.</td></tr>';
    const instructions = postoperativeInstructions.trim()
      ? escapeHtml(postoperativeInstructions).replace(/\r?\n/g, '<br>')
      : 'No post-operative instructions entered by the clinician.';
    const duration = `${String(Math.floor(elapsed / 3600)).padStart(2, '0')}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
    const documentHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Surgical case summary · ORB-DEMO-003</title>
  <style>
    :root{font-family:Arial,sans-serif;color:#203638;background:#edf2f2;font-size:12px}
    *{box-sizing:border-box}body{margin:0;padding:28px}.sheet{max-width:900px;margin:0 auto;background:#fff;border:1px solid #d5e0df;padding:34px}
    .demo{margin:-34px -34px 26px;padding:9px 34px;background:#fff3dc;color:#815c2e;font-size:10px;font-weight:700;letter-spacing:.08em;text-align:center}
    header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:2px solid #187d74;padding-bottom:18px}
    .brand{color:#17665f;font-size:19px;font-weight:700}.brand small{display:block;margin-top:4px;color:#718486;font-size:9px;letter-spacing:.12em}
    h1{margin:20px 0 5px;font-size:23px}h2{margin:22px 0 10px;padding-bottom:7px;border-bottom:1px solid #dce6e5;color:#265a59;font-size:14px}
    .subtle{color:#708183;font-size:10px;line-height:1.55}.case-chip{border:1px solid #c8dcd8;border-radius:5px;padding:7px 10px;color:#28766e;font-weight:700}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.field{border:1px solid #e0e8e7;border-radius:5px;padding:10px}.field span{display:block;margin-bottom:5px;color:#778889;font-size:9px;text-transform:uppercase;letter-spacing:.05em}.field strong{font-size:11px}
    .notice{border-left:3px solid #b98b4b;background:#fffbf3;padding:10px 12px;color:#66573e;line-height:1.5}
    table{width:100%;border-collapse:collapse;font-size:10px}th{background:#f1f6f5;color:#607576;text-align:left}th,td{border-bottom:1px solid #e5eceb;padding:8px;vertical-align:top}td:last-child{text-transform:capitalize}
    .orders{min-height:60px;border:1px solid #dce6e5;border-radius:5px;padding:12px;line-height:1.65;white-space:normal}.signature{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:28px}.signature div{border-top:1px solid #7d8c8d;padding-top:7px;color:#718183;font-size:9px}
    footer{margin-top:24px;border-top:1px solid #dce6e5;padding-top:10px;color:#7a898a;font-size:9px;line-height:1.5}
    @media print{ :root{background:#fff}body{padding:0}.sheet{max-width:none;border:0;padding:18mm}.demo{margin:-18mm -18mm 12mm;padding:8px 18mm}h2{break-after:avoid}tr{break-inside:avoid} }
    @media(max-width:650px){body{padding:8px}.sheet{padding:18px}.demo{margin:-18px -18px 18px}.grid{grid-template-columns:1fr 1fr}header{flex-direction:column}}
  </style>
</head>
<body>
  <main class="sheet">
    <div class="demo">SYNTHETIC DEMONSTRATION · NOT A VALID PRESCRIPTION OR CLINICAL RECORD</div>
    <header><div class="brand">Neurova AI<small>OPERATING THEATRE CASE DOCUMENTATION</small></div><div class="case-chip">CASE ORB-DEMO-003</div></header>
    <h1>Surgical Case Summary &amp; Clinician-Entered Orders</h1>
    <p class="subtle">Prepared ${escapeHtml(new Date().toLocaleString())} · Local demo export only · Not transmitted to HIMS / EHR</p>
    <h2>Patient &amp; procedure</h2>
    <section class="grid">
      <div class="field"><span>Patient</span><strong>${escapeHtml(patient.name)} · ${patient.age} ${patient.sex}</strong></div>
      <div class="field"><span>Patient identifier</span><strong>${escapeHtml(patient.id)}</strong></div>
      <div class="field"><span>Procedure date / location</span><strong>${escapeHtml(formatDate(procedureDate))} · OT-3</strong></div>
      <div class="field"><span>Clinical indication</span><strong>Severe tricompartmental osteoarthritis · synthetic imaging summary</strong></div>
      <div class="field"><span>Procedure</span><strong>${escapeHtml(patient.procedure)}</strong></div>
      <div class="field"><span>Lead surgeon</span><strong>${escapeHtml(patient.surgeon)}</strong></div>
      <div class="field"><span>Anaesthesia</span><strong>${escapeHtml(patient.anesthetist)}</strong></div>
    </section>
    <div class="notice" style="margin-top:10px"><strong>Recorded allergy:</strong> Latex · confirm patient identity, allergy status, and all imported details in the approved clinical system.</div>
    <h2>Operative summary</h2>
    <section class="grid">
      <div class="field"><span>Case duration</span><strong>${duration}</strong></div>
      <div class="field"><span>Estimated blood loss</span><strong>180 mL · synthetic demo data</strong></div>
      <div class="field"><span>Documentation status</span><strong>${events.filter((event) => event.status === 'pending').length ? 'Review required' : 'Reconciled in demo'}</strong></div>
    </section>
    <h2>Reconciled event record</h2>
    <table><thead><tr><th>Time</th><th>Event</th><th>Recorded detail</th><th>Disposition</th></tr></thead><tbody>${eventRows}</tbody></table>
    <h2>Clinician-entered medication orders</h2>
    <table><thead><tr><th>Medication</th><th>Strength</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Duration</th><th>Quantity</th><th>Status</th></tr></thead><tbody>${medicationRows}</tbody></table>
    <h2>Clinician-entered post-operative instructions</h2>
    <div class="orders">${instructions}</div>
    <p class="subtle">No medication or treatment recommendation is generated by this prototype. Verify any entered orders through the authorized prescribing workflow.</p>
    <h2>Follow-up plan</h2>
    <section class="grid">
      <div class="field"><span>Interval entered by clinician</span><strong>${followUpDays ? `${escapeHtml(followUpDays)} days after closeout` : 'Not specified'}</strong></div>
      <div class="field"><span>Planned date</span><strong>${escapeHtml(formatDate(plannedDate))}</strong></div>
      <div class="field"><span>Tracker status</span><strong>${plannedDate ? (caseClosedAt ? 'Scheduled in demo follow-up tracker' : 'Will be added to tracker on closeout') : 'No visit scheduled'}</strong></div>
    </section>
    <h2>Follow-up visit history</h2>
    <table><thead><tr><th>Date</th><th>Visit</th><th>Status</th><th>Clinician-entered condition / note</th></tr></thead><tbody>${followUpRows}</tbody></table>
    <h2>Closeout &amp; handover</h2>
    <section class="grid">
      <div class="field"><span>Review acknowledgement</span><strong>${escapeHtml(signerName)} · demo acknowledgement only</strong></div>
      <div class="field"><span>Receiving team</span><strong>${escapeHtml(receiverName || 'Not recorded')}</strong></div>
      <div class="field"><span>Case closeout time</span><strong>${escapeHtml(caseClosedAt || 'Not yet closed')}</strong></div>
    </section>
    <div class="signature"><div>Authorized clinician signature (not captured in this demo)</div><div>Date / time</div></div>
    <footer>This synthetic prototype document is for interface demonstration only. It is not a prescription, discharge order, authenticated signature, or substitute for the official patient record. Verify all clinical details and use approved hospital systems.</footer>
  </main>
</body>
</html>`;
    downloadLocalFile(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }), 'surgical-case-summary-demo.html');
    setClinicalDocumentDownloaded(true);
  };

  const completeCaseCloseout = () => {
    if (!noteReviewed || !signatureConfirmed || !signerName.trim() ||
      !handoverConfirmed || !receiverName.trim() ||
      events.some((event) => event.status === 'pending') ||
      medicationOrders.some(hasIncompleteMedicationOrder) ||
      (followUpDays && (!Number.isInteger(Number(followUpDays)) || Number(followUpDays) < 1 || Number(followUpDays) > 365)) ||
      caseClosedAt) return;
    const completedAt = new Date();
    setCaseClosedAt(completedAt.toLocaleString());
    if (followUpDays) {
      const scheduledDate = dateAfterDays(localDateString(completedAt), followUpDays);
      if (scheduledDate) {
        const scheduledVisit = {
          id: `scheduled-followup-${Date.now()}`,
          visitDate: scheduledDate,
          visitType: `Post-operative follow-up · ${followUpDays} days`,
          condition: 'Scheduled at case closeout. No visit findings have been recorded.',
          status: 'scheduled',
          followUpDays: Number(followUpDays),
          daysFromCloseout: Number(followUpDays),
          clinician: signerName,
          syntheticDemoData: true,
        };
        setFollowUpPlanDate(scheduledDate);
        setFollowUpVisits((current) => [scheduledVisit, ...current]);
        setSelectedFollowUpId(scheduledVisit.id);
      }
    }
  };

  const addAuditEntry = () => {
    const text = addendumText.trim();
    if (!text || !caseClosedAt) return;
    setAddenda((current) => [...current, {
      id: `${Date.now()}-${current.length}`,
      author: signerName,
      time: new Date().toLocaleString(),
      text,
    }]);
    setAddendumText('');
  };

  const addMedicationOrder = () => {
    setMedicationOrders((current) => [...current, {
      id: `medication-${Date.now()}-${current.length}`,
      medication: '',
      strength: '',
      dose: '',
      route: '',
      frequency: '',
      duration: '',
      quantity: '',
    }]);
  };

  const updateMedicationOrder = (id, field, value) => {
    setMedicationOrders((current) => current.map((order) => (
      order.id === id ? { ...order, [field]: value } : order
    )));
  };

  const removeMedicationOrder = (id) => {
    setMedicationOrders((current) => current.filter((order) => order.id !== id));
  };

  const saveFollowUpVisit = (visit) => {
    const { completedScheduleId, ...visitDetails } = visit;
    const record = {
      ...visitDetails,
      id: completedScheduleId || `${Date.now()}-${followUpVisits.length}`,
      clinician: patient.surgeon,
      status: 'attended',
      syntheticDemoData: true,
    };
    setFollowUpVisits((current) => completedScheduleId
      ? current.map((item) => item.id === completedScheduleId ? record : item)
      : [record, ...current]);
    setSelectedFollowUpId(record.id);
  };

  const handleMediaUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaUrl(URL.createObjectURL(file));
    setMediaName(file.name);
    setMediaMode('recording');
  };

  const sendMessage = (event, overrideText) => {
    event?.preventDefault();
    const text = (overrideText ?? chatInput).trim();
    if (!text) return;
    setChatMessages((current) => [...current, { role: 'user', text }]);
    setChatInput('');
    window.setTimeout(() => {
      const normalized = text.toLowerCase();
      let response = 'I could not find a matching verified event. Please rephrase the question or review the surgical timeline.';

      if (normalized.includes('blood loss') || normalized.includes('bleeding') || normalized.includes('haemorrhage') || normalized.includes('hemorrhage')) {
        response = 'Estimated blood loss is 180 mL in this synthetic case record. Confirm the value with the anaesthesia and surgical teams.';
      } else if (normalized.includes('allerg') || normalized.includes('allergy')) {
        response = 'A latex allergy is documented, with contact urticaria reported. Avoid latex products and verify the imported patient record before use.';
      } else if (normalized.includes('next step') || normalized.includes('next stage') || normalized.includes('what now')) {
        response = 'The case is in the implantation phase. Confirm the femoral component and planned insert with the surgeon before proceeding.';
      } else if (normalized.includes('patient') || normalized.includes('procedure')) {
        response = 'This synthetic demo case is for a 58-year-old patient undergoing right total knee replacement in OT-3 with Dr. Arjun Mehta.';
      }

      setChatMessages((current) => [...current, {
        role: 'assistant',
        text: response,
      }]);
    }, 650);
  };

  const navItems = [
    { label: 'Pre-op context', icon: Users, step: 0 },
    { label: 'Live case', icon: Activity, step: 1 },
    { label: 'Review queue', icon: ClipboardList, step: 2 },
    { label: 'Operative note', icon: FileText, step: 3 },
    { label: 'Case summary', icon: LayoutDashboard, step: 4 },
    { label: 'Closeout & handover', icon: Check, step: 5 },
    { label: 'Follow-up', icon: CalendarDays, workspace: 'followup' },
  ];

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Stethoscope size={21} /></div>
          <div><strong>Neurova</strong><span>AI OPERATING ASSISTANT</span></div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, step, workspace }) => (
            <button
              key={label}
              className={(workspace ? activeWorkspace === workspace : activeWorkspace === 'case' && workflowStep === step) ? 'nav-item active' : 'nav-item'}
              disabled={!workspace && (step > workflowStep || (caseClosedAt && step !== workflowStep))}
              onClick={() => {
                setSidebarOpen(false);
                if (workspace) {
                  setActiveWorkspace(workspace);
                } else if (step <= workflowStep && (!caseClosedAt || step === workflowStep)) {
                  setActiveWorkspace('case');
                  setWorkflowStep(step);
                }
              }}
            >
              <Icon size={18} /><span>{label}</span>
              {(workspace ? activeWorkspace === workspace : activeWorkspace === 'case' && workflowStep === step) && <span className="live-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item"><CircleHelp size={18} /><span>Help &amp; support</span></button>
          <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
          <div className="clinician">
            <div className="avatar">AM</div>
            <div><strong>Dr. Arjun Mehta</strong><span>Lead Surgeon</span></div>
            <MoreHorizontal size={17} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <div className="breadcrumb"><span>{activeWorkspace === 'followup' ? 'Follow-up' : ['Pre-op context', 'Live case', 'Review queue', 'Operative note', 'Case summary', 'Closeout & handover'][workflowStep]}</span><ChevronRight size={15} /><strong>OT-3</strong></div>
          </div>
          <div className="topbar-actions">
            <div className={`session-clock ${sessionEnded ? 'ended' : ''}`}><span className="pulse" /><span>{workflowStep === 0 ? 'CASE NOT STARTED' : sessionEnded ? 'CASE ENDED' : 'CASE IN PROGRESS'}</span>{workflowStep > 0 && <strong>{timeString}</strong>}</div>
            <button className="icon-button" aria-label="Notifications" onClick={() => setNotifyOpen((value) => !value)}><Bell size={19} /><span className="notification-dot" /></button>
            {notifyOpen && (
              <div className="notifications">
                <strong>Notifications</strong>
                <p><span className="notice-icon warning"><AlertTriangle size={14} /></span>Event awaiting verification</p>
                <p><span className="notice-icon"><Check size={14} /></span>Patient context synchronized</p>
              </div>
            )}
          </div>
        </header>

        <div className="content">
          <section className="patient-card">
            <button className="back-button" aria-label="Back"><ArrowLeft size={18} /></button>
            <div className="patient-main">
              <div className="patient-avatar">DP</div>
              <div className="patient-name">
                <div><h1>{patient.name}</h1><span className={`status-tag ${sessionEnded ? 'ended' : ''}`}>{workflowStep === 0 ? 'Pre-op review' : sessionEnded ? 'Case ended' : 'Case active'}</span></div>
                <p>{patient.age} M <span>•</span> {patient.id}</p>
              </div>
            </div>
            <div className="procedure-info">
              <span>Current procedure</span>
              <strong>{patient.procedure}</strong>
              <p><span>OT-3</span><span>{patient.surgeon}</span></p>
            </div>
            <button className="icon-button patient-more" aria-label="More patient actions"><MoreHorizontal size={20} /></button>
          </section>

          {activeWorkspace === 'case' && <nav className="workflow-stepper" aria-label="Case workflow">
            {['Pre-op context', 'Live case', 'Review queue', 'Operative note', 'Case summary', 'Closeout & handover'].map((step, index) => (
              <button
                key={step}
                className={`${workflowStep === index ? 'current' : ''} ${workflowStep > index ? 'complete' : ''}`}
                disabled={index > workflowStep || (caseClosedAt && index !== workflowStep)}
                onClick={() => {
                  if (!caseClosedAt) setWorkflowStep(index);
                }}
              >
                <span>{workflowStep > index ? <Check size={13} /> : `0${index + 1}`}</span>{step}
              </button>
            ))}
          </nav>}

          {activeWorkspace === 'case' && workflowStep === 0 && (
            <PreOpContext
              identityVerified={identityVerified}
              onVerify={() => setIdentityVerified(true)}
              onStart={startCase}
            />
          )}

          {activeWorkspace === 'case' && workflowStep === 1 && <section className="dashboard-grid">
            <div className="left-column">
              <div className="section-tabs">
                {['Timeline', 'Procedure', 'Details', 'Media'].map((tab) => (
                  <button key={tab} className={activeTab === tab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>
                    {tab}
                    {tab === 'Timeline' && <span className="tab-count">{events.length}</span>}
                  </button>
                ))}
              </div>

              {activeTab === 'Timeline' && (
                <div className="timeline-card card">
                  <div className="card-header">
                    <div><span className="eyebrow">Surgical timeline</span><h2>Recorded events</h2></div>
                    <div className="filter-wrap">
                      <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter events">
                        <option>All</option>
                        <option>Procedure</option>
                        <option>Medication</option>
                        <option>Milestone</option>
                        <option>Implant</option>
                      </select>
                      <ChevronDown size={15} />
                    </div>
                  </div>
                  <div className="timeline">
                    {filteredEvents.map((item) => (
                      <div className="timeline-row" key={item.id}>
                        <div className="timeline-time">{item.time}</div>
                        <div className={`event-node ${item.type}`}><span /></div>
                        <div className="event-content">
                          <div className="event-heading">
                            <div><strong>{item.title}</strong>{item.status === 'pending' && <span className="review-tag">Review</span>}</div>
                            {item.status === 'verified' ? (
                              <button className="source-button" onClick={() => openReview(item)}><Eye size={13} /> View source</button>
                            ) : (
                              <button className="verify-button" onClick={() => openReview(item)}>Review</button>
                            )}
                          </div>
                          <p>{item.detail}</p>
                          <span className="source">{item.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Procedure' && (
                <div className="card procedure-card">
                  <div className="card-header"><div><span className="eyebrow">Surgical plan</span><h2>Procedure progress</h2></div><strong className="progress-count">3 of 5</strong></div>
                  <div className="progress-track"><span /></div>
                  <div className="steps">
                    {procedureSteps.map((step, index) => (
                      <div className={`step ${step.state}`} key={step.name}>
                        <div className="step-marker">{step.state === 'done' ? <Check size={15} /> : index + 1}</div>
                        <div><strong>{step.name}</strong><span>{step.time}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Details' && (
                <div className="card details-card">
                  <div className="card-header"><div><span className="eyebrow">Patient context</span><h2>Procedure details</h2></div></div>
                  <dl>
                    <div><dt>Known allergies</dt><dd>Latex allergy · contact urticaria</dd></div>
                    <div><dt>Pre-operative diagnosis</dt><dd>Primary osteoarthritis of the right knee</dd></div>
                    <div><dt>Lead surgeon</dt><dd>{patient.surgeon}</dd></div>
                    <div><dt>Anesthetist</dt><dd>{patient.anesthetist}</dd></div>
                  </dl>
                </div>
              )}

              {activeTab === 'Media' && (
                <div className="card media-card">
                  <div className="card-header">
                    <div><span className="eyebrow">Surgical capture</span><h2>{mediaMode === 'synthetic' ? 'Synthetic evidence demo' : 'Uploaded recording'}</h2></div>
                    <div className="media-actions">
                      {mediaUrl && <button className="upload-button" onClick={() => setMediaMode('synthetic')}>Synthetic demo</button>}
                      <label className="upload-button">
                        <Upload size={14} /> Upload recording
                        <input type="file" accept="video/*" onChange={handleMediaUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="media-body">
                    {mediaUrl && mediaMode === 'recording' ? (
                      <video controls src={mediaUrl} className="media-player" />
                    ) : (
                      <SyntheticEvidenceReplay event={events.find((item) => item.status === 'pending') ?? events[0]} />
                    )}
                    {mediaName && mediaMode === 'recording' && <div className="media-file-name"><Video size={13} /> {mediaName}</div>}
                  </div>
                </div>
              )}

              <div className="quick-stats">
                <div className="stat-card"><div className="stat-icon teal"><Activity size={18} /></div><div><span>Estimated blood loss</span><strong>180 mL</strong></div><span className="stable-dot" /></div>
                <div className="stat-card"><div className="stat-icon blue"><PackageCheck size={18} /></div><div><span>Implant tracker</span><strong>2 / 3</strong></div></div>
                <div className="stat-card"><div className="stat-icon amber"><AlertTriangle size={18} /></div><div><span>Pending review</span><strong>{events.filter((event) => event.status === 'pending').length}</strong></div></div>
              </div>
            </div>

            <aside className="right-column">
              <div className="assistant-card">
                <div className="assistant-header">
                  <div className="ai-avatar"><Activity size={17} /></div>
                  <div><h2>SurgiSync AI</h2><span><i /> Context active</span></div>
                  <button className="icon-button small" aria-label="Collapse assistant"><PanelLeftClose size={16} /></button>
                </div>
                <div className="suggestions">
                  {['Allergies', 'Blood loss', 'Next step'].map((item) => (
                    <button
                      key={item}
                      onClick={() => sendMessage(null, item === 'Allergies'
                        ? 'Does the patient have any known allergies?'
                        : item === 'Blood loss'
                          ? 'What is the current blood loss?'
                          : 'What is the next procedure step?')}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="chat-messages">
                  {chatMessages.map((message, index) => (
                    <div className={`message ${message.role}`} key={index}>{message.text}</div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form className="chat-form" onSubmit={sendMessage}>
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about this patient..." aria-label="Message SurgiSync AI" />
                  <button type="button" className="mic-button" aria-label="Start voice input"><Mic size={17} /></button>
                  <button type="submit" className="send-button" aria-label="Send message"><ChevronRight size={18} /></button>
                </form>
              </div>

              <div className="session-controls">
                {sessionEnded ? (
                  <>
                    <button className="session-ended-button" disabled><Check size={15} /> Session ended</button>
                    <button className="end-button" onClick={() => setWorkflowStep(2)}><ClipboardList size={14} /> Review queue</button>
                  </>
                ) : (
                  <>
                    <button className={sessionRunning ? 'pause-button' : 'resume-button'} onClick={() => setSessionRunning((value) => !value)}>
                      {sessionRunning ? <><X size={16} /> Pause capture</> : <><Play size={16} /> Resume capture</>}
                    </button>
                    <button className="end-button" onClick={endSession}>End session</button>
                  </>
                )}
              </div>
            </aside>
          </section>}

          {activeWorkspace === 'case' && workflowStep === 2 && (
            <ReviewQueue
              events={events}
              notePreview={buildDraftNote(events)}
              onAccept={verifyEvent}
              onReject={rejectEvent}
              onEdit={(event) => openReview(event, true)}
              onEvidence={(event) => openReview(event)}
              onApproveHigh={approveHighConfidence}
              onGenerate={generateNote}
            />
          )}

          {activeWorkspace === 'case' && workflowStep === 3 && (
            <OperativeNote
              note={draftText}
              onChange={(value) => {
                setDraftText(value);
                setDraftSaved(false);
                setNoteReviewed(false);
                setSignatureConfirmed(false);
              }}
              onSave={() => setDraftSaved(true)}
              saved={draftSaved}
              onExport={exportDraft}
              onSign={completeNoteReview}
              readOnly={Boolean(caseClosedAt)}
              onReadOnlyBack={() => setWorkflowStep(4)}
            />
          )}

          {activeWorkspace === 'case' && workflowStep === 4 && (
            <CaseSummary
              events={events}
              elapsed={elapsed}
              signed={noteReviewed}
              onBack={() => setWorkflowStep(3)}
              onContinue={() => setWorkflowStep(5)}
            />
          )}

          {activeWorkspace === 'case' && workflowStep === 5 && (
            <CaseCloseout
              events={events}
              noteReviewed={noteReviewed}
              signerName={signerName}
              onSignerNameChange={setSignerName}
              signatureConfirmed={signatureConfirmed}
              onSignatureChange={setSignatureConfirmed}
              receiverName={receiverName}
              onReceiverNameChange={setReceiverName}
              handoverConfirmed={handoverConfirmed}
              onHandoverChange={setHandoverConfirmed}
              exportDownloaded={exportDownloaded}
              clinicalDocumentDownloaded={clinicalDocumentDownloaded}
              onDownload={downloadClinicalSummary}
              onDownloadJson={exportCaseBundle}
              followUpDays={followUpDays}
              onFollowUpDaysChange={setFollowUpDays}
              followUpDate={plannedFollowUpDate ? formatDate(plannedFollowUpDate) : ''}
              postoperativeInstructions={postoperativeInstructions}
              onPostoperativeInstructionsChange={setPostoperativeInstructions}
              medicationOrders={medicationOrders}
              onAddMedicationOrder={addMedicationOrder}
              onUpdateMedicationOrder={updateMedicationOrder}
              onRemoveMedicationOrder={removeMedicationOrder}
              caseClosed={Boolean(caseClosedAt)}
              closedAt={caseClosedAt}
              onCloseCase={completeCaseCloseout}
              onFollowUp={() => setActiveWorkspace('followup')}
              addendumText={addendumText}
              onAddendumChange={setAddendumText}
              addenda={addenda}
              onAddendumSave={addAuditEntry}
              onSummary={() => setWorkflowStep(4)}
            />
          )}
          {activeWorkspace === 'followup' && (
            <FollowUpTracker
              visits={followUpVisits}
              selectedVisitId={selectedFollowUpId}
              onSelectVisit={setSelectedFollowUpId}
              onSaveVisit={saveFollowUpVisit}
              events={events}
            />
          )}
        </div>
      </main>
      {reviewEvent && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setReviewEvent(null);
        }}>
          <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <div className="review-modal-header">
              <div><span className="eyebrow">Human verification</span><h2 id="review-title">{reviewEvent.title}</h2></div>
              <button className="icon-button" aria-label="Close review" onClick={() => setReviewEvent(null)}><X size={17} /></button>
            </div>
            <div className="review-modal-body">
              <div className="evidence-preview">
                <SyntheticEvidenceReplay key={reviewEvent.id} event={reviewEvent} />
              </div>
              <div className="review-details">
                <dl>
                  <div>
                    <dt>Recorded detail</dt>
                    <dd>{reviewEditing ? (
                      <textarea className="review-detail-editor" value={reviewDetail} onChange={(event) => setReviewDetail(event.target.value)} aria-label="Edit event detail" />
                    ) : reviewEvent.detail}</dd>
                  </div>
                  <div><dt>Timestamp</dt><dd>{reviewEvent.time}</dd></div>
                  <div><dt>Source</dt><dd>{reviewEvent.source}</dd></div>
                  <div><dt>Status</dt><dd><span className={reviewEvent.status === 'verified' ? 'status-verified' : 'status-review'}>{reviewEvent.status === 'verified' ? 'Verified' : 'Awaiting review'}</span></dd></div>
                </dl>
              </div>
            </div>
            {reviewEvent.status !== 'verified' && (
              <div className="review-actions">
                <button className="reject-button" onClick={() => setReviewEvent(null)}>Keep pending</button>
                <button className="approve-button" onClick={() => {
                  verifyEvent(reviewEvent.id);
                  setReviewEvent(null);
                }}><Check size={15} /> {reviewEditing ? 'Save edit & accept' : 'Approve & verify'}</button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
