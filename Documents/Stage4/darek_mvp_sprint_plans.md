# Darek MVP – Sprint Plans

This document outlines three iterative sprints for the **Darek student-housing platform**, spanning from **1 October 2025** to **9 November 2025**.  
Each sprint includes a goal, relevant user stories, and a detailed task breakdown with priorities, assignments, and deadlines.  
Tasks are prioritised using the **MoSCoW** framework (Must, Should, Could, Won’t).  
Deadlines assume the project team operates in the **Asia/Riyadh** timezone.

---

# 🟩 Sprint 1 Plan

**Sprint Duration:** 2 weeks  
**Sprint Start:** 2025-10-01  
**Sprint End:** 2025-10-14  

## 🎯 Sprint Goal
Lay the technical foundation for the MVP by building core back-end and front-end functionality:  
user registration and authentication, listing creation and retrieval, search and filtering, and initial deployment pipelines.  
Deliverables should allow a student to **find and view accommodation listings** and an **owner to add a new listing**.

---

## 👥 User Stories Covered

### Students (Must Have)
- As a student, I want to search for available accommodation near my campus so that I can quickly find suitable housing when relocating.  
- As a student, I want to filter listings by price, distance, female-only and roommate availability so that I can narrow results to my specific needs.  
- As a student, I want to view detailed listings with photos, price, rules and map location so that I can evaluate whether a place fits my needs.

### Owners / Landlords (Must Have)
- As an owner, I want to create a new listing with required fields (price, rules, photos, availability) so that students see complete and useful information.  
- As an owner, I want to edit or manage my listings from a dashboard so that I can keep availability and pricing updated.

---

## 🧩 Tasks & Assignments

| Task ID | Description | Priority | Assignee | Role | Deadline |
|----------|-------------|-----------|-----------|-------|-----------|
| 1 | Initialise Django project and set up PostgreSQL database; configure environment variables | Must | Abdulrahman | PM / Dev | 2025-10-01 |
| 2 | Set up React + TypeScript project; install dependencies and configure ESLint/Prettier | Must | Meshari | SCM / Dev | 2025-10-02 |
| 3 | Implement user registration, login and JWT-based authentication endpoints | Must | Mohammad | Dev | 2025-10-04 |
| 4 | Create Listing model and CRUD API endpoints (create, read, update, delete) | Must | Abdulrahman | Dev | 2025-10-05 |
| 5 | Implement search and filtering logic on listings (price, distance, female-only, roommate availability) | Must | Mohammad | Dev | 2025-10-07 |
| 6 | Design and implement listing search UI with filters and results grid | Must | Meshari | Dev | 2025-10-08 |
| 7 | Develop listing detail page with photo carousel, description, rules and embedded map | Must | Abdulelah | Dev | 2025-10-09 |
| 8 | Implement owner dashboard to create and edit listings | Must | Mohammad | Dev | 2025-10-10 |
| 9 | Configure Git branching strategy and pull-request workflow on GitHub | Must | Meshari | SCM | 2025-10-03 |
| 10 | Write unit tests for authentication and listing endpoints (backend) | Must | Mohammad | QA / Dev | 2025-10-11 |
| 11 | Deploy backend to Railway and frontend to Netlify; set up continuous deployment pipelines | Must | Abdulrahman & Meshari | Dev / SCM | 2025-10-12 |
| 12 | Run initial QA tests and log issues; prepare sprint review demo | Must | Abdulrahman | QA | 2025-10-14 |

### Notes
- Prioritise **functional completeness** over UI polish.  
- Use **MoSCoW tagging** in Trello for tracking.  
- Post **daily updates** in Discord and report blockers immediately.

---

# 🟨 Sprint 2 Plan

**Sprint Duration:** 2 weeks  
**Sprint Start:** 2025-10-15  
**Sprint End:** 2025-10-28  

## 🎯 Sprint Goal
Expand the MVP to include **communication and personalization**:  
real-time messaging, bookmarking, roommate matching, dashboards for roles, and verification badges.  
All features from Sprint 1 must remain functional in an integrated environment.

---

## 👥 User Stories Covered

### Students (Must / Should / Could)
- (Should Have) Messaging: communicate with owners in-app before deciding.  
- (Should Have) Bookmark listings for later comparison.  
- (Should Have) See verification badges (edu-email, phone, ID).  
- (Could Have) Opt into roommate matching based on preferences.

### Owners / Landlords
- (Should Have) Receive in-app inquiries from students.  
- (Must Have) Verify identity via phone/email.

### Hotel Partners
- (Must Have) List student-friendly rooms/apartments with discounts.

---

## 🧩 Tasks & Assignments

