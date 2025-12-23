# Final project Self-assessment report

Team: 22127119-22127332

GitHub repo URL: https://github.com/PhuocHoan/Learnix

# **TEAM INFORMATION**

| Student ID | Full name         | Git account  | Contribution                        | Contribution percentage (100% total) | Expected total points | Final total points |
| :--------- | :---------------- | :----------- | :---------------------------------- | :----------------------------------- | :-------------------- | :----------------- |
| 22127119   | Ho Phuoc Hoan     | PhuocHoan    | \<List of tasks done by student 1\> | 33%                                  |                       |                    |
| 22127332   | Nguyen Hoang Phuc | hoangphuc841 | \<List of tasks done by student 2\> | 33%                                  |                       |                    |

# **FEATURE LIST**

**Project:** Learnix - Online Learning Platform

Students must input minus points to every uncompleted feature in the SE column.

\*SE: Self-evaluation

\*TR: Teacher review

| ID    | Features                                          | Grade     |          |          | Notes                                                                                                                                                                   |
| ----- | :------------------------------------------------ | --------- | :------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       |                                                   | **Point** | **SE\*** | **TR\*** |                                                                                                                                                                         |
| **1** | **Overall requirements**                          |           |          |          |                                                                                                                                                                         |
|       | User-centered design                              | \-5       |          |          | Built with user experience in mind. Focus on solving real learning problems: intuitive course browsing, interactive lessons, progress tracking, and seamless enrollment |
|       | Database design                                   | \-1       |          |          | Database with tables: `users`, `courses`, `lessons`, `enrollments`, `quizzes`, `questions`, `progress`, `submissions`, `reviews`                                        |
|       | Database mock data                                | \-1       |          |          | Sample courses, lessons, categories, users, quizzes, and test enrollments                                                                                               |
|       | Website layout                                    | \-2       |          |          | AppShell with header, sidebar, content area. Role-based layouts for Guest, Student, Instructor, Admin                                                                   |
|       | Website architect                                 | \-3       |          |          | Based on MVC architecture. Clear separation of concerns with controllers, services, repositories. Client-side validation, Input validation, Business rule validation    |
|       | Website stability and compatibility               | \-4       |          |          | Responsive design, tested on Chrome, Safari, Firefox, and Edge                                                                                                          |
|       | Document                                          | \-2       |          |          | Clear documentation for developers and users: setup guide, API endpoints, database design, system architecture, user guide                                              |
|       | Demo video                                        | \-5       |          |          | Video demonstrating all features: auth, guest browse/search, student enroll/lessons/quiz, instructor create course/lesson/quiz, admin approve/reject                    |
|       | Publish to public hosts                           | \-1       |          |          | Deployed FE/BE to a public hosting service with accessible URL                                                                                                          |
|       | Development progress is recorded in Github        | \-7       |          |          | Git history with meaningful commits, branches for features, pull requests                                                                                               |
| **2** | **Guest features (Public Browsing)**              |           |          |          |                                                                                                                                                                         |
|       | Homepage (Public)                                 | \-0.25    |          |          | Display latest courses, categories, and trending tags                                                                                                                   |
|       | Public Navigation                                 | \-0.25    |          |          | Navbar with Home, Courses, Login/Signup links                                                                                                                           |
|       | View list of courses                              | \-0.25    |          |          | Display course cards with title, instructor, difficulty level                                                                                                           |
|       | Filter courses by                                 |           |          |          | A combination of the criteria                                                                                                                                           |
|       | › Category                                        | \-0.25    |          |          | Filter by course categories                                                                                                                                             |
|       | › Tag                                             | \-0.25    |          |          | Filter by course tags                                                                                                                                                   |
|       | Sort courses                                      | \-0.25    |          |          | Sort available courses by various criteria                                                                                                                              |
|       | Course paging                                     | \-0.75    |          |          | Pagination or infinite scroll. URL updated on search/filter/paging                                                                                                      |
|       | View course details                               | \-0.25    |          |          | Course overview, tags, instructor info, student count                                                                                                                   |
|       | Lock lessons for guests                           | \-0.25    |          |          | Display popup requesting account subscription for locked content                                                                                                        |
|       | Fulltext search                                   | \-0.25    |          |          | Full-text search across title, summary, and tags                                                                                                                        |
|       | Theme System                                      | \-0.25    |          |          | Global theme with colors, typography, spacing. Reusable components (Button, Card, FormField)                                                                            |
|       | Responsive design                                 | \-0.25    |          |          | Responsive screens, loading/empty states, error messages                                                                                                                |
| **3** | **Authentication and authorization**              |           |          |          |                                                                                                                                                                         |
|       | Use a popular authentication library              | \-1       |          |          | JWT/Session-based authentication                                                                                                                                        |
|       | Registration (Sign Up)                            | \-0.5     |          |          | User registration with email/password                                                                                                                                   |
|       | Verify user input: password complexity, full name | \-0.25    |          |          | Password rules, required fields validation                                                                                                                              |
|       | Login to the website (Sign In)                    | \-0.25    |          |          | Email/password authentication with token/session handling                                                                                                               |
|       | Google OAuth                                      | \-0.25    |          |          | Google login flow, map Google account to Learnix user                                                                                                                   |
|       | Authorize website features (Role-based)           | \-0.25    |          |          | Roles: guest, student, instructor, admin. Route guards & protected routes                                                                                               |
|       | Hide/show UI elements based on permissions        | \-0.25    |          |          | Restricted UI elements depending on user role                                                                                                                           |
|       | Forgot password by email                          | \-0.25    |          |          | Password reset via email link                                                                                                                                           |
| **4** | **Features for Students**                         |           |          |          |                                                                                                                                                                         |
|       | Student Dashboard                                 | \-0.5     |          |          | List enrolled courses, course status (in-progress/completed), completion percentage                                                                                     |
|       | Dashboard widgets                                 | \-0.25    |          |          | Summary cards, progress overview, activity list                                                                                                                         |
|       | Suggested courses                                 | \-0.25    |          |          | Course recommendations based on previous courses and interests                                                                                                          |
|       | Enrollment                                        |           |          |          |                                                                                                                                                                         |
|       | › Enroll in courses                               | \-0.25    |          |          | Allow enrollment based on student's budget                                                                                                                              |
|       | › Unenroll from courses                           | \-0.25    |          |          | Unenroll from "My Courses"                                                                                                                                              |
|       | Learning Experience                               |           |          |          |                                                                                                                                                                         |
|       | › View lesson list                                | \-0.25    |          |          | Show lesson list after enrollment                                                                                                                                       |
|       | › Lesson Viewer (text)                            | \-0.25    |          |          | Render text lessons, paper material, PDF slides                                                                                                                         |
|       | › Lesson Viewer (video)                           | \-0.25    |          |          | Embedded video lessons                                                                                                                                                  |
|       | › Track learning progress                         | \-0.25    |          |          | Completion % = completed lessons / total lessons                                                                                                                        |
|       | Quizzes                                           |           |          |          |                                                                                                                                                                         |
|       | › Take quiz                                       | \-0.25    |          |          | Answer MCQ questions (A/B/C/D)                                                                                                                                          |
|       | › Instant scoring                                 | \-0.25    |          |          | Submit answers → auto-grade → view score                                                                                                                                |
|       | › View quiz results                               | \-0.25    |          |          | Score display with correct/incorrect answers                                                                                                                            |
| **5** | **Features for Instructors**                      |           |          |          |                                                                                                                                                                         |
|       | Instructor Dashboard                              | \-0.5     |          |          | Show created courses, student enrollment count, average quiz scores                                                                                                     |
|       | Course Management                                 |           |          |          |                                                                                                                                                                         |
|       | › Create course                                   | \-0.25    |          |          | Add course with title, summary, tags, category, level, thumbnail                                                                                                        |
|       | › Edit/Update course                              | \-0.25    |          |          | Edit existing course information                                                                                                                                        |
|       | › Delete course                                   | \-0.25    |          |          | Remove course                                                                                                                                                           |
|       | › Publish/Unpublish course                        | \-0.25    |          |          | Toggle between draft and published status                                                                                                                               |
|       | Lesson Management                                 |           |          |          |                                                                                                                                                                         |
|       | › Add lessons                                     | \-0.25    |          |          | Create lessons with text content                                                                                                                                        |
|       | › Edit lessons                                    | \-0.25    |          |          | Update existing lesson content                                                                                                                                          |
|       | › Attach video                                    | \-0.25    |          |          | Attach video link/file to lessons                                                                                                                                       |
|       | Quiz Management (Manual)                          |           |          |          |                                                                                                                                                                         |
|       | › Create quiz                                     | \-0.25    |          |          | Create quiz per course or lesson                                                                                                                                        |
|       | › Add MCQ questions                               | \-0.25    |          |          | Add multiple choice questions (A/B/C/D + correct answer)                                                                                                                |
|       | › Edit/Delete questions                           | \-0.25    |          |          | Manage quiz questions                                                                                                                                                   |
|       | AI Quiz Generator                                 |           |          |          |                                                                                                                                                                         |
|       | › Generate MCQ from lesson text                   | \-0.5     |          |          | Input lesson text/summary → Output 5-10 draft MCQs using AI                                                                                                             |
|       | › Review & edit AI questions                      | \-0.25    |          |          | Preview AI questions, edit answers, remove bad items                                                                                                                    |
|       | › Approve and save quiz                           | \-0.25    |          |          | Approve AI-generated quiz → save to database                                                                                                                            |
| **6** | **Administration features (Admin)**               |           |          |          |                                                                                                                                                                         |
|       | Admin Dashboard                                   | \-0.5     |          |          | System statistics: total users, courses, enrollments                                                                                                                    |
|       | User Management                                   |           |          |          |                                                                                                                                                                         |
|       | › View all users                                  | \-0.25    |          |          | List all users with filters and search                                                                                                                                  |
|       | › Assign roles                                    | \-0.25    |          |          | Change user roles (student, instructor, admin)                                                                                                                          |
|       | › Lock/Unlock accounts                            | \-0.25    |          |          | Suspend or reactivate user accounts                                                                                                                                     |
|       | Course Moderation                                 |           |          |          |                                                                                                                                                                         |
|       | › Review submitted courses                        | \-0.25    |          |          | View courses pending approval                                                                                                                                           |
|       | › Approve/Reject courses                          | \-0.25    |          |          | Course states: draft → pending → approved/published → rejected/hidden                                                                                                   |
|       | › Show interactive charts                         | \-0.25    |          |          | Charts for system statistics (users, courses, enrollments)                                                                                                              |
| **7** | **Advanced features**                             |           |          |          |                                                                                                                                                                         |
|       | Embedded IDE                                      |           |          |          |                                                                                                                                                                         |
|       | › IDE UI integration                              | 0.25      |          |          | Code editor, Run button, Output console attached to lesson                                                                                                              |
|       | › Multi-language runtime                          | 0.25      |          |          | Support ≥2 languages (Python + JavaScript)                                                                                                                              |
|       | Dockerize your project                            | 0.25      |          |          | Docker containers for backend, frontend, database                                                                                                                       |
|       | CI/CD                                             | 0.25      |          |          | Automated testing and deployment pipeline (GitHub Actions, GitLab CI, Jenkins, etc.)                                                                                    |
|       | Test coverage                                     | 0.25      |          |          | Testing core flows: auth, browse/search, enroll, lessons, quiz, admin                                                                                                   |

