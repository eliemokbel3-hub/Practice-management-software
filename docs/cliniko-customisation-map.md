# Cliniko customisation map → what PracticeHub must support

Surveyed from TuneUp Osteopathy's live Cliniko account (settings screens only), July 2026.
Goal: PracticeHub is **allied-health-generic** — nothing osteo-specific is hard-coded.
Every profession-specific thing in Cliniko is clinic-level configuration; ours must be too.

## Guiding observation

Cliniko hard-codes almost nothing clinical. The clinic defines its own: appointment
types, note templates, form templates, billable items, taxes, payment types, reminder
wording, letter templates, block types, recall types, concession types, referral
sources, custom patient fields. "Category" on an appointment type is just free text
(e.g. Osteopathy / Physiotherapy / Psychology). That's the model to copy — plus a
"Terminology" setting (Cliniko lets you rename "Attendees"; we can go further, e.g.
patient vs client, which matters for psychs).

## Customisation surface, by area

### Appointment types (fully clinic-defined)
Name · description · free-text category · duration (5-min steps) · max patients per
slot (group bookings!) · colour (picker + palette) · default treatment note template ·
per-type email/SMS reminders (template + timing, multiple allowed) · follow-up
messages (email/SMS, timed after appt) · booking confirmation + cancellation email
template choice · related billable items (item + quantity + discount %/$, multiple) ·
related products · which practitioners offer it · which businesses (locations) offer
it · online-booking lead time override · telehealth on/off per type · show/hide in
online bookings.

### Availability & calendar
Practitioner regular schedule + one-off availability + unavailable blocks.
Unavailable block types are clinic-defined (name + default duration).
Calendar prefs: time-slot size & row height, day start/end hours, day/3-day/work-week/
6/7-day views, gap-for-double-booking option, current-time line, hide patient names
button (privacy on shared screens), wait list with expiry, "skip ahead 2/4/6 wks &
3 mo" navigation (rebooking aid).

### Treatment note templates (builder)
Sections (title + optional description) → questions. Question types: **single line
text, paragraph text, multiple choice, checkboxes, date, body chart**. Body chart
templates are their own library (full body, regions, feet, per-view) — drawable in
notes. Per-template print settings (title + which patient fields to show).
Import/export/duplicate templates. Practitioner permission: "can add/modify note
templates" toggle.

### Patient form templates (online intake forms)
Same builder plus: **signature** question type, required-question flag, **connected
(conditional) questions**, per-template privacy ("only viewable by practitioners"),
"email a copy to patient". These are sent to patients / filled pre-appointment.
→ This overlaps heavily with our outcome-measures engine — one questionnaire system
can power intake forms AND outcome measures (ours adds scoring on top).

