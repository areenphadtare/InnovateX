# Neurova — Operating Theatre Co-Pilot

> **Neurova** is a silent AI co-pilot for the operating theatre. It builds a source-labelled, time-stamped record of an operation, answers questions about the patient and the plan, and drafts the operative note for clinician review.

**Status:** Hackathon prototype. Uses **synthetic data only**. Not a medical device, not clinically validated, and not for use in real patient care.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Meet Neurova](#meet-neurova)
4. [How It Works](#how-it-works)
5. [Operating Modes](#operating-modes)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)
9. [Running the Demo](#running-the-demo)
10. [API Reference](#api-reference)
11. [Event Model and Safety Rules](#event-model-and-safety-rules)
12. [Edge Cases Handled](#edge-cases-handled)
13. [Testing](#testing)
14. [Prototype Limitations](#prototype-limitations)
15. [Roadmap](#roadmap)
16. [Privacy and Compliance](#privacy-and-compliance)
17. [License](#license)

---

## Overview

Surgical teams often write operative notes later from memory, patient data is scattered across systems, and details such as implant size, tourniquet time and blood loss are easy to miss.

Neurova addresses this without any wearable device or extra work for the surgeon:

- Loads patient and surgical-plan context from HIMS (synthetic JSON in this prototype).
- Records every event with a timestamp, a source, a confidence value and a review status.
- Lets the team ask Neurova questions during or after the case.
- Generates an editable operative note from **confirmed facts only**.

**Demo case:** Right Total Knee Replacement (synthetic patient, latex allergy, planned femoral size 4 and tibial size 3).

---

## Key Features

| Feature | Description |
|---|---|
| Patient context | Allergies, prior surgeries, planned implants, labs and team, each with a "last synced" time |
| Live timeline | Events appear in real time with source chips, confidence and status badges |
| Tourniquet timer | Derived from the start timestamp, so a page refresh never resets it |
| Implant tracker | Planned, opened and implanted are tracked separately |
| Conflict detection | Disagreeing sources (for example audio says size 4, scanner says size 5) are flagged, not guessed |
| Evidence drawer | Shows every source behind one event, plus edit history |
| Review queue | The clinician reviews only uncertain items (Accept, Edit, Reject, with keyboard shortcuts) |
| Operative note | Built from confirmed events, with "Not documented" for gaps and a Draft status until signed |
| Failure handling | Template-note fallback when the AI is offline; coverage-gap markers when video or audio drops |
| Quiet mode | Suppresses non-critical motion and pop-ups during critical phases |

---

## Meet Neurova

Neurova is the conversational and documentation assistant. It is deliberately constrained:

**Neurova does**
- Answer questions from retrieved patient data (allergy, prior surgery, planned implant, labs, tourniquet time).
- Show the source, status and last-updated time with every answer.
- Draft the operative note from confirmed events.
- Reply "Not documented in the available patient context" when information is missing.

**Neurova does not**
- Diagnose, prescribe or recommend treatment.
- Turn an AI observation into a confirmed fact.
- Sign or finalize any document.
- Invent timestamps, implant sizes, medications, blood loss or complications.

Example:

```text
Question: Is the patient allergic to anything?
Neurova:  Latex allergy recorded.
Source:   Synthetic HIMS allergy list
Status:   Imported (active)
Updated:  <last_synced>
```

Critical values (tourniquet duration, timestamps) are computed in code. The LLM is used only to phrase answers and draft the note, and its output passes through a validator.

---

## How It Works

```text
HIMS / anaesthesia / implant scanner / audio / video (simulated feed)
                    |
                    v
          Rules engine (no LLM)
   confidence, dedup, validation, semantics
                    |
                    v
   Append-only event ledger (SQLite) + audit log
                    |
          WebSocket broadcast
                    v
   Next.js dashboard: timeline, timer, Q&A (Neurova)
                    |
                    v
      Review queue -> Note generator -> Validator
                    |
                    v
        Editable note (Draft until clinician signs)
```

Principle: **save to the database first, then broadcast**, so no event is lost. The timeline keeps working even if the LLM, video or audio fails.

---

## Operating Modes

Neurova adapts to existing theatre infrastructure, since not every OT has a usable camera.

| Mode | Inputs | Use case |
|---|---|---|
| 1. Documentation | HIMS, anaesthesia, implant scans, end-of-case review | OTs with no camera or microphone |
| 2. Audio-assisted | Mode 1 plus fixed room microphone | OTs with approved audio |
| 3. Procedure-video | Mode 1 plus read-only laparoscopic/endoscopic feed | Minimally invasive OTs |
| 4. Full observation | All of the above plus approved room cameras | Fully equipped OTs |

The prototype demonstrates Mode 1 with a scripted feed that simulates the other sources.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Design | Figma (variables, Smart Animate) |
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Framer Motion, Lucide |
| Backend | Python 3.12, FastAPI, Uvicorn, Pydantic |
| Database | SQLite via SQLAlchemy (PostgreSQL planned) |
| Real-time | FastAPI WebSockets |
| Rules engine | Plain Python |
| LLM | Any API model, temperature 0 to 0.2 (Neurova) |
| Speech (optional) | Whisper |
| Vision (optional) | OpenCV |
| Testing | pytest, Playwright |

---

## Project Structure

```text
neurova/
├── frontend/
│   ├── app/
│   │   ├── preop/[id]/        # Pre-op context and identity gate
│   │   ├── case/[id]/         # Live OT dashboard
│   │   ├── review/[id]/       # End-of-case review queue
│   │   ├── note/[id]/         # Operative note editor
│   │   └── summary/[id]/      # Insights (optional)
│   ├── components/            # StatusBadge, SourceChip, TimelineRow, ...
│   ├── store/                 # Zustand store
│   └── hooks/                 # useCaseSocket
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/               # cases, events, qa, notes, review, websocket
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic contracts
│   │   ├── services/          # event, qa (Neurova), note, audit
│   │   ├── rules/             # confidence, dedup, validation, semantics
│   │   └── ai/                # llm_client, event_extractor
│   ├── data/
│   │   ├── patient.json
│   │   └── scripted_events.json
│   └── tests/
├── CONTRACTS.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- Python 3.12 or later
- Git
- An LLM API key (optional; the template note works without it)

### 1. Clone

```bash
git clone <your-repo-url> neurova
cd neurova
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic pytest python-multipart
cp .env.example .env             # add LLM_API_KEY if using the LLM
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

### Environment variables

```text
LLM_API_KEY=            # optional
LLM_MODEL=              # optional
LLM_TEMPERATURE=0.1
DATABASE_URL=sqlite:///./neurova.db
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Running the Demo

1. Reset data: `POST /cases/{id}/reset`
2. Open the pre-op screen and click **Verify identity**, then **Start case**.
3. Ask Neurova: "Is the patient allergic to anything?" and "Which implant size was planned?"
4. Start the simulated feed (`POST /cases/{id}/simulate`, or the hidden shortcut `Ctrl+Shift+S`).
5. Watch the timeline fill, the tourniquet timer run and the implant conflict appear.
6. Open the evidence drawer on the conflicting event.
7. Go to the review queue and accept, edit and reject one item each.
8. Generate the operative note and note the "Not documented" tokens.
9. Optional: trigger **AI offline** and regenerate to see the template fallback.
10. Sign off.

---

## API Reference

| Endpoint | Purpose |
|---|---|
| `GET /health` | Service health |
| `GET /cases/{id}` | Patient context and plan |
| `POST /cases/{id}/start` | Start case (requires `identity_verified=true`) |
| `GET /cases/{id}/events` | Timeline |
| `POST /cases/{id}/events` | Ingest an event through the rules engine |
| `PATCH /events/{id}/review` | Accept, edit or reject |
| `POST /cases/{id}/qa` | Ask Neurova a question |
| `POST /cases/{id}/note` | Generate the operative note |
| `POST /cases/{id}/simulate` | Replay the scripted event feed |
| `POST /cases/{id}/fail/{type}` | Inject a failure for demo purposes |
| `POST /cases/{id}/reset` | Reset to a clean state |
| `WS /ws/{case_id}` | Live event stream |

---

## Event Model and Safety Rules

```json
{
  "id": "evt_001",
  "case_id": "CASE-001",
  "type": "tourniquet_applied",
  "description": "Tourniquet applied",
  "timestamp": "2026-11-28T09:12:08Z",
  "source": "audio",
  "confidence": 0.90,
  "status": "review_required",
  "payload": {},
  "evidence_ref": "audio-segment-17"
}
```

**Statuses:** `planned`, `imported`, `ai_observed`, `review_required`, `confirmed`, `rejected`

**Sources:** `hims`, `anaesthesia`, `barcode`, `audio`, `video`, `manual`

**Core rules**

- AI observations are drafts, never confirmed facts.
- Confidence above 0.85 and low risk becomes `ai_observed`; 0.5 to 0.85 becomes `review_required`; below 0.5 is stored but hidden.
- Numbers, laterality and implant sizes always require review.
- Same event type within 30 seconds is merged into one event with multiple sources.
- Events are append-only; edits create a new version and every change writes an audit row.
- Rejected evidence cannot re-add the same event.
- Semantic distinctions: mentioned is not administered, scanned is not implanted, planned is not implanted, requested is not used.
- Missing information is written as "Not documented", never inferred.

---

## Edge Cases Handled

- Wrong patient or laterality conflict (flagged, review required)
- Planned procedure changed mid-surgery (original plan preserved)
- Duplicate detections (merged)
- Conflicting sources, such as implant size (flagged)
- Out-of-order or late events after case end (flagged)
- Video or audio lost (coverage-gap marker, no invented events)
- HIMS data stale (last-synced time shown)
- LLM unavailable or output fails validation (deterministic template note)
- Browser refresh or reconnect (timer and timeline preserved, events queued locally)
- Missing data (shown as "Not documented")

---

## Testing

```bash
# Backend
cd backend && pytest

# End-to-end
cd frontend && npx playwright test
```

Key tests: each rule, duplicate and conflict handling, reject-then-redetect, Neurova out-of-scope questions, note validator catching an injected fake fact, and the full demo flow.

---

## Prototype Limitations

- All data is synthetic; there is no real HIMS integration.
- Video and audio observations are simulated by a scripted feed unless the optional webcam and Whisper path is enabled.
- A ceiling camera and microphone cannot capture every surgical detail; Neurova combines multiple sources and always requires clinician review.
- No clinical validation, regulatory clearance or security certification.
- Not for use in real patient care.

---

## Roadmap

1. Real FHIR/HL7 integration with HIMS
2. PostgreSQL, authentication, role-based access
3. Edge deployment inside the OT with offline-first operation
4. Real video and audio models trained on approved, de-identified data
5. Fine-tuning Neurova on surgeon-approved notes, with governance
6. Specialty-specific templates, plus Hindi and Marathi interfaces
7. Pilot study with a partner hospital

---

## Privacy and Compliance

A real deployment would need role-based access, encryption in transit and at rest, immutable audit logs, defined retention for any audio or video, patient and staff notice, and approval from hospital administration, biomedical engineering, IT security and compliance. Indian deployments should also review the Digital Personal Data Protection Act, 2023 and applicable ABDM guidance. Do not use real patient data with this prototype.

---

## License

Choose a license before publishing (for example MIT) and add a `LICENSE` file.
