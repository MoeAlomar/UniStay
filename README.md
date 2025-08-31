# 📝 Portfolio Project UniStay

                                     Team Formation & Idea Development
1447 (Summer 2025) 

UniStay – Students accommodation 

NAMES:
Abdulrahman Al-Fawzan,
Abdulelah Al-Shehri,
Mohammad Al-Omar,
Meshari Al-Abdullah

---

## 👥 1) Team Formation Overview
Our team was formed at the start of Stage 1, comprising four members with complementary skills. Since no substantial work has begun, roles are assigned on a rotational basis for learning purposes, allowing everyone to gain experience in different aspects of project management and leadership. We drew from the project's involved roles, adapting them to our team structure while noting that external Tutors will provide mentorship and feedback as needed.

- **Team Members and Roles (Rotational):** 
  - Abdulrahman (Project Manager): Oversees the project to ensure it stays on track, organizes team meetings, monitors progress, identifies risks, and ensures deadlines are met.
  - Meshari (Project Evaluator): Assesses deliverables based on rubrics, evaluates project outcomes, and provides internal feedback to simulate evaluator perspectives.
  - Abdulelah (Team Member/Team Lead): Responsible for idea generation, development, and documentation; focuses on task coordination and technical decision-making when leading.
  - Mohammad (Team Member/Tutor): Responsible for idea generation, development, and documentation; contributes to brainstorming and refining concepts, while helping us understand the technical difficulties.

- **Collaboration Strategies:** 
  - We primarily meet in person at the academy, as face-to-face interactions foster better collaboration and idea exchange.
  - For remote coordination, we use Discord for messaging or voice calls when in-person meetings aren't possible.
  - Communication: We established a dedicated Discord channel for daily async communication and scheduled bi-weekly meetings (in-person or via Discord calls) for sync-ups.
  - Documentation: All shared notes, meeting minutes, and resources are centralized in a shared Word file for easier management. Decision-making is based on consensus, with a fallback to majority vote if needed.
  - This approach ensures inclusivity, leverages our small team size for quick decisions, and prepares us for rotating roles in future stages.

---

## 💡 2) Ideas Explored (Rejected)
Our team brainstormed numerous concepts to identify a project that is innovative, feasible, and aligned with our learning goals. After initial discussion, we shortlisted five promising ideas for a detailed feasibility analysis. Ultimately, none were selected for progression to Stage 2. The five ideas and our rationale for rejecting them are detailed below. 

Each includes Problem, Proposed MVP, Core Features, Strengths, Weaknesses, and the Reason we did not select it for Stage 2.

### 5) 📚 ExamPal — Collaborative Study Planner
- **Description:** A web application that generates personalized study timelines based on exam dates and allows students to form study groups to coordinate topics and track progress.
- **Problem:** Students struggle to organize multi-subject study schedules and coordinate group sessions.
- **Proposed MVP:** Web app where users enter subjects and exam dates; the app generates a suggested study timeline. Groups can share a plan and assign topics.
- **Core Features:**
  - Create subjects & exam dates
  - Auto-generated visual timeline (e.g., Gantt) per subject
  - “Study Group” with shareable link and shared timeline
  - Members mark topics “completed”
- **Strengths:** Clear data model (Users → Subjects → Groups), simple scheduling algorithm, approachable UI, feasible within course timeline.
- **Weaknesses:** Crowded planner space; uncertain adoption of group study flows; limited technical depth for a 3-month showcase.
- **Reason not selected:** Scope felt too light to demonstrate richer architecture and data challenges compared with other options.

### 4) 🗺 LocalGuide Heritage Explorer — Personalized Day Trips
- **Description:** A tourism app offering personalized cultural day-trip itineraries within Saudi Arabia, enhanced with Augmented Reality (AR) features for historical information.
- **Problem:** Locals and expatriates want easy, informed cultural day trips (e.g., Diriyah, AlUla) without heavy planning.
- **Proposed MVP:** App that recommends itineraries based on preferences, with basic AR overlays for history facts, booking links, and crowd-avoidance hints.
- **Core Features:**
  - Curated database of sites with tags (culture, family-friendly, time needed)
  - Filter-based recommendations and map navigation
  - Simple AR facts overlay (e.g., AR.js)
  - External links for bookings
- **Strengths:** Strong alignment with domestic tourism; engaging demo (maps + AR); clear value to users.
- **Weaknesses:** Content sourcing and verification are heavy; AR adds complexity; depends on external data/links and potential approvals; ongoing content maintenance.
- **Reason not selected:** High dependency on curation and third-party data introduces timeline risk for an academic MVP.

### 3) 🎉 EventBridge — University Club Event Aggregator
- **Description:** A centralized platform for university clubs to post events and for students to discover them via a shared calendar, complete with RSVP functionality.
- **Problem:** Students miss club events because announcements are scattered across Instagram, posters, and WhatsApp.
- **Proposed MVP:** Centralized calendar where club admins post events and students discover and RSVP.
- **Core Features:**
  - Roles: Admin (post/manage events) & Student (view/RSVP)
  - Event list & calendar view
  - Basic RSVP (no ticketing)
- **Strengths:** Introduces roles/permissions; simple, clean data model; immediate campus relevance.
- **Weaknesses:** Requires club buy-in to avoid an “empty app”; similar tools may already exist; relatively simple technically.
- **Reason not selected:** Adoption risk without official endorsement and limited differentiation versus existing solutions.