### Billing
Billable items: code + name + price + tax rate each (their codes are just text —
works for any profession's fund codes). Concession types (clinic-defined) give
per-item concession prices. Taxes clinic-defined (name + rate). Payment types
clinic-defined (defaults like HICAPS/EFTPOS/Cash/Medicare, add your own).
Products (retail stock: supplier, stock level, price) sold on invoices alongside
services. Expenses tracking. Invoice settings: title, starting number, tax calc
method, ex/inc tax display, show DOB / next appt / duration on invoice, offer text,
default notes, auto-allocate payments. Separate email templates for paid/outstanding/
credit-note × patient/third-party. Third-party billing (invoice a contact, e.g.
insurer/NDIS) exists via Contacts.

### Communication
Template libraries per event: confirmations, reminders, cancellations, follow-ups,
generic SMS templates — each email AND SMS variants, with placeholders (patient name,
appt time, business, etc.). Timing configurable per appointment type. SMS is
credit-based with auto-top-up settings and two-way replies (replies land in a
Communications inbox + dashboard). Full communications log filterable by type/
direction/patient/practitioner. Default reminder type per patient (SMS/email/none).

### Patients
Custom patient fields (clinic-defined extra fields). Referral sources clinic-defined
(with special "Patient" and "Contact" sources that link to records — referral
tracking feeds a marketing report). Recall types (name + interval, e.g. return visit
6 months) with a recalls report. Privacy controls: initials-only in browser title /
calendar feeds, anonymise on deletion, prevent emailing notes/invoices.

### Letters
Letter templates (rich text + placeholders) — used for GP reports, med certs, CDM/
EPC letters. Print/document settings: logo + margins/page size per document class
(invoices, statements, letters, notes, forms, patient history).

### Users, roles, security
Roles: Administrator/Owner, Practitioner, Receptionist, Power receptionist.
Global permission toggles: practitioners see only own notes/letters? see finances?
edit templates? receptionists view attachments? Security: auto-logout timer,
enforce 2FA for all users.

### Online bookings
Global on/off, booking-page URL + embeddable widget, per-segment daily booking
limit per patient, lead time, reservation hold length, booking notifications
(SMS/email to clinic), logo, show prices?, show durations?, require address?,
patient time-zone selector, custom practitioner order, custom "time selection info"
text, terms-of-use text, privacy-policy link, "important notice" banner, Google Tag
Manager hook. Cancellation policy: minimum notice window.

### Business & account
Multiple businesses (locations), each with name, address, contact info, registration
number (shown on invoices). Country/currency/timezone (+ multi-timezone support).
Company name/registration. Account ownership transfer. Data import (CSV) and full
data export — an exportable-data promise we should match (build trust; also our
Cliniko import path).

### Dashboard & reports
Dashboard: message board (team messages w/ replies — maps to our Phase 6 messaging),
draft (unfinished) treatment notes list, recent SMS replies.
Reports: appointments by month/schedule/missed/uninvoiced, note completion, patient
totals/birthdays/no-upcoming-appointment/recalls, revenue by month/practitioner/
raised vs closed, daily payments, payment summary, outstanding invoices, expenses,
new patients by month, referral sources.

## Implications for PracticeHub (decisions to bake in)

1. **One questionnaire engine** for note templates, intake forms, and outcome
   measures — sections → typed questions (+ scoring rules for outcome measures,
   + conditional logic, + signature for forms). Already fits our jsonb
   `note_templates.sections` / `outcome_measures.definition` design.
2. **Everything above is a table, not a constant**: block types, recall types,
   concession types, referral sources, payment types, taxes, custom fields —
   most already in schema; add: recall_types, concession_types (+ per-item
   concession prices), referral_source_types, custom_patient_fields, products,
   contacts/third-party billing (later phases).
3. **Free-text category + terminology setting** instead of "osteopathy" anywhere.
4. **Per-appointment-type comms** (reminder template + timing) — schema's
   appointment_types needs a comms link when we build Phase 5.
5. **Group appointments**: max-patients-per-slot on appointment type (class
   bookings) — worth a column now, UI later.
6. **Privacy features to match**: hide-names calendar mode, initials in tab title,
   auto-logout, 2FA, role permissions.
7. **Data export** as a first-class promise.

## Appendix: TuneUp's current config (for Phase 2+ seeding)

Appointment types (category "Osteopathy", all Elie, all with email+SMS reminder
"1 day before at 10:00", standard confirmation/cancellation emails):
| Name | Min | Colour | Billable item | Note template | Online |
|---|---|---|---|---|---|
| Initial Appointment | 45 | #FDCA86 | (1804) Initial consultation and treatment $70 | Initial Consultation | no |
| Standard Appointment | 30 | (teal-ish) | (1802) Standard consultation and treatment $70 | Standard Consultation | yes |
| Long Consultation (60 Mins) | 60 | #9292ff | (1802) Long consultation and treatment $110 | Standard Consultation | yes |
| Medicare Consult | 30 | #bcffb8 | (10966) Medicare Consult $63.40 | Standard Consultation | no |
| TAC Initial Consultation O600 | 45 | #ff0000 | (O600) Initial Consultation $90 | — | no |
| TAC Standard Consultation | 45 | #ff0000 | (O602) Standard Consultation $85 | — | no |
| Workcover Return Appointment | 30 | #feffb8 | (OS102) Standard Consultation ≥20min $81.77 | Standard Consultation | no |
| Broncos Basketball | 30 | #a8f0e4 | (1802) Broncos $50 | Standard Consultation | no |

Other billable items: (MX113) Copy of Clinical Notes $1+GST · (INS111) $86.18 ·
(INS101) Questionnaire $133.57+GST · TNL Discount −$10.
Taxes: GST 10%. Payment types: HICAPS, EFTPOS, Cash, Other, Medicare.
Unavailable blocks: Lunch/Meeting/Travel/Unavailable (30 min).
Recalls: Return visit (soon) 3 mo, Return visit 6 mo.
Note templates: "Initial Consultation" (8 Q), "Standard Consultation" (3 sections,
7 Q: History/Examination incl. informed-consent checkbox/Treatment-Management),
plus an older misspelled "Inital Consultation" duplicate.
Patient forms: "New Patient Form" + updated variant (6 sections, ~34 Q).
Letters: GP report/CDM/med-cert templates. Products: braces, pillows.
Business: TuneUp Osteopathy, Coolaroo VIC, ABN 48 893 034 621.
