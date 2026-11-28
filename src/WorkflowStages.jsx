import React, { useState } from 'react';
import { Activity, AlertTriangle, CalendarDays, Check, ChevronRight, ClipboardList, Download, Eye, FileText, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';

const demoPatient = {
  name: 'Demo Patient',
  id: 'UHID MH-24-018642',
  age: 58,
  procedure: 'RIGHT Total Knee Replacement',
  surgeon: 'Dr. Arjun Mehta',
  anesthetist: 'Dr. N. Iyer',
  nurse: 'Sr. Nurse R. Shah',
};

function PatientSummary() {
  return (
    <div className="workflow-patient-summary">
      <div><span>Patient</span><strong>{demoPatient.name}</strong><small>58 M · {demoPatient.id}</small></div>
      <div><span>Procedure</span><strong>{demoPatient.procedure}</strong></div>
      <div><span>Location</span><strong>OT-3 · 12 Feb 2025</strong></div>
    </div>
  );
}

export function PreOpContext({ identityVerified, onVerify, onStart }) {
  return (
    <section className="workflow-page">
      <div className="workflow-page-heading">
        <div><span className="eyebrow">Pre-operative safety check</span><h2>Patient context</h2><p>Verify imported context before the patient enters the operative phase.</p></div>
        <span className="imported-tag">Imported · HIMS</span>
      </div>
      <PatientSummary />
      <div className="allergy-alert"><AlertTriangle size={18} /><div><strong>LATEX ALLERGY</strong><span>Documented reaction: contact urticaria · Imported from HIMS 08:58:14</span></div></div>
      <div className="preop-grid">
        <article className="workflow-panel implant-table-panel">
          <div className="workflow-panel-heading"><h3>01 · Planned implants</h3><span>HIMS · 08:58:14</span></div>
          <div className="table-scroll"><table><thead><tr><th>Component</th><th>Planned</th><th>Opened</th><th>Implanted</th><th>Status</th></tr></thead><tbody>
            <tr><td>Femoral component</td><td>Size 4 · Right</td><td>—</td><td>—</td><td><span className="planned-tag">◇ Planned</span></td></tr>
            <tr><td>Tibial baseplate</td><td>Size 3</td><td>—</td><td>—</td><td><span className="planned-tag">◇ Planned</span></td></tr>
            <tr><td>Polyethylene insert</td><td>9 mm</td><td>—</td><td>—</td><td><span className="planned-tag">◇ Planned</span></td></tr>
          </tbody></table></div>
        </article>
        <article className="workflow-panel">
          <div className="workflow-panel-heading"><h3>02 · Recent laboratory</h3><span>HIMS</span></div>
          <div className="lab-grid"><div><span>Haemoglobin</span><strong>12.8 g/dL</strong></div><div><span>Platelets</span><strong>248 ×10³/µL</strong></div><div><span>INR</span><strong>1.02</strong></div></div>
          <p className="sync-caption">Last synced 09:01:22 · HIMS connection healthy</p>
        </article>
        <article className="workflow-panel">
          <div className="workflow-panel-heading"><h3>03 · Previous surgery</h3><span>HIMS</span></div>
          <strong className="panel-emphasis">Left knee arthroplasty</strong><p className="panel-copy">18 Aug 2023 · No documented complication</p>
          <div className="document-chip">Discharge summary · Imported</div>
        </article>
        <article className="workflow-panel">
          <div className="workflow-panel-heading"><h3>04 · Imaging summary</h3><span>Radiology · 10 Feb</span></div>
          <p className="panel-copy">Severe tricompartmental osteoarthritis. Varus deformity. No acute osseous abnormality.</p>
        </article>
        <article className="workflow-panel team-panel">
          <div className="workflow-panel-heading"><h3>05 · Surgical team</h3><span>Assigned</span></div>
          <div className="team-list"><span>Lead surgeon<strong>{demoPatient.surgeon}</strong></span><span>Anaesthesia<strong>{demoPatient.anesthetist}</strong></span><span>Circulating nurse<strong>{demoPatient.nurse}</strong></span></div>
        </article>
      </div>
      <div className={`identity-check ${identityVerified ? 'confirmed' : ''}`}>
        <ShieldCheck size={19} /><div><strong>{identityVerified ? 'Demo identity check acknowledged' : 'Identity verification required'}</strong><span>Confirm name, UHID, procedure and operative side with two identifiers. This demo does not check a wristband or connect to HIMS.</span></div>
        <button className="secondary-action" onClick={onVerify}>{identityVerified ? 'Acknowledged ✓' : 'Record demo check'}</button>
      </div>
      <div className="stage-actions"><button className="primary-action" disabled={!identityVerified} onClick={onStart}>Start case <ChevronRight size={16} /></button></div>
    </section>
  );
}

export function ReviewQueue({ events, notePreview, onAccept, onReject, onEdit, onEvidence, onApproveHigh, onGenerate }) {
  const pending = events.filter((event) => event.status === 'pending');
  const reviewable = events.filter((event) => event.needsReview);
  const resolved = reviewable.filter((event) => event.status !== 'pending').length;
  const confirmed = events.filter((event) => event.status === 'verified').length;
  const rejected = events.filter((event) => event.status === 'rejected').length;
  const percentage = reviewable.length ? Math.round((resolved / reviewable.length) * 100) : 100;
  const canGenerate = pending.length === 0;
  return (
    <section className="workflow-page">
      <div className="workflow-page-heading">
        <div><span className="eyebrow">End-of-case review</span><h2>{pending.length} {pending.length === 1 ? 'item needs' : 'items need'} review</h2><p>{events.length} captured · {confirmed} confirmed{rejected ? ` · ${rejected} rejected` : ''} · {pending.length} pending</p></div>
        <div className="review-progress"><strong>{percentage}%</strong><span>reviewed</span></div>
      </div>
      <PatientSummary />
      <div className="review-layout">
        <div className="workflow-panel review-list-panel">
          <div className="workflow-panel-heading"><h3>Uncertain items</h3><button className="text-action" onClick={onApproveHigh} disabled={!pending.some((event) => event.confidence >= 90)}>Approve high-confidence only</button></div>
          {pending.length === 0 ? <div className="empty-review"><Check size={20} /><strong>All captured items reviewed</strong><span>Continue to generate the operative note.</span></div> : pending.map((event, index) => (
            <article className="review-queue-item" key={event.id}>
              <div className="review-item-top"><span className="review-index">{String(index + 1).padStart(2, '0')}</span><time>{event.time}</time><span className="review-tag">Review required</span></div>
              <h4>{event.title}</h4><p>{event.detail}</p>
              <div className="review-item-meta"><span>{event.source.toUpperCase()}</span><span>Confidence <strong>{event.confidence}%</strong></span><button className="source-button" onClick={() => onEvidence(event)}><Eye size={13} /> View evidence</button></div>
              <div className="review-item-actions">
                <button className="approve-button" onClick={() => onAccept(event.id)}><Check size={14} /> Accept</button>
                <button className="edit-action" onClick={() => onEdit(event)}>Edit</button>
                <button className="reject-button" onClick={() => onReject(event.id)}>Reject</button>
              </div>
            </article>
          ))}
        </div>
        <aside className="workflow-panel note-preview-panel">
          <div className="workflow-panel-heading"><div><span className="eyebrow">Live note preview</span><strong>Draft · Auto-saved</strong></div><span className={canGenerate ? 'status-verified' : 'status-review'}>{canGenerate ? 'Ready to generate' : 'Review required'}</span></div>
          <div className="note-preview-content"><h3>Operative Note</h3><p><strong>Patient</strong><br />Demo Patient · 58 M</p><p><strong>Procedure</strong><br />Right total knee replacement</p><h4>Confirmed events</h4><pre>{notePreview}</pre></div>
          <div className="generate-note-footer"><span>{pending.length} items must be reviewed before generation</span><button className="primary-action" disabled={!canGenerate} onClick={onGenerate}>Generate operative note <FileText size={14} /></button></div>
        </aside>
      </div>
    </section>
  );
}

export function OperativeNote({ note, onChange, onSave, saved, onExport, onSign, readOnly, onReadOnlyBack }) {
  return (
    <section className="workflow-page">
      <div className="workflow-page-heading">
        <div><span className="eyebrow">Post-operative documentation</span><h2>Operative note</h2><p>Generated from confirmed case events. Review source markers before sign-off.</p></div>
        <span className="status-review">Review required</span>
      </div>
      <PatientSummary />
      <div className="operative-layout">
        <aside className="workflow-panel document-sections"><span>Document sections</span>{['Procedure details', 'Pre-operative diagnosis', 'Operative findings', 'Procedure', 'Implants', 'Blood loss & specimens', 'Closure'].map((section, index) => <a href={`#note-section-${index}`} key={section}>{String(index + 1).padStart(2, '0')} {section}</a>)}<div className="version-history"><strong>Version history</strong><span>v1.0 · Current</span><small>Generated from confirmed events</small></div></aside>
        <article className="workflow-panel operative-note-paper">
          <div className="note-paper-heading"><span>Operative note · draft</span><h3>Right Total Knee Replacement</h3><small>Case ORB-DEMO-003 · 12 February 2025</small></div>
          <div className="note-source-legend"><span>H HIMS</span><span>V Video</span><span>A Audio</span><span>B Barcode</span><span>C Confirmed</span></div>
          <div className="operative-section" id="note-section-0"><h4>Pre-operative diagnosis</h4><p>Primary osteoarthritis of the right knee. <sup>H</sup></p></div>
          <div className="operative-section" id="note-section-1"><h4>Procedure &amp; findings</h4><textarea aria-label="Edit operative note draft" value={note} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} /></div>
          <div className="operative-section" id="note-section-2"><h4>Implants</h4><p>Review the implant tracker and confirm all component details before signing. <sup>B</sup></p></div>
          <div className="operative-section" id="note-section-3"><h4>Blood loss &amp; specimens</h4><p>Estimated blood loss: 180 mL. Specimen disposition: Not documented. <sup>A</sup></p></div>
          <div className="operative-section" id="note-section-4"><h4>Closure</h4><p>Closure details require confirmation by the operating team before finalization.</p></div>
        </article>
      </div>
      <div className="note-signoff-bar"><div><AlertTriangle size={17} /><span><strong>{readOnly ? 'Case closed — note is read-only' : 'Draft — not signed'}</strong><small>Clinical review and authorized signature required. Demo sign-off does not create a medical record.</small></span></div><div>{readOnly && <button className="secondary-action" onClick={onReadOnlyBack}>Return to case summary</button>}<button className="secondary-action" onClick={onExport}>Export draft</button><button className="primary-action" onClick={onSave} disabled={readOnly}>{saved ? 'Draft saved' : 'Save draft'}</button><button className="signoff-action" onClick={onSign} disabled={readOnly}>Review &amp; sign</button></div></div>
    </section>
  );
}

