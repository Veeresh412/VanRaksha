# FRAWatch — Full Project Context & Detailed Role Briefs

## 0. Shared context — every member and every AI agent reads this first

**What we're building, one paragraph:**
FRAWatch is an early-warning system that detects external land-use changes near FRA-titled (Forest Rights Act) community forest land in India, and routes verified alerts to the Gram Sabha (village council) and district tribal welfare office responsible for that jurisdiction. It combines free satellite imagery with citizen-submitted photo reports. It never accuses anyone and never makes a legal determination — it flags "something changed here, someone should look," and a human officer decides what it means.

**Hard boundaries — do not cross these, in any module:**
- No naming or accusing a government officer, anywhere in the UI, database, or logs.
- No language claiming a flag IS illegal encroachment. Always "unverified land-use change" or "flagged for review."
- No claim of national coverage. This is a single pilot district (Mayurbhanj, Odisha), using demo/synthetic FRA parcel data if real data isn't available in time — and that must be labeled as synthetic wherever it appears.
- No black-box ML for the core detection logic. Every flag must be traceable to a specific rule (an NDVI/NDBI number crossing a threshold, an EXIF field, a corroboration count) that a non-technical Gram Sabha member or judge could be shown.
- No AI-generated-image detection claims. That problem is explicitly out of scope — mark it "Phase 2" everywhere it might otherwise seem implied.

**Competition context:** Smart India Hackathon 2026, Ministry of Tribal Affairs alignment. Round 1 passed. Round 2.1 (progress review, ~50% target, 50 marks) is imminent; Round 2.2 (final, 100% target, 100 marks) is a week later. Round 1 specifically praised the explainable-over-black-box choice and warned against overclaiming — the real innovation is the FRA-parcel + community-corroboration institutional integration, not the satellite tech itself.

---

## 1. System architecture — the shared mental model

Seven-stage pipeline:

1. **Data sources** — Sentinel-2 imagery (Google Earth Engine, free tier, 10m resolution, 5-day revisit) + FRA parcel atlas (GeoJSON boundaries, pilot district)
2. **Change detection engine** — NDVI+NDBI rule-based thresholds flag vegetation loss / new built-up area near FRA parcels
3. **Community reports** — citizens submit geo-tagged photo + description via a mobile-first PWA
4. **Authenticity & trust tiering** — EXIF check, Error Level Analysis (ELA), reverse image search, tier classification
5. **Corroboration engine** — combines satellite + citizen signals, tier-aware adaptive threshold
6. **Alert routing & risk queue** — corroborated flags get a spatial risk score, routed by jurisdiction
7. **Two dashboards** — Gram Sabha view (jurisdiction-only) and Admin/District panel (RBAC)

**Trust tiers (every report-handling piece of code must implement this exactly):**

| Tier | Requirement | Escalation rule |
|---|---|---|
| Tier 1 — Basic | Any photo, manual/coarse location | Needs 2 independent Tier 1+ reports, OR 1 report + an independent satellite flag within the configured radius |
| Tier 2 — Geo-tagged | Photo has intact EXIF GPS (not stripped by compression/forwarding) | Needs 1 additional independent report, OR a nearby satellite flag alone |
| Tier 3 — Verified reporter | Registered NGO/Forest Rights Committee account + geo-tag | Escalates immediately on submission, no additional corroboration required |

"Independent" = different phone number/session AND a GPS point that differs from any other report on the same flag by more than ~20 meters. Two submissions from the same device/session never count as two sources, even if timestamps differ.

**Fake/AI image detection — exact scope, do not exceed:**
- EXIF metadata inspection for editing-software signatures (Photoshop, GIMP, Lightroom tags)
- Reverse image search (flag if the image is found already published elsewhere online)
- Error Level Analysis (ELA) — recompression at a fixed quality level, diff against original, flag high-error regions as possible edits
- Explicitly NOT attempting: GAN/diffusion-model-generated image detection. Any code, comment, or slide claiming this is solved is wrong and must be corrected.

---

## 2. Shared data contract — lock this before writing feature code

Everyone builds against these shapes. Mock the responses until the real backend exists so nobody blocks on anybody else.