# **GIT HISTORY**

## **Contributors**

| Avatar | Username           | Commits | Additions | Deletions |
| :----- | :----------------- | :------ | :-------- | :-------- |
|        | \<git_username_1\> |         |           |           |
|        | \<git_username_2\> |         |           |           |
|        | \<git_username_3\> |         |           |           |

## **Commits**

_List significant commits here with format:_

| Date       | Author     | Commit Message     | Files Changed |
| :--------- | :--------- | :----------------- | :------------ |
| YYYY-MM-DD | \<author\> | \<commit message\> | \<number\>    |

---

# **PROJECT SUMMARY**

## System Overview

**Learnix** is an online learning platform that enables:

- **Guests** to browse courses, search by title/summary/tags, view course details
- **Students** to enroll in courses, view lessons (text + video), track progress, take quizzes with instant scoring
- **Instructors** to create/manage courses and lessons, create quizzes manually or using AI quiz generator
- **Admins** to manage users, assign roles, moderate courses (approve/reject), view system statistics

## Technology Stack

- **Architecture:** Single Page Application (SPA) with separate FE/BE repos
- **Frontend:** React/Vue/Angular
- **Backend:** NodeJS with Express/NestJS
- **Database:** PostgreSQL / MongoDB
- **Authentication:** JWT/Session + Google OAuth
- **AI Integration:** OpenAI API for quiz generation
- **Infrastructure:** Docker, CI/CD pipeline
- **Hosting:** Cloud deployment (AWS/GCP/Vercel)

