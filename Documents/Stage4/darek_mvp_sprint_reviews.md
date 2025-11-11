# Darek MVP – Sprint Reviews & Retrospectives

This document summarises the outcomes of each sprint for the **Darek student‑housing MVP**, along with reflections on what went well, challenges encountered, and opportunities for improvement.

---

## 🟩 Sprint 1 Review & Retrospective

### Review

**Completed Features:**

- Django project initialised and PostgreSQL database set up  
- User registration, login and JWT authentication  
- Listing model and CRUD API endpoints  
- Search and filtering by price, distance, gender and roommate availability  
- Listing detail page with photos, price, rules and map  
- Owner dashboard for creating and editing listings  
- Git branching strategy and PR workflow configured  
- Initial deployment to Railway (backend) and Netlify (frontend)  
- Unit tests for core endpoints and basic QA run  

**Demo/Links:**  
- API endpoints demonstration: [https://darek-api.railway.app/docs](https://darek-api.railway.app/docs)  
- Front‑end demo (search and listing view): [https://darek.netlify.app/?sprint=1-demo](https://darek.netlify.app/?sprint=1-demo)  
- Sample pull requests: Sprint 1 PRs  

### Retrospective

**What went well:**  
- Effective collaboration tools (GitHub, Trello and Discord) kept everyone aligned and facilitated quick feedback.  
- Setting up continuous deployment early enabled rapid testing of new features.  
- The team quickly established a branching strategy and adhered to code review practices, improving code quality.  
- Choosing Django and React with TypeScript proved beneficial for rapid development once the initial learning curve was overcome.  

**Challenges:**  
- Learning new technologies (Django, React with TypeScript) slowed initial development as team members familiarised themselves with frameworks and tooling.  
- Managing environment variables and deployment configurations across local and staging environments caused some early integration issues.  
- Balancing coursework, part‑time work, and project commitments made it difficult to maintain consistent progress.  

**Improvements for next sprint:**  
- Allocate time for pair programming or knowledge‑sharing sessions to accelerate proficiency in new frameworks.  
- Document environment setup procedures more clearly and automate database migrations and seed scripts.  
- Block dedicated work hours in team members’ calendars to minimise delays caused by external commitments.  

---

## 🟨 Sprint 2 Review & Retrospective

### Review

**Completed Features:**  
- Real‑time messaging API using Django Channels and Redis  
- Chat user interface integrated with WebSocket backend  
- Roommate matching algorithm and API  
- Roommate matching page where students can opt in and set preferences  
- Bookmarking endpoints and persistence layer  
- Bookmarking UI including favourites page and save/un‑save buttons  
- Identity verification workflow (email/phone OTP) for users  
- Verification badges displayed on listings and profiles  
- Student and owner dashboards (messages, bookmarks, listings)  
- Hotel partner listing workflow with student discount flag  
- Integration tests for messaging, matching and bookmarking  
- Staging deployment updated; environment variables for Redis and Channels configured  

**Demo/Links:**  
- Messaging demo: [https://darek.netlify.app/?sprint=2-messaging](https://darek.netlify.app/?sprint=2-messaging)  
- Roommate matching demo: [https://darek.netlify.app/?sprint=2-roommates](https://darek.netlify.app/?sprint=2-roommates)  
- Verification and dashboard showcase: [https://darek.netlify.app/?sprint=2-dashboard](https://darek.netlify.app/?sprint=2-dashboard)  
- Pull requests for Sprint 2: Sprint 2 PRs  

### Retrospective

**What went well:**  
- The team maintained high velocity while delivering multiple features across front‑end and back‑end layers.  
- Introducing chat and roommate matching significantly increased platform value and differentiation.  
- The verification workflow improved trust and user confidence, and was well received in early feedback.  
- Collaboration improved as team members leveraged lessons learned from Sprint 1 and worked more independently.  

**Challenges:**  
- Implementing the messaging API with WebSockets and integrating it with Twilio for notifications proved more complex than anticipated.  
- Asynchronous programming patterns introduced new bugs (e.g., race conditions), requiring additional debugging time.  
- Time management remained an issue due to mid‑term examinations and external responsibilities.  

**Improvements for next sprint:**  
- Investigate using a mock Twilio service during development to reduce cost and speed up testing.  
- Allocate buffer time for research when working on unfamiliar technologies and frameworks.  
- Consider implementing a checklist for major features (e.g., chat) to ensure all edge cases are addressed before merging.  
- Continue automating tests and expand coverage for real‑time features to catch race conditions early.  

---

## 🟥 Sprint 3 Review & Retrospective

### Review

**Completed Features:**  
- Admin review and approval dashboard for owner/hotel listings  
- Rating and review system for listings (API and front‑end)  
- Reporting mechanism for fraudulent/inappropriate listings  
- Student discount tag feature; owners can flag listings as discounted  
- Profile completeness metric for students, visible to owners  
- Performance optimisations (database indexes, query tuning and caching)  
- End‑to‑end integration tests covering all user roles and critical flows  
- Comprehensive bug fixing and UI/UX polishing  
- Final deployment configuration and production release candidate  
- User documentation and demo video prepared  
- Sprint retrospective and lessons‑learned session held  

**Demo/Links:**  
- Admin dashboard demo: [https://darek.netlify.app/?sprint=3-admin](https://darek.netlify.app/?sprint=3-admin)  
- Rating & reporting showcase: [https://darek.netlify.app/?sprint=3-reviews](https://darek.netlify.app/?sprint=3-reviews)  
- Final release (pilot launch): [https://darek.netlify.app](https://darek.netlify.app)  
- Pull requests for Sprint 3: Sprint 3 PRs  

### Retrospective

**What went well:**  
- The team successfully delivered all critical administrative and trust features, bringing the MVP to production‑ready status.  
- Performance tuning and final bug fixes significantly improved user experience and reliability.  
- The final demo and documentation provided clear evidence of a functional platform and helped gain positive feedback from stakeholders.  
- Collaboration and communication practices matured across sprints, making integration smoother and reducing merge conflicts.  

**Challenges:**  
- University exams overlapped with this sprint, reducing the time available for development and increasing stress levels.  
- Finishing touches, such as UI polish and documentation, took longer than expected because of limited capacity.  
- The cumulative effect of three intensive sprints led to fatigue; maintaining motivation and focus became challenging.  

**Improvements for future projects:**  
- Build slack time into the schedule to accommodate academic obligations and unexpected external commitments.  
- Start documentation and video production earlier, rather than saving them for the final days.  
- Continue practicing time‑boxing and regular retrospectives to identify issues sooner and adjust workloads.  
- Explore delegating non‑critical tasks or seeking additional contributors during exam periods.  

---

## 🧭 Overall Reflection

Across all three sprints, the **Darek** team delivered a comprehensive MVP under tight deadlines and external pressures.  
Adopting an iterative approach allowed for continuous improvement, with each sprint building on lessons from the previous one.  
Major challenges—such as learning new technologies, implementing complex real‑time features, and balancing university commitments—were overcome through collaboration, determination and adaptability.  

For future development cycles, the team plans to:  
- Allocate more time for research and training  
- Incorporate contingency buffers  
- Maintain robust documentation throughout the project lifecycle