```
POST /auth/request-otp
  body: { phone_number: string }
  returns: { success: bool }

POST /auth/verify-otp
  body: { phone_number: string, otp: string }
  returns: { token: string, role: "citizen"|"gram_sabha"|"admin"|"district_officer",
             jurisdiction_id: string|null, expires_at: ISO8601 }

POST /reports
  headers: Authorization: Bearer <token or anonymous citizen session>
  body: { photo_file: multipart, lat: float, lng: float, description: string,
          reporter_type: "citizen"|"verified", device_session_id: string }
  returns: { report_id: string, tier: 1|2|3, authenticity_score: float (0-1),
             exif_gps_present: bool, matched_flag_id: string|null }

GET /flags?jurisdiction_id=X&status=new|under_review|resolved (status optional)
  headers: Authorization: Bearer <token>  -- server enforces jurisdiction_id from token, ignores a mismatched query param
  returns: [{
    flag_id: string, lat: float, lng: float,
    status: "new"|"under_review"|"resolved"|"escalated_to_district",
    corroboration_state: "single_source"|"corroborated"|"verified_fast_track",
    corroboration_count: int,
    satellite_confidence: float|null,
    risk_score: float,
    before_image_url: string|null, after_image_url: string|null,
    citizen_photo_urls: [string],
    fra_parcel_id: string, created_at: ISO8601, updated_at: ISO8601
  }]

GET /flags/{flag_id}
  returns: full object above + report_history: [{ report_id, tier, submitted_at, authenticity_score }]

PATCH /flags/{flag_id}
  headers: Authorization: Bearer <token>  -- role must be gram_sabha (own jurisdiction only) or district_officer/admin
  body: { status: string, escalated_to_district: bool, officer_note: string (internal only, never shown to public) }
  returns: updated flag object

GET /analytics/district-trends?state=X&period=quarterly
  headers: Authorization: Bearer <token>  -- role must be admin
  returns: [{ district: string, flag_count: int, period: string }]  -- aggregate only, no flag_id drill-down

POST /admin/officers
  headers: Authorization: Bearer <token>  -- role must be admin
  body: { name: string, phone_number: string, jurisdiction_id: string }
  returns: { officer_id: string }

DELETE /admin/officers/{officer_id}
  headers: Authorization: Bearer <token>  -- role must be admin
```

Error format for every endpoint: `{ error_code: string, message: string }` with standard HTTP status codes (400 validation, 401 unauthenticated, 403 wrong role/jurisdiction, 404 not found, 500 server).

---

## 3. Person 1 — Satellite & Geospatial Detection (full detail)

**Repo folder:** `/geospatial`

**Exact deliverables, in build order:**

1. **GEE authentication + district AOI (area of interest) definition.** Define the pilot district boundary (Mayurbhanj, Odisha) as a GeoJSON polygon. Store it as `aoi_mayurbhanj.geojson` in `/geospatial/data/`.

2. **Imagery pull function.** `fetch_sentinel2(aoi_geojson, start_date, end_date) -> ee.ImageCollection`. Filter for cloud cover < 20% using the `CLOUDY_PIXEL_PERCENTAGE` property. If no images meet the threshold in the date range, widen the search by 5 days at a time up to 20 days before failing — cloud cover is a real, expected failure mode in this region, especially during monsoon, and this must degrade gracefully, not crash.

3. **NDVI calculation.** `NDVI = (NIR - RED) / (NIR + RED)` using Sentinel-2 bands B8 (NIR) and B4 (RED). Compute for two time periods (baseline and current).

4. **NDBI calculation.** `NDBI = (SWIR - NIR) / (SWIR + NIR)` using bands B11 (SWIR) and B8 (NIR). Same two time periods.