### 2) 🏋️ Gym Helper — Citywide Gym Directory with Amenities & Plans
- **Description:** A specialized app for discovering local gyms, filtering by amenities (pools, specific equipment), and reading reviews. A proposed advanced feature included an AI-powered workout plan generator based on user goals.
- **Problem:** People can’t easily compare gyms by equipment, women/men/family sections, or amenities (pool, jacuzzi, classes).
- **Proposed MVP:** Map directory filtered to gyms only, with equipment/amenities, reviews, and a basic plan generator from height/weight/goal.
- **Core Features:**
  - Gym profiles with equipment & amenities
  - Search/filters; reviews & ratings
  - Rules-based plan suggestions (optional)
- **Strengths:** Clear consumer value; strong mapping/filtering UX; meaningful engineering depth (geo + reviews + roles).
- **Weaknesses:** Data seeding & moderation workload; overlap with general map products; plan quality depends on careful disclaimers.
- **Reason not selected:** Substantially overlapped with our chosen direction; we consolidated this line of thinking into the selected MVP and deprioritized this variant.

### 1) 🏪 StoreLaunch — Simple Store Builder for SMBs
- **Description:** A software-as-a-service (SaaS) platform enabling entrepreneurs in Saudi Arabia to easily create, customize, and manage their own online stores, similar to established players like Salla or Shopify.
- **Problem:** Many SMBs want online stores but lack technical resources to set up and manage them.
- **Proposed MVP:** Easy store creation with basic customization, user/product management, and starter payment/shipping options.
- **Core Features:**
  - Store setup & basic themes
  - Users & roles
  - Products (CRUD), categories, inventory basics
  - Payment & shipping integrations (later phases)
- **Strengths:** Large market; clear business model; transferable skills.
- **Weaknesses:** Broad, multi-tenant scope; integration complexity (payments, shipping, taxes); security and compliance considerations; strong incumbents (e.g., Salla, Shopify).
- **Reason not selected:** Over-ambitious for the course timeline and crowded competitive landscape; high integration surface area.

---

## 🏠 3) Selected MVP Concept — UniStay KSA (Student Housing & Roommates)

### 3.1 Summary of the Chosen MVP
- **Problem:** After admission policies changed, students can be accepted to universities outside their home city. Many struggle to find safe, affordable accommodation quickly; listings are fragmented across Twitter, Haraj, Telegram, and street notices.
- **Solution (MVP):** A web/app platform focused on transferred students to discover rooms, shared apartments, and student-friendly hotels/serviced apartments near campuses. Students can filter by price, distance, female-only or group housing, and desired roommate setup. Owners (individuals or hotels) can list spaces and optionally provide student discounts. In-app chat enables owners and students to align on house rules and details.

**Core MVP flows (scope):**
- Discover: Campus/city search → filters (budget, distance, room type, female-only, roommates).
- Listings: Photos, price, rules, deposit, availability, map pin, “student discount” tag.
- Roommates: Opt-in roommate matching (basic preferences, same campus/program optional).
- Owners: Post/Manage listing (individual landlords & partner hotels); verify via phone/email.
- Safety & Trust (v1): edu-email badge (optional), report listing, profile completeness score.
- Messaging: In-app chat to discuss terms; no in-app payments in MVP.

### 3.2 Reasons for Selection
- Lived pain & demand: Team members and peers faced this exact problem; strong user empathy and clear value.
- Feasibility in 3 months: Can start one pilot city (e.g., Riyadh/Jeddah) and seed supply via owner outreach and student communities; no complex external integrations required for MVP.
- Innovation / focus: Unlike general classifieds, student-first filters (near campus, female groups, roommate preferences, student discounts) tightly match the use case.
- Alignment with course goals: Clean data model, role-based access (student/owner/mod), geo search, safety/verification, and chat—great coverage of SDLC, architecture, and documentation.

### 3.3 Potential Challenges & Opportunities
**Challenges (with mitigations):**
- Supply cold-start: Hard to convince owners/hotels early.  
Mitigation: Start with a micro-pilot (one campus), outbound invites, featured “early partner” badges, and simple student-discount toggle for hotels to attract demand.
- Trust & safety (fraud/scams): New platform needs credibility.  
Mitigation: Optional .edu email verification badge, phone verification, report/ban tools, visible profile completeness, and clear house-rules templates.
- Affordability & coverage across KSA: Large geography; variable rents.  
Mitigation: Phase rollout (city by city), price bands and “distance to campus” filter, spotlight budget listings and shared rooms.
- Legal & operational clarity: Listings must comply with local housing norms/policies.  
Mitigation: Clear terms & disclaimers, content moderation, owner attestation on each listing; no payments/leases handled in-app during MVP.
- Quality of listings: Incomplete info/photos reduce conversion.  
Mitigation: Guided listing form, required key fields, photo checklist, and “listing quality score.”

**Opportunities:**
- University partnerships: Housing offices and student clubs for distribution and verified listings.
- Hotel/serviced apartments: Off-peak inventory with student rates; steady occupancy for partners.
- Female group housing: Dedicated category and safety features to support group stays.
- Seasonal admission peaks: Launch campaigns aligned with admission results & semester start.
- Future extensions: In-app booking/deposits, roommate matching upgrades, verified landlord program, utilities-included bundles, and relocation guides.
