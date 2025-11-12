# 📄 Darek Project Closure Report

## 1. Results Summary
- **MVP Completion:** The Darek platform successfully delivered **all Must-Have and most Should-Have features** outlined in the charter. Core functionalities include searchable accommodation listings, robust filters (price, distance, female-only, roommate availability), verified landlord listings, secure in-app messaging, bookmarking, dashboards for students and landlords, and admin listing approval.  
- **Feature Coverage:** Approximately **90 % of planned features** were implemented. Nice-to-have “Could” items (rating system and profile completeness) were partly delivered by the end of Sprint 3.  
- **User Feedback:** Early testers found the UI intuitive and appreciated built-in trust mechanisms (verification badges and admin approvals). The roommate matching feature generated positive interest, though more work remains for matching refinement.  
- **Performance & Reliability:** Load testing indicated stable response times and low error rates. Real-time messaging performed consistently under moderate simulated load.  
- **Alignment with Objectives:** The MVP meets the charter’s goals of providing a student-centric housing search platform, addressing safety concerns via verification, and offering filters specific to Saudi students’ needs. While out-of-city accommodations are covered for initial pilot cities, full geographical coverage remains a future ambition.

## 2. Lessons Learned
- **Planning & Prioritisation:** Using the MoSCoW framework helped clarify which features were mandatory. However, some tasks underestimated research and testing time (e.g., WebSockets and Twilio integration). Future projects should **buffer more time for research** and adopt more realistic task estimates.  
- **Technology Readiness:** Choosing Django/React was ultimately successful, but the learning curve slowed Sprint 1. Early pair programming sessions or tutorials could have reduced ramp-up time.  
- **Communication & Collaboration:** Daily Discord updates and a defined Git workflow improved visibility and quality. **Regular sprint reviews and retrospectives** surfaced blockers early and aligned expectations.  
- **Testing & QA:** Automated tests and continuous deployment pipelines proved invaluable. More time should be allocated for **end-to-end and cross-browser testing** mid-sprint rather than clustering it at the end.  
- **Time Management:** External obligations (courses, exams) posed recurring challenges. The team learned to adjust workload and stay flexible during exam periods. For future projects, setting clear availability windows and redistributing tasks sooner would help maintain momentum.  
- **Localization:** Arabic support was scoped as a post-MVP feature. In hindsight, planning for multilingual support at the design stage would simplify future integration; however, focusing on core functionality first was necessary given time constraints.

## 3. Team Retrospective Highlights
- **What Worked Well:**
  - Clear role assignments (PM, SCM, QA, Dev) kept the project organised.
  - GitHub’s branching strategy and code reviews enforced consistent code quality.
  - Continuous integration on Railway and Netlify allowed quick demos and testing.
  - Frequent communication (Discord) and issue tracking (Trello/GitHub) maintained alignment despite variable schedules.

- **Challenges:**
  - **New Tech & Tools:** Sprint 1 was slowed by learning Django, PostgreSQL, and TypeScript.
  - **Real-Time Messaging Complexity:** Sprint 2’s Twilio and WebSocket integration introduced technical hurdles and race conditions.
  - **Time Constraints:** Sprint 3 coincided with university mid-terms, limiting development hours and causing fatigue.

- **Future Improvements:**
  - Introduce **onboarding/training periods** for unfamiliar frameworks before starting development.
  - Maintain a **live backlog** and redistribute tasks when team availability changes (e.g., during exams).
  - Begin documentation and user testing earlier in the process to avoid end-sprint bottlenecks.
  - Consider using mock services or simplified infrastructure for complex integrations during early sprints.

## 4. Conclusion & Next Steps
The Darek project demonstrates that a student-centric housing platform is both viable and valuable. By focusing on core needs—filtered search, trust through verification, messaging, and roommate matching—the team delivered a working MVP that aligns with Vision 2030 and addresses the gap in the current marketplace. 

For future iterations, the team recommends:
1. **Arabic localisation** and right-to-left UI support for broader adoption.
2. **Enhanced roommate matching** using more robust algorithms.
3. **Mobile app or responsive PWA** to reach users on smartphones.
4. **In-app payments** and contract management, once the MVP is stable.
5. **Extended coverage** beyond initial pilot cities, leveraging user feedback and partnerships.

By consolidating these results, lessons and reflections, the team closes this project with a clear roadmap for the next version and a solid foundation for future projects.