5. **Change detection thresholds (rule-based, tune and document the exact numbers you land on):**
   - Vegetation loss flag: `NDVI_current - NDVI_baseline < -0.15` (tune this — start here and adjust based on backtest results)
   - Built-up increase flag: `NDBI_current - NDBI_baseline > 0.10`
   - A pixel/cluster only becomes a candidate flag if BOTH conditions are true in the same location — this dual-condition requirement is what keeps false positives down (e.g., seasonal vegetation loss alone doesn't trigger a flag; you need vegetation loss AND new built-up signature together).
   - Cluster adjacent flagged pixels into single point flags (centroid) rather than reporting every pixel — a construction site is many pixels, it should be one flag, not fifty.

6. **PostGIS proximity query.** For each candidate flag centroid, query: is this point within `BUFFER_RADIUS_METERS` (start at 500m, make this a configurable constant, not hardcoded in three places) of any polygon in the FRA parcel atlas? Use PostGIS `ST_DWithin`. Discard candidates that don't pass this check — only changes near FRA parcels matter to this system.

7. **Confidence score.** Combine the magnitude of NDVI drop and NDBI rise into a single 0–1 confidence score (e.g., normalize each delta against a fixed scale, average them). Document your exact formula in code comments — you need to explain this number if asked.

8. **Output endpoint/function contract:** `get_flags_for_district(district_id, start_date, end_date) -> List[{lat, lng, confidence_score, detected_at, ndvi_delta, ndbi_delta}]`. This is what Person 2 calls. Keep `ndvi_delta` and `ndbi_delta` in the output — Person 2's logs and Person 6's backtest reporting both want to show the raw numbers behind a flag, not just a black-box score.

9. **Backtest (do not skip, this is an explicit Round 1 ask):**
   - Compile 5–10 known, already-documented land-use change events in Mayurbhanj or a comparable district (search news archives, Global Forest Watch alerts, Parivesh clearance records for a known road/mining/construction project with a known approximate date).
   - Run your detector against the before/after imagery for each known event.
   - Report: how many did you catch (recall), and separately, run the detector against 5–10 locations with NO known change, and report how many false flags it produced (precision proxy).
   - Write this up as a plain table: `event_id | location | known_change_type | date | detected: yes/no | confidence_score`. Hand this table to Person 6 for the slide and to Person 2 for context on how to weight satellite confidence in the corroboration engine.

**Explicit non-goals:** no ML model of any kind, no UI, no claim of covering more than one district, no attempt to classify WHAT the built-up structure is (house vs road vs factory) — that's for a human to determine.

**Edge cases to handle, not ignore:** persistent cloud cover blocking analysis for a period (log and skip, don't crash), a district boundary that straddles a Sentinel-2 tile edge (may need to merge two tiles), a flag that's actually inside a legitimately-permitted structure (you cannot solve this — this is exactly why the output is a "candidate flag" not a verdict, and why corroboration/human review exists downstream).

---

## 4. Person 2 — Backend Core: API, Database, Corroboration Engine, Routing (full detail)

**Repo folder:** `/backend`

**Step 0, before any feature code:** publish the API contract from Section 2 to the team (a shared doc, a Postman collection, or a `openapi.yaml` — pick one and share it tonight). This unblocks everyone else.

**Database schema (PostgreSQL + PostGIS), exact tables:**

```sql
-- jurisdictions: the FRA parcel boundaries AND the admin boundary each belongs to
CREATE TABLE jurisdictions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,             -- e.g. "Gram Sabha - Village X"
  type TEXT NOT NULL,             -- 'gram_sabha' or 'district'
  parent_jurisdiction_id UUID,    -- district a gram_sabha belongs to
  boundary GEOMETRY(Polygon, 4326)
);

CREATE TABLE fra_parcels (
  id UUID PRIMARY KEY,
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  title_holder_type TEXT,         -- 'individual' | 'community' | 'CFR'
  grant_date DATE,
  is_synthetic BOOLEAN DEFAULT true,  -- mark demo data explicitly, never hide this
  boundary GEOMETRY(Polygon, 4326)
);

CREATE TABLE satellite_flags (
  id UUID PRIMARY KEY,
  location GEOMETRY(Point, 4326),
  fra_parcel_id UUID REFERENCES fra_parcels(id),
  confidence_score FLOAT,
  ndvi_delta FLOAT,
  ndbi_delta FLOAT,
  detected_at TIMESTAMP
);

CREATE TABLE reports (
  id UUID PRIMARY KEY,
  location GEOMETRY(Point, 4326),
  photo_url TEXT,
  description TEXT,
  device_session_id TEXT,          -- for independence checking
  phone_number_hash TEXT,          -- hashed, not stored plain
  tier INT,                        -- 1, 2, or 3
  exif_gps_present BOOLEAN,
  authenticity_score FLOAT,
  matched_satellite_flag_id UUID REFERENCES satellite_flags(id),
  submitted_at TIMESTAMP
);

CREATE TABLE flags (
  id UUID PRIMARY KEY,
  fra_parcel_id UUID REFERENCES fra_parcels(id),
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  status TEXT DEFAULT 'new',       -- new | under_review | resolved | escalated_to_district
  corroboration_state TEXT,        -- single_source | corroborated | verified_fast_track
  corroboration_count INT DEFAULT 0,
  risk_score FLOAT,
  satellite_flag_id UUID REFERENCES satellite_flags(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE flag_reports (   -- many-to-many: a flag can be corroborated by multiple reports
  flag_id UUID REFERENCES flags(id),
  report_id UUID REFERENCES reports(id)
);

CREATE TABLE officers (
  id UUID PRIMARY KEY,
  name TEXT,
  phone_number TEXT,
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  role TEXT   -- 'gram_sabha' | 'district_officer' | 'admin'
);
```

**Corroboration engine — exact algorithm to implement:**

On every new report insert:
1. Find candidate flags within `BUFFER_RADIUS_METERS` of the report's location, same FRA parcel, status not `resolved`.
2. If no candidate flag exists, create a new `flags` row with `status = 'new'`, `corroboration_count = 1`, `corroboration_state = 'single_source'`.
3. If a candidate flag exists, check independence: is this report's `device_session_id` and location (>20m apart) distinct from every report already linked to that flag?
   - If not independent (same session or near-duplicate location), do not increment corroboration_count — log it as a duplicate/ignored submission, but still store the report row for audit purposes.
   - If independent, increment `corroboration_count` and link via `flag_reports`.
4. Apply the escalation rule based on the report's own tier (see table in Section 1):
   - Tier 3 report → set `corroboration_state = 'verified_fast_track'` immediately, regardless of count.
   - Tier 2 report → if `corroboration_count >= 2` OR there's a linked satellite flag → `corroboration_state = 'corroborated'`.
   - Tier 1 report → if `corroboration_count >= 2` (from two independent Tier 1+ reports) OR (`corroboration_count >= 1` AND a linked satellite flag exists) → `corroboration_state = 'corroborated'`.
   - Otherwise remains `single_source`.
5. On every satellite flag insert (from Person 1's pipeline), run the same proximity check against existing report-based flags — a satellite flag landing near an existing single-source report should immediately upgrade that flag's corroboration_state, per the same rule as above.
6. Recompute `risk_score` whenever a flag's corroboration_state or count changes: a simple weighted formula, e.g. `risk_score = 0.4 * satellite_confidence + 0.3 * min(corroboration_count/3, 1) + 0.3 * (1 if tier==3 else 0.5 if tier==2 else 0.2)`. Document the weights in code comments — they can be tuned later, but they must be explainable, not a trained model.
7. Only flags with `corroboration_state != 'single_source'` (i.e., corroborated or verified_fast_track) become visible in `GET /flags` to gram_sabha and district_officer roles. Single-source flags are logged but not surfaced to end users yet — this is the "don't cry wolf" filter.

**Alert routing:** on escalation (step 4 above producing a non-single-source state), determine `jurisdiction_id` from the FRA parcel's linked jurisdiction and make the flag queryable via `GET /flags?jurisdiction_id=X` for that specific Gram Sabha, and via the parent district jurisdiction for the district officer.

**Auth:** JWT with a short expiry (e.g. 24h), OTP-based login (integrate a free/test SMS OTP provider, or a hardcoded OTP like `123456` for demo purposes if real SMS isn't feasible tonight — say so explicitly to the team, don't silently fake it in a way that surprises Person 4 during integration). Role and jurisdiction_id are embedded in the token claims; every endpoint that returns jurisdiction-scoped data reads jurisdiction_id from the token, never trusts a client-supplied jurisdiction_id in the query string.

**Explicit non-goals:** no frontend of any kind, no satellite image processing (consume Person 1's output only), no photo analysis (consume Person 5's authenticity_score and exif_gps_present only — you receive these already computed).

---

## 5. Person 3 — Citizen-Facing Reporting App (full detail)

**Repo folder:** `/frontend-citizen`

**Exact screens, in order of the user flow:**

1. **Landing/home screen:** one large button "Report a change" and a smaller "Check my past reports" link. Minimal text, large touch targets (min 44px), works one-handed. Support at minimum English + one regional language toggle (Odia, given the pilot district) if time allows — note this as a stretch goal, not a blocker.

2. **Photo capture screen:** trigger the device's native camera input (`<input type="file" accept="image/*" capture="environment">`) — this keeps the user on their normal camera app, familiar UX, and preserves EXIF data better than in-browser camera APIs on some Android versions. Also allow choosing an existing photo from gallery (for cases where the photo was already taken).

3. **Immediately after photo selection, client-side:**
   - Attempt to read EXIF GPS tags from the file using a JS EXIF library (e.g. exif-js or similar). If present, auto-fill lat/lng and show a green "Location detected from photo" confirmation.
   - If EXIF GPS is absent, fall back to the browser's `navigator.geolocation.getCurrentPosition()` API (live device location, less precise for proving where the photo was taken, but still usable) — show an amber "Using your current location" notice, and internally mark this submission as tier-ineligible-for-2 (goes in as Tier 1).
   - If both fail (no EXIF, geolocation denied), show a simple map the user can tap to manually drop a pin, with a village/landmark name search/autocomplete if feasible. Never block submission entirely for lack of location — always provide a manual fallback.

4. **Description screen:** short free-text field (max ~200 characters, keep it light), optional. Placeholder text example: "What did you see? (e.g. new building near the forest edge)". No mandatory field validation beyond the photo itself — a report with just a photo and location is valid.

5. **Review & submit screen:** show the photo thumbnail, the detected/entered location on a small map, the description. One "Submit report" button. On tap: disable the button, show a spinner, call `POST /reports`.

6. **Submission result screen:** show the returned tier plainly in friendly language, not jargon:
   - Tier 1: "Report submitted. It will be reviewed once confirmed by another source."
   - Tier 2: "Report submitted with location confirmed — this gets priority review."
   - Tier 3 (verified reporter accounts only): "Report submitted and flagged for immediate review."
   - Also show a report reference code/ID the user can use to check status later.

7. **"Check my past reports" screen:** a simple list (keyed by phone number + OTP, or a locally-stored device token if you skip full auth for citizens to reduce friction — decide based on time, document the choice) showing each submitted report's current status (new / under review / resolved) — this closes the adoption-incentive loop from Round 1 feedback. Even a bare-bones version of this (just status text, no fancy UI) is worth building before polishing anything else.

**Offline handling — exact behavior required, not optional:**
- On submit, if `navigator.onLine` is false or the fetch call fails/times out, do NOT show an error and discard the data. Instead: save the full submission payload (photo as base64 or blob in IndexedDB, plus form fields) to a local queue, show the user "Saved. Will send when you're back online," and register a background sync event via the service worker.
- On regaining connectivity (`online` event, or periodic background sync retry), the service worker should attempt to POST each queued item, and only remove it from the local queue on a confirmed 2xx response.
- Test this literally: submit a report in airplane mode, confirm it's queued, turn connectivity back on, confirm it actually sends.

**PWA setup:** valid `manifest.json` (name, icons, start_url, display: standalone), a registered service worker, installable via "Add to Home Screen" prompt on Android Chrome. No app store submission needed or expected.

**What NOT to build:** no dashboards, no login-gated views beyond the simple past-reports check, no satellite anything, no admin features. Every screen should be usable by someone who has never used a form-based app before — favor big buttons and plain language over information density.

---

## 6. Person 4 — Dashboards: Gram Sabha View + Admin/District Panel (full detail)

**Repo folder:** `/frontend-dashboard`

**Login screen (shared by both dashboard types):** phone number input → OTP input (calls Person 2's `/auth/request-otp` then `/auth/verify-otp`). On success, store the JWT and redirect based on the `role` claim: `gram_sabha` → Gram Sabha view, `district_officer` or `admin` → Admin panel.

### Gram Sabha view — exact components:

1. **Flag list (main screen):** cards or rows, one per flag, sorted by `created_at` descending by default, with a filter toggle for status (All / New / Under Review / Resolved). Each row shows: a small status-colored dot, corroboration badge (see exact badge spec below), a one-line location description (nearest village/landmark if available, else lat/lng rounded to 4 decimals), and time since creation ("2 days ago").

2. **Corroboration badge — exact three visual states, use distinct colors/icons for each, not just text:**
   - "Single-source" — should not actually appear here per the backend filter (single-source flags aren't surfaced), but build the UI state anyway for admin/debug views.
   - "Corroborated (N reports)" — shows the actual `corroboration_count`.
   - "Verified reporter — fast-tracked" — visually distinct (e.g., a small checkmark icon), signals higher trust.

3. **Flag detail screen (tap into a flag):**
   - Map with a pin at the flag's location, using Leaflet + OpenStreetMap tiles (no API key).
   - Side-by-side or stacked before/after satellite thumbnails (if available — handle the case where these are null gracefully, don't show a broken image icon).
   - The citizen-submitted photo(s), full size on tap.
   - The FRA parcel this flag is near (show `title_holder_type` if available — "Community forest resource" etc., never show individual title-holder personal details beyond what's already in the synthetic/demo dataset).
   - Status dropdown/buttons: "Mark under review," "Mark resolved," "Escalate to district office" — calls `PATCH /flags/{flag_id}`.
   - Explicitly absent from this screen: any officer name, any "confirmed illegal" language, any accusatory text. The copy should read like "Land-use change flagged near [parcel]. Reported by [N] independent sources." — factual, neutral.

### Admin/District panel — exact components:

1. **District officer sub-view:** identical flag-list-and-detail structure as the Gram Sabha view, but scoped to the district_officer's jurisdiction (which is the parent jurisdiction covering multiple Gram Sabhas) rather than a single village. Same status actions available, plus visibility into `officer_note` (an internal-only free-text field for officer annotations, never shown to citizens or Gram Sabha).

2. **State/MoTA aggregate view (admin role only):** a simple table or bar chart, `district | flag_count | period`, sourced from `GET /analytics/district-trends`. No click-through to individual flags from this view — it's intentionally read-only and aggregate, per the "no public accusation, only trend data" design decision. If you have chart-library time, a basic bar chart (flag count per district per quarter) is a nice-to-have; a plain table is a perfectly acceptable and honest fallback if time is short.

3. **User management screen (admin role only):** a simple table of officers (name, phone number, jurisdiction) with "Add officer" (form: name, phone, jurisdiction dropdown, calls `POST /admin/officers`) and "Remove" (calls `DELETE /admin/officers/{id}`) actions. No password fields — officers log in via the same OTP flow as everyone else.

**What NOT to build:** no extra analytics/charts beyond the one aggregate trend view — resist the urge to add more visualizations, a sparse and clean panel is a better demo than a busy one. No public-facing (unauthenticated) pages anywhere in this app. No way for a gram_sabha-role token to ever see another jurisdiction's data — if you're implementing any client-side filtering as a shortcut, understand that Person 2's backend must ALSO enforce this server-side; never rely on the frontend alone to hide data.

**Demo fallback:** if OTP/SMS infrastructure isn't ready by tomorrow, coordinate with Person 2 and Person 6 on a single hardcoded demo login for each role, clearly documented as temporary, so the dashboards are still demoable end-to-end.

---

## 7. Person 5 — Authenticity Layer (system) + Literature Survey & Tech Stack Slides (PPT) — full detail

**Repo folder:** `/authenticity`

**Exact module contract:** `analyze_photo(photo_file) -> { authenticity_score: float (0-1), exif_gps_present: bool, exif_editing_software_detected: bool, reverse_image_match_found: bool, ela_anomaly_score: float (0-1), flags: [string] }`

**Step-by-step build:**

1. **EXIF extraction.** Use a library (e.g. `Pillow`/`exifread` in Python) to pull all EXIF tags from the uploaded photo. Specifically check the `Software` tag for known editing tool signatures ("Adobe Photoshop", "GIMP", "Lightroom", etc.) — if present, set `exif_editing_software_detected = true` and add a flag string like `"editing_software_detected"`.
2. **GPS tag check.** Check for `GPSInfo` EXIF block presence and validity (non-null lat/lng that parse to real coordinates). Set `exif_gps_present` accordingly — this is what determines Tier 2 eligibility, so get this exactly right and unit-test it against a few real geo-tagged and non-geo-tagged sample photos.
3. **Reverse image search.** Use a free-tier or low-volume reverse image search API (research what's available and rate-limit-friendly at hackathon scale — document whichever you pick and its limits). If a strong match is found elsewhere online, set `reverse_image_match_found = true` and add a flag. If the API isn't reliably available, this can degrade to "skipped, feature disabled" rather than blocking the pipeline — log it, don't crash the whole authenticity check over one failed sub-check.
4. **Error Level Analysis (ELA).** Recompress the image at a fixed JPEG quality (e.g. 90) and compute the pixel-level difference between original and recompressed. Regions with unusually high error levels relative to the rest of the image suggest local editing. Produce a single `ela_anomaly_score` (e.g., normalized max or 95th-percentile error in any region). This is a well-documented, explainable technique — implement it directly, don't wrap it in ML language.
5. **Combine into `authenticity_score`:** a simple weighted formula, e.g. `authenticity_score = 1 - (0.4*editing_software_detected + 0.3*reverse_match_found + 0.3*ela_anomaly_score)`, clipped to [0,1]. Document the weights plainly in code comments.
6. **Hand off to Person 2:** this whole object gets attached to the report at submission time (either called synchronously during `POST /reports`, or as a follow-up async job that updates the report row — decide based on how fast ELA runs in practice, and tell Person 2 which approach you're using so the corroboration engine knows whether to wait for it or process it later).

**Explicit non-goal, repeat for clarity:** do not attempt to detect AI-generated (diffusion/GAN) images. If you have spare time and want to add something here, spend it hardening the three checks above (more editing-software signatures, handling more image formats, better ELA thresholding) rather than reaching for AI-detection — that direction is a scope trap.

**PPT half — exact slide content to prepare:**

- **Literature Survey slide:** a comparison table, minimum 4 rows: PARIVESH 2.0 (MoEFCC clearance automation — gap: no post-clearance monitoring, no community alerting), a comparable FRA/GIS digitization tool (e.g. VanaRaj or similar prior SIH project — gap: static digitization, no real-time detection or corroboration), Global Forest Watch (gap: forest-cover level, not FRA-parcel level, no India-specific institutional routing), and one citizen-reporting-style tool (e.g. a wildlife crime reporting app — gap: different domain, no satellite cross-validation). End with one explicit sentence naming FRAWatch's specific gap-fill.
- **Tech Stack slide:** list exactly what got built (not aspirational) — FastAPI, PostgreSQL+PostGIS, React+Leaflet, Google Earth Engine/Sentinel-2, JWT+RBAC, the authenticity module (EXIF/ELA/reverse-search) — one justification line per item, written from what you actually implemented, not generic marketing language.

---

## 8. Person 6 — Demo Data & QA (system) + Roadmap & Feedback-Response Slides (PPT) — full detail

**Repo folder:** `/demo-data` and cross-cutting QA responsibility (no exclusive folder — you touch all of them for testing)

**Exact system deliverables:**

1. **Seed dataset:** write a seed script (SQL insert statements or a Python script calling the backend's own models) that populates:
   - At least 3 synthetic FRA parcels (`is_synthetic = true`) with plausible boundaries inside the Mayurbhanj AOI.
   - At least 2–3 pre-populated flags in different states: one `single_source`-turned-`corroborated` with 2 linked reports, one `verified_fast_track`, one already `resolved` (to show the status lifecycle working, not just the "new" state).
   - Realistic-looking (or clearly placeholder-labeled) before/after satellite thumbnail images and citizen photo placeholders for each seeded flag, so the dashboard detail view isn't showing broken images during the demo.
   - One demo Gram Sabha account and one demo admin/district_officer account, coordinated with Person 2 and Person 4 on exact login credentials (or the hardcoded OTP fallback if real SMS isn't ready).

2. **Backtest data compilation:** take Person 1's raw backtest output (event list + detected: yes/no + confidence scores) and turn it into a clean, presentable summary: total events tested, recall %, false positive count, one honest sentence about the known limitation (e.g., "small-scale or gradual encroachment under our detection thresholds remains a limitation, consistent with what we identified in Round 1"). Hand this to Person 5/yourself for the feasibility slide.

3. **End-to-end QA checklist — run this literally, don't just eyeball the code:**
   - [ ] Submit a Tier 1 report (no EXIF, no verified account) via Person 3's app → confirm it appears in Person 2's database as `single_source` and does NOT yet appear in Person 4's Gram Sabha view (per the "single-source not surfaced" rule).
   - [ ] Submit a second independent Tier 1 report near the same location → confirm the flag flips to `corroborated` and now DOES appear in the Gram Sabha view.
   - [ ] Submit a Tier 2 (geo-tagged) report → confirm it needs only one more corroboration, not two.
   - [ ] Submit via a verified-reporter test account (if built) → confirm immediate `verified_fast_track` status.
   - [ ] Confirm a Gram Sabha login only ever sees flags for its own jurisdiction — test by checking two different Gram Sabha demo accounts don't see each other's flags.
   - [ ] Confirm the offline-queue behavior in Person 3's app actually works (test in airplane mode as described in Person 3's section).
   - [ ] Confirm status changes made in the Gram Sabha/admin dashboard (e.g., "mark under review") actually persist and are reflected on a page refresh.
   - Log every failure you find in a shared doc/issue tracker with exactly which step broke — this is the information Person 2 (usually the integration bottleneck) needs most urgently.

**PPT half — exact slide content to prepare:**

- **Roadmap slide:** a simple table or timeline — `Component | Status (done/in progress/planned) | Target date`. Be specific: e.g. "Predictive risk scoring — explicitly deferred, Phase 2, target: post-hackathon" rather than a vague "more features coming."
- **"Round 1 Feedback → What We Did" slide, five explicit rows, do not omit any:**
  1. System name → state whichever name was finalized (see Section 9) and confirm it's used consistently.
  2. Corroboration threshold robustness → the tiered adaptive system (Section 1's table) is the direct answer — state the collusion-resistance mechanism (independent session/location check) and the sparse-area accommodation (satellite-flag-plus-one-report escalation path) explicitly, in plain language.
  3. Adoption incentives → the status-notification loop in Person 3's "check my past reports" screen, plus the verified-reporter/trusted-intermediary tier.
  4. Predictive risk scoring → state plainly whether it's built (the `risk_score` formula in Person 2's engine) or still Phase 2 — do not let this slide contradict what's actually in the code.
  5. False-positive/negative rate → Person 1's backtest numbers, presented honestly with the sample size stated (don't imply more rigor than a 5–10 event backtest actually provides).
- **Final deck assembly:** you are the last checkpoint before submission — read every slide against what the system actually does as of submission time, and cut or soften any claim that's ahead of the real implementation.

---

## 9. Naming — finalize before anyone builds further

System name under consideration: **Vanrakshak** ("forest protector"). Alternatives: VanaDrishti, AranyaNetra, FRA Sentinel. Pick one tonight. Once picked, it must appear identically in: the PWA's app name/manifest, the dashboard's header/title, the PPT title slide, and any code-level constants (e.g. an `APP_NAME` config value used everywhere rather than hardcoded strings scattered across files). Inconsistent naming across modules is a visible, avoidable defect — treat it with the same seriousness as the "Title" placeholder that already cost points in Round 1.