| Task ID | Description | Priority | Assignee | Role | Deadline |
|----------|-------------|-----------|-----------|-------|-----------|
| 1 | Implement chat/messaging backend using Django Channels and Redis | Should | Mohammad | Dev | 2025-10-18 |
| 2 | Develop real-time chat UI and integrate with messaging API | Should | Meshari | Dev | 2025-10-20 |
| 3 | Implement roommate matching API, including preference models and matching logic | Could | Abdulrahman | Dev | 2025-10-21 |
| 4 | Create roommate matching user interface for students | Could | Abdulelah | Dev | 2025-10-22 |
| 5 | Add bookmarking endpoints and persistent storage for favourites | Should | Mohammad | Dev | 2025-10-23 |
| 6 | Build bookmarking UI (save/un-save buttons, favourites page) | Should | Meshari & Abdulelah | Dev | 2025-10-24 |
| 7 | Implement identity verification workflow (email/phone OTP) | Must | Abdulrahman | Dev | 2025-10-20 |
| 8 | Display verification badges on listings and profiles | Should | Abdulelah | Dev | 2025-10-25 |
| 9 | Develop student dashboard for managing messages, bookmarks and profile | Should | Meshari | Dev | 2025-10-26 |
| 10 | Develop owner dashboard for managing listings and responding to messages | Must | Mohammad | Dev | 2025-10-25 |
| 11 | Add hotel partner listing workflow with student discount flag | Must | Abdulrahman | Dev | 2025-10-23 |
| 12 | Write integration tests for messaging, matching and bookmarking | Should | Mohammad | QA / Dev | 2025-10-27 |
| 13 | Deploy backend and frontend to staging with Redis/Channels setup | Should | Abdulrahman & Meshari | Dev / SCM | 2025-10-27 |
| 14 | Conduct QA testing, fix critical bugs, prepare sprint review demo | Should | Abdulrahman | QA / PM | 2025-10-28 |

### Notes
- Messaging and roommate matching require **Redis** and **WebSocket** support.  
- Don’t store raw OTPs for verification.  
- Prioritise **Must/Should** tasks; postpone **Could** if necessary.

---

# 🟥 Sprint 3 Plan

**Sprint Duration:** 1 week and 4 days  
**Sprint Start:** 2025-10-29  
**Sprint End:** 2025-11-09  

## 🎯 Sprint Goal
Complete remaining functionality focused on **trust, admin tools, and optimisation**:  
reviews, fraud reporting, discount tags, and performance improvements.  
Deliver a **production-ready MVP**.

---

## 👥 User Stories Covered

### Students (Could Have)
- Rate or report listings to improve trust and reduce scams.  
- View “student discount” tags on listings.

### Owners / Landlords (Should / Could)
- Mark listings with “student discount” tags.  
- View profile completeness of students.

### Admin / Moderator (Must Have)
- Approve owner/hotel listings before publishing.  
- View and handle fraud reports.

---

## 🧩 Tasks & Assignments

| Task ID | Description | Priority | Assignee | Role | Deadline |
|----------|-------------|-----------|-----------|-------|-----------|
| 1 | Implement admin review and approval endpoints and dashboard | Must | Mohammad | Dev | 2025-10-31 |
| 2 | Develop rating and review system (API + UI) | Could | Abdulrahman & Meshari | Dev | 2025-11-02 |
| 3 | Implement reporting mechanism for fraudulent/inappropriate listings | Must | Mohammad & Abdulelah | Dev | 2025-11-04 |
| 4 | Add student discount tag functionality (API + UI) | Should | Abdulrahman & Abdulelah | Dev | 2025-10-30 |
| 5 | Implement profile completeness metric for students | Could | Mohammad | Dev | 2025-11-05 |
| 6 | Optimise search queries, add DB indexes, and conduct load testing | Should | Abdulrahman | Dev / QA | 2025-11-05 |
| 7 | Perform end-to-end integration tests for all roles and features | Must | Abdulrahman & Mohammad | QA / Dev | 2025-11-06 |
| 8 | Fix critical bugs and polish UI/UX | Must | Meshari & Abdulelah | Dev | 2025-11-07 |
| 9 | Finalise deployment configuration; prepare release candidate | Must | Abdulrahman | PM / Dev | 2025-11-08 |
| 10 | Prepare user documentation and demo video; sprint retrospective | Must | Abdulrahman & Abdulelah | PM / QA | 2025-11-09 |

### Notes
- Admin tools depend on seeded data.  
- Reviews and reports should be moderated with profanity filters.  
- Optimisation targets **search endpoints** due to high traffic.

---

# 📊 Summary

Across three sprints, the **Darek** team will deliver a functional **student-housing MVP**:
- **Sprint 1:** Foundation — authentication, listings, search.  
- **Sprint 2:** Communication & personalisation — messaging, bookmarks, verification.  
- **Sprint 3:** Trust & optimisation — admin tools, reporting, ratings, performance.  

By **9 November 2025**, the platform will be **production-ready** for pilot launch.