export function CaseSummary({ events, elapsed, signed, onBack, onContinue }) {
  const verified = events.filter((event) => event.status === 'verified').length;
  const rejected = events.filter((event) => event.status === 'rejected').length;
  const unresolved = events.filter((event) => event.status === 'pending').length;
  const minutes = Math.max(Math.floor(elapsed / 60), 95);
  const seconds = minutes === 95 ? 32 : 0;
  return (
    <section className="workflow-page">
      <div className="workflow-page-heading">
        <div><span className="eyebrow">Case summary · ORB-DEMO-003</span><h2>Case summary</h2><p>Coverage, duration and documentation traceability for clinical audit.</p></div>
        <span className={signed ? 'status-verified' : 'status-review'}>{signed ? 'Demo review complete' : 'Review required'}</span>
      </div>
      <PatientSummary />
      <div className="summary-metrics">
        <article><span>Total case time</span><strong>{String(Math.floor(minutes / 60)).padStart(2, '0')}:{String(minutes % 60).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</strong><small>09:43–11:18 · synthetic demo</small></article>
        <article><span>Tourniquet time</span><strong>01:07:18</strong><small>Within configured 90 min limit</small></article>
        <article><span>Estimated blood loss</span><strong>180 mL</strong><small>Confirmed in demo data</small></article>
        <article><span>Documentation</span><strong>{unresolved ? 'Needs review' : '100%'}</strong><small>{unresolved} unresolved items</small></article>
      </div>
      <div className="summary-layout">
        <article className="workflow-panel">
          <div className="workflow-panel-heading"><h3>01 · Phase duration</h3><span>Confirmed timeline</span></div>
          {['Preparation · 12 min', 'Approach · 19 min', 'Bone preparation · 28 min', 'Implantation · 23 min', 'Closure · 14 min'].map((phase, index) => <div className="phase-row" key={phase}><span>{phase.split(' · ')[0]}</span><div><i style={{ width: `${[36, 57, 84, 70, 43][index]}%` }} /></div><strong>{phase.split(' · ')[1]}</strong></div>)}
          <p className="coverage-gap">Coverage gaps · Camera occluded 10:23–10:27 · Audio unavailable 10:56–10:58</p>
        </article>
        <article className="workflow-panel">
          <div className="workflow-panel-heading"><h3>02 · Event sources</h3><span>Traceable</span></div>
          <div className="source-counts"><span>Video<strong>10 events</strong></span><span>Audio<strong>8 events</strong></span><span>Barcode<strong>3 events</strong></span><span>HIMS<strong>6 records</strong></span><span>Manual<strong>2 events</strong></span></div>
        </article>
        <article className="workflow-panel audit-panel">
          <div className="workflow-panel-heading"><h3>03 · Documentation audit</h3><span>{unresolved ? 'Review required' : 'Complete'}</span></div>
          <p><Check size={15} /> {events.length} captured events · {verified} confirmed · {rejected} rejected · {unresolved} unresolved</p>
          <p><FileText size={15} /> {signed ? 'Demo review recorded' : 'Operative note remains an unsigned draft'}</p>
          <p>Specimen disposition · Not documented · explicitly preserved in note</p>
        </article>
      </div>
      <div className="stage-actions"><button className="secondary-action" onClick={onBack}>Return to operative note</button><button className="primary-action" onClick={onContinue}>Continue to closeout <ChevronRight size={15} /></button></div>
    </section>
  );
}

function todayForDateInput() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function FollowUpTracker({ visits, selectedVisitId, onSelectVisit, onSaveVisit, events }) {
  const [query, setQuery] = useState('');
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [form, setForm] = useState({
    visitDate: todayForDateInput(),
    visitType: 'Post-operative follow-up',
    condition: '',
    painScore: '',
    mobility: '',
    incision: '',
    nextVisitDate: '',
  });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredVisits = visits.filter((visit) => (
    `${demoPatient.name} ${demoPatient.id} ${visit.visitType} ${visit.condition} ${visit.visitDate}`
      .toLowerCase()
      .includes(normalizedQuery)
  ));
  const selectedVisit = filteredVisits.find((visit) => visit.id === selectedVisitId) || filteredVisits[0];
  const confirmedEvents = events.filter((event) => event.status === 'verified').slice(0, 3);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleVisitForm = () => {
    if (creatingVisit) {
      setCreatingVisit(false);
      setEditingScheduleId(null);
      return;
    }
    if (selectedVisit?.status === 'scheduled') {
      setForm((current) => ({
        ...current,
        visitDate: selectedVisit.visitDate,
        visitType: selectedVisit.visitType,
      }));
      setEditingScheduleId(selectedVisit.id);
    } else {
      setEditingScheduleId(null);
    }
    setCreatingVisit(true);
  };

  const submitVisit = (event) => {
    event.preventDefault();
    const condition = form.condition.trim();
    if (!condition) return;
    onSaveVisit({ ...form, condition, completedScheduleId: editingScheduleId });
    setForm({
      visitDate: todayForDateInput(),
      visitType: 'Post-operative follow-up',
      condition: '',
      painScore: '',
      mobility: '',
      incision: '',
      nextVisitDate: '',
    });
    setCreatingVisit(false);
    setEditingScheduleId(null);
  };

  return (
    <section className="workflow-page followup-page">
      <div className="workflow-page-heading">
        <div><span className="eyebrow">Post-operative care</span><h2>Follow-up tracker</h2><p>Review the operation at a glance and record clinician-entered follow-up visits.</p></div>
        <button className="primary-action" onClick={toggleVisitForm}><Plus size={14} /> {creatingVisit ? 'Cancel visit' : selectedVisit?.status === 'scheduled' ? 'Record this visit' : 'Add follow-up visit'}</button>
      </div>
      <div className="demo-notice"><AlertTriangle size={15} /><span>Synthetic demo record. Visit notes stay in this page session and are not saved to a clinical record or EHR.</span></div>
      <div className="followup-overview">
        <article className="workflow-panel followup-visit-list">
          <div className="workflow-panel-heading"><h3>Patients &amp; visit history</h3><span>{visits.length} {visits.length === 1 ? 'record' : 'records'}</span></div>
          <label className="followup-search">
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient or visit" aria-label="Search patients and follow-up visits" />
          </label>
          <div className="followup-records">
            {filteredVisits.map((visit) => (
              <button
                className={`followup-record ${selectedVisit?.id === visit.id ? 'selected' : ''}`}
                key={visit.id}
                onClick={() => onSelectVisit(visit.id)}
              >
                <span className="followup-record-icon"><CalendarDays size={15} /></span>
                <span className="followup-record-copy"><strong>{demoPatient.name}</strong><small>{visit.visitType}</small><small>{new Date(`${visit.visitDate}T00:00:00`).toLocaleDateString()}</small></span>
                <span className={visit.status === 'scheduled' ? 'followup-scheduled' : 'followup-attended'}>{visit.status === 'scheduled' ? 'Scheduled' : 'Visited'}</span>
              </button>
            ))}
            {filteredVisits.length === 0 && <p className="followup-empty">No follow-up visits match this search.</p>}
          </div>
        </article>

        <div className="followup-detail">
          <article className="workflow-panel surgery-snapshot">
            <div className="workflow-panel-heading"><h3><Activity size={14} /> Surgery at a glance</h3><span>ORB-DEMO-003</span></div>
            <div className="surgery-snapshot-grid">
              <div><span>Procedure</span><strong>{demoPatient.procedure}</strong></div>
              <div><span>Surgery date</span><strong>12 Feb 2025</strong></div>
              <div><span>Surgeon</span><strong>{demoPatient.surgeon}</strong></div>
              <div><span>Estimated blood loss</span><strong>180 mL · demo data</strong></div>
            </div>
            <div className="surgery-highlights">
              <strong>Confirmed operative events</strong>
              {confirmedEvents.map((event) => <p key={event.id}><Check size={12} /><span>{event.time} · {event.title}</span></p>)}
              {confirmedEvents.length === 0 && <p>No events are marked confirmed in this session.</p>}
            </div>
          </article>

          {creatingVisit && (
            <form className="workflow-panel followup-form" onSubmit={submitVisit}>
              <div className="workflow-panel-heading"><h3>{editingScheduleId ? 'Record the scheduled visit' : 'Record a follow-up visit'}</h3><span>Clinician entered</span></div>
              <div className="followup-form-grid">
                <label>Visit date<input type="date" value={form.visitDate} onChange={(event) => updateForm('visitDate', event.target.value)} required /></label>
                <label>Visit type<input value={form.visitType} onChange={(event) => updateForm('visitType', event.target.value)} required /></label>
                <label>Patient-reported pain<input value={form.painScore} onChange={(event) => updateForm('painScore', event.target.value)} placeholder="Optional, e.g. 3/10" /></label>
                <label>Mobility / function<input value={form.mobility} onChange={(event) => updateForm('mobility', event.target.value)} placeholder="Clinician-entered observation" /></label>
                <label className="followup-wide">Current condition &amp; clinician notes<textarea value={form.condition} onChange={(event) => updateForm('condition', event.target.value)} placeholder="Record the patient's current condition and relevant clinician observations" required /></label>
                <label>Incision / wound observation<input value={form.incision} onChange={(event) => updateForm('incision', event.target.value)} placeholder="Optional clinician observation" /></label>
                <label>Planned next follow-up<input type="date" value={form.nextVisitDate} onChange={(event) => updateForm('nextVisitDate', event.target.value)} /></label>
              </div>
              <div className="followup-form-footer"><span>Enter verified findings; this prototype does not assess or recommend treatment.</span><button className="primary-action" type="submit"><Check size={14} /> Save demo visit</button></div>
            </form>
          )}

          {selectedVisit ? (
            <article className="workflow-panel followup-current">
              <div className="workflow-panel-heading"><h3><ClipboardList size={14} /> {selectedVisit.status === 'scheduled' ? 'Upcoming follow-up' : 'Visit details'}</h3><span>{selectedVisit.syntheticDemoData ? 'Synthetic example' : 'Demo session record'}</span></div>
              <div className="followup-detail-meta"><strong>{selectedVisit.visitType}</strong><span>{new Date(`${selectedVisit.visitDate}T00:00:00`).toLocaleDateString()} · {selectedVisit.clinician}</span></div>
              {selectedVisit.status === 'scheduled' ? (
                <>
                  <p className="followup-condition">{selectedVisit.condition}</p>
                  <div className="followup-schedule-callout"><CalendarDays size={14} /> {selectedVisit.daysFromCloseout} days after closeout · automatically added to the tracker</div>
                </>
              ) : (
                <>
                  <p className="followup-condition">{selectedVisit.condition}</p>
                  <div className="followup-observations">
                    {selectedVisit.painScore && <div><span>Patient-reported pain</span><strong>{selectedVisit.painScore}</strong></div>}
                    {selectedVisit.mobility && <div><span>Mobility / function</span><strong>{selectedVisit.mobility}</strong></div>}
                    {selectedVisit.incision && <div><span>Incision / wound</span><strong>{selectedVisit.incision}</strong></div>}
                    {selectedVisit.nextVisitDate && <div><span>Next follow-up</span><strong>{new Date(`${selectedVisit.nextVisitDate}T00:00:00`).toLocaleDateString()}</strong></div>}
                  </div>
                  <p className="followup-author-note"><FileText size={13} /> Clinician-entered visit information; confirm against the approved patient record.</p>
                </>
              )}
            </article>
          ) : !creatingVisit && (
            <article className="workflow-panel followup-current followup-empty-state">
              <CalendarDays size={21} />
              <strong>No visit selected</strong>
              <span>Select a visit or add a new follow-up entry.</span>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

export function CaseCloseout({
  events, noteReviewed, signerName, onSignerNameChange, signatureConfirmed, onSignatureChange,
  receiverName, onReceiverNameChange, handoverConfirmed, onHandoverChange,
  exportDownloaded, clinicalDocumentDownloaded, onDownload, onDownloadJson,
  followUpDays, onFollowUpDaysChange, followUpDate, postoperativeInstructions, onPostoperativeInstructionsChange,
  medicationOrders, onAddMedicationOrder, onUpdateMedicationOrder, onRemoveMedicationOrder,
  caseClosed, closedAt, onCloseCase, onFollowUp,
  addendumText, onAddendumChange, addenda, onAddendumSave, onSummary,
}) {
  const pending = events.filter((event) => event.status === 'pending');
  const validFollowUpDays = !followUpDays || (Number.isInteger(Number(followUpDays)) && Number(followUpDays) >= 1 && Number(followUpDays) <= 365);
  const incompleteMedicationOrders = medicationOrders.filter((order) => {
    const fields = ['medication', 'strength', 'dose', 'route', 'frequency', 'duration'];
    return fields.some((field) => !String(order[field]).trim());
  });
  const canClose = Boolean(noteReviewed && signatureConfirmed && signerName.trim() &&
    handoverConfirmed && receiverName.trim() && pending.length === 0 && validFollowUpDays && incompleteMedicationOrders.length === 0);
  return (
    <section className="workflow-page">
      <div className="workflow-page-heading">
        <div><span className="eyebrow">Final stage · case closeout</span><h2>Closeout &amp; handover</h2><p>Reconcile the record, confirm the receiving team, and preserve a traceable closeout receipt.</p></div>
        <span className={caseClosed ? 'status-verified' : 'status-review'}>{caseClosed ? 'Case closed' : 'Closeout pending'}</span>
      </div>
      <PatientSummary />
      {caseClosed && <div className="closed-receipt"><Check size={18} /><div><strong>Demo case closeout recorded</strong><span>{closedAt} · No real clinical signature or EHR transmission was made.</span></div></div>}
      <div className="closeout-grid">
        <article className="workflow-panel reconciliation-panel">
          <div className="workflow-panel-heading"><h3>01 · Final reconciliation</h3><span>{pending.length ? `${pending.length} unresolved` : 'All reviewed'}</span></div>
          <p className="closeout-help">Check each event disposition. Rejected items remain in the audit trail.</p>
          <div className="reconciliation-list">
            {events.map((event) => (
              <div key={event.id}>
                <span className={event.status === 'verified' ? 'recon-check accepted' : event.status === 'rejected' ? 'recon-check rejected' : 'recon-check pending'}>{event.status === 'verified' ? <Check size={12} /> : event.status === 'rejected' ? '!' : '…'}</span>
                <span><strong>{event.title}</strong><small>{event.time} · {event.detail}</small></span>
                <b>{event.status === 'verified' ? 'Confirmed' : event.status === 'rejected' ? 'Rejected' : 'Pending'}</b>
              </div>
            ))}
          </div>
          {pending.length > 0 && <p className="closeout-warning"><AlertTriangle size={14} /> Return to the review queue and resolve pending items before closeout.</p>}
        </article>

        <div className="closeout-side">
          <article className="workflow-panel signoff-panel">
            <div className="workflow-panel-heading"><h3>02 · Note review acknowledgement</h3><span>{noteReviewed ? 'Reviewed' : 'Not reviewed'}</span></div>
            <p className="closeout-help">This is a demo acknowledgement only. Production sign-off must use authenticated clinician credentials.</p>
            <label className="field-label" htmlFor="signer-name">Reviewing clinician</label>
            <input id="signer-name" className="closeout-input" value={signerName} onChange={(event) => onSignerNameChange(event.target.value)} disabled={caseClosed} />
            <label className="check-row"><input type="checkbox" checked={signatureConfirmed} onChange={(event) => onSignatureChange(event.target.checked)} disabled={caseClosed || !noteReviewed} /><span>I reviewed the generated note for this synthetic demo case.</span></label>
          </article>

          <article className="workflow-panel handover-panel">
            <div className="workflow-panel-heading"><h3>03 · PACU handover</h3><span>{handoverConfirmed ? 'Acknowledged' : 'Awaiting receipt'}</span></div>
            <div className="sbar-summary">
              <p><strong>Situation</strong> Right total knee replacement · case ORB-DEMO-003</p>
              <p><strong>Background</strong> Latex allergy documented · avoid latex products.</p>
              <p><strong>Assessment</strong> Estimated blood loss 180 mL · implant events reconciled in the timeline.</p>
              <p><strong>Handover note</strong> Refer to clinician-approved orders and local PACU protocol. No AI treatment instructions are generated.</p>
            </div>
            <label className="field-label" htmlFor="receiver-name">Receiving team member</label>
            <input id="receiver-name" className="closeout-input" placeholder="Enter receiving clinician or team" value={receiverName} onChange={(event) => onReceiverNameChange(event.target.value)} disabled={caseClosed} />
            <label className="check-row"><input type="checkbox" checked={handoverConfirmed} onChange={(event) => onHandoverChange(event.target.checked)} disabled={caseClosed || !receiverName.trim()} /><span>Handover was acknowledged by the receiving team.</span></label>
          </article>

          <article className="workflow-panel followup-plan-panel">
            <div className="workflow-panel-heading"><h3>04 · Follow-up plan &amp; orders</h3><span>{caseClosed && followUpDays ? 'Added to tracker' : 'Clinician entered'}</span></div>
            <p className="closeout-help">Set an interval to create a scheduled item in Follow-up when closeout is completed. The date is calculated from the closeout date.</p>
            <label className="field-label" htmlFor="follow-up-days">Follow-up interval from case closeout</label>
            <div className="followup-days-field"><input id="follow-up-days" type="number" min="1" max="365" step="1" value={followUpDays} onChange={(event) => onFollowUpDaysChange(event.target.value)} placeholder="Optional" disabled={caseClosed} /><span>days</span></div>
            {followUpDays && <p className={`followup-date-preview ${validFollowUpDays ? '' : 'invalid'}`}>{validFollowUpDays ? `Planned date: ${followUpDate}${caseClosed ? ' · added to tracker' : ' · will be added to tracker on closeout'}` : 'Enter a whole number from 1 to 365.'}</p>}
            <div className="medication-orders-heading"><span>Clinician-entered medication orders</span><button type="button" className="text-action" onClick={onAddMedicationOrder} disabled={caseClosed}><Plus size={12} /> Add order</button></div>
            {medicationOrders.map((order, index) => (
              <div className="medication-order" key={order.id}>
                <div className="medication-order-title"><strong>Medication order {index + 1}</strong><button type="button" className="remove-order-button" onClick={() => onRemoveMedicationOrder(order.id)} disabled={caseClosed} aria-label={`Remove medication order ${index + 1}`}><Trash2 size={12} /></button></div>
                <div className="medication-order-grid">
                  {[
                    ['medication', 'Medication name'],
                    ['strength', 'Strength'],
                    ['dose', 'Dose'],
                    ['route', 'Route'],
                    ['frequency', 'Frequency'],
                    ['duration', 'Duration'],
                    ['quantity', 'Quantity (optional)'],
                  ].map(([field, label]) => (
                    <label key={field}>{label}<input value={order[field]} onChange={(event) => onUpdateMedicationOrder(order.id, field, event.target.value)} placeholder="Clinician-entered" disabled={caseClosed} /></label>
                  ))}
                </div>
              </div>
            ))}
            {incompleteMedicationOrders.length > 0 && <p className="followup-date-preview invalid">Complete or remove incomplete medication orders before closeout.</p>}
            <label className="field-label" htmlFor="postoperative-instructions">Post-operative instructions (clinician entered)</label>
            <textarea id="postoperative-instructions" className="followup-orders-editor" value={postoperativeInstructions} onChange={(event) => onPostoperativeInstructionsChange(event.target.value)} placeholder="Enter only clinician-authorized instructions. No medication or treatment recommendations are generated." disabled={caseClosed} />
          </article>

          <article className="workflow-panel export-panel">
            <div className="workflow-panel-heading"><h3>05 · Clinical document &amp; data export</h3><span>{clinicalDocumentDownloaded || exportDownloaded ? 'Downloaded locally' : 'Local only'}</span></div>
            <p className="closeout-help">No HIMS connector is configured. This prototype does not transmit patient data.</p>
            <button className="secondary-action" onClick={onDownload}><Download size={14} /> Download printable clinical summary</button>
            <button className="secondary-action json-export-button" onClick={onDownloadJson}><Download size={14} /> Download structured JSON</button>
            {clinicalDocumentDownloaded && <small className="export-confirmation">HTML document is print-ready; use Print → Save as PDF if needed.</small>}
            {exportDownloaded && <small className="export-confirmation">Structured JSON bundle prepared locally.</small>}
          </article>
        </div>
      </div>

      {caseClosed && (
        <article className="workflow-panel addendum-panel">
          <div className="workflow-panel-heading"><h3>Traceable addenda</h3><span>Separate audit-trail notes</span></div>
          <label className="field-label" htmlFor="addendum-text">Add a correction or follow-up note</label>
          <textarea id="addendum-text" className="addendum-editor" value={addendumText} onChange={(event) => onAddendumChange(event.target.value)} placeholder="Enter an addendum; do not overwrite the signed draft." />
          <button className="secondary-action" onClick={onAddendumSave} disabled={!addendumText.trim()}>Add to audit trail</button>
          {addenda.map((item) => <p className="addendum-entry" key={item.id}><strong>{item.author} · {item.time}</strong><span>{item.text}</span></p>)}
        </article>
      )}

      {!caseClosed && (
        <div className="stage-actions">
          <button className="primary-action" disabled={!canClose} onClick={onCloseCase}>Complete demo closeout <Check size={15} /></button>
        </div>
      )}
      {caseClosed && <div className="stage-actions"><button className="secondary-action" onClick={onSummary}>View case summary</button>{followUpDays && <button className="primary-action" onClick={onFollowUp}>View scheduled follow-up</button>}</div>}
      {!caseClosed && !canClose && <p className="closeout-gate">Complete note acknowledgement and PACU handover, resolve pending events, enter a valid follow-up interval (or leave it blank), and complete or remove medication orders before closeout.</p>}
    </section>
  );
}