## Database Entities

| Entity        | Description                                                        |
| :------------ | :----------------------------------------------------------------- |
| `users`       | User accounts with roles (guest, student, instructor, admin)       |
| `courses`     | Course information (title, summary, tags, category, level, status) |
| `lessons`     | Lesson content (text, video links)                                 |
| `enrollments` | Student-course enrollment records                                  |
| `quizzes`     | Quiz metadata per course/lesson                                    |
| `questions`   | MCQ questions (A/B/C/D + correct answer)                           |
| `progress`    | Student learning progress tracking                                 |
| `submissions` | Quiz submission records with scores                                |
| `reviews`     | Course reviews and ratings                                         |

## Key User Flows

1. **Guest Browsing:** Homepage → Browse Courses → Filter/Search → View Course Details → Prompted to Sign Up
2. **Student Learning:** Sign Up/Login → Dashboard → Enroll in Course → View Lessons → Take Quiz → View Score
3. **Instructor Workflow:** Login → Dashboard → Create Course → Add Lessons → Create Quiz (Manual/AI) → Publish
4. **Admin Moderation:** Login → Dashboard → View Users → Manage Roles → Review Courses → Approve/Reject

## Development Timeline

| Week   | Focus                                             | Key Deliverables                                                                         |
| :----- | :------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| Week 1 | Authentication, Authorization, Layout & Dashboard | Auth (email + Google OAuth), role-based access, AppShell, dashboard prototype            |
| Week 2 | Guest Browsing + Student Learning MVP             | Homepage, course list/details, search, enroll/unenroll, lesson viewer, student dashboard |
| Week 3 | Instructor + Manual Quiz                          | Course/lesson management, instructor dashboard, manual quiz creation, quiz taking        |
| Week 4 | Admin Module + AI Quiz Generator MVP              | User management, course moderation, system stats, AI quiz generator                      |
| Week 5 | Embedded IDE + Testing + Final Release            | IDE integration (optional), UI/UX polish, testing, deployment, demo                      |

---

_Note: Fill in the student information, contribution details, self-evaluation scores, and git history before submission._
