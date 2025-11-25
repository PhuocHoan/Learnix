# Final Project Milestones Document — Learnix

**Table of content**

# **WEEK 1 — Authentication, Authorization, Layout & Dashboard Foundation**

## **Goal:**

Build the core technical foundation of Learnix, including authentication, authorization, design system, and dashboard prototype. 

## **Tasks**

### **Core / System Setup**

- **Repository & architecture setup** ***(~2-3 hours)***
    - Create FE/BE repos, folder structure, environment configs.
    
    > **Team member:** Core/All
    > 
- **Database design** ***(~5-6 hours)***
    - Main entities: `users`, `courses`, `lessons`, `enrollments`,
    `quizzes`, `questions`, `progress`, `submissions`, `reviews`.
    - Define relationships and constraints (1-N, N-N).
    
    > **Team member:** Backend
    > 

### Common Auth

- **Authentication *(3–4 hours)***
  
    **Email/Password Auth** 
    
    - Sign Up page + API
    - Sign In page + API
    - Token/session handling
    
    > **Team member:** Full-stack dev
    > 
    
    **Google OAuth**
    
    - Configure Google OAuth client
    - Implement Google login flow
    - Map Google account → Learnix user
    
    > **Team member:** Frontend + Backend
    > 
- **Authorization (Role-based) *(2–3 hours)***
    - Create roles: guest, student, instructor, admin.
    - Implement route guards & protected routes.
    - Hide/show/ Restricted UI elements depending on permissions.
    
    > **Team member:** Frontend dev
    > 
- **Layout & Theme System *(2–3 hours)***
    - Create AppShell (header, sidebar, content area).
    - Build global theme (colors, typography, spacing).
    - Create reusable components (Button, Card, FormField).
    
    > **Team member:** Frontend dev
    > 
- **Dashboard Prototype *(2–3 hours)***
    - Create dashboard layout.
    - Add 3 widgets with mock data:
        - Summary Cards
        - Progress overview
        - Activity list
    - Role-based dashboard display.
    
    > **Team member:** Frontend dev
    > 

## **Total time:** *16**–**22 hours*

---

# **WEEK 2 — Guest Browsing + Student Learning MVP**

## **Goal:**

**Week goal:** complete the main learning entry flow: browse → search → enroll → view lessons.

## **Tasks**

### **Guest + Public Features**

- **Homepage (Public) *(2–3 hours)***
    - Display latest courses.
    - Display categories and trending tags.
    
    > **Team member:** Frontend dev
    > 
- **Course List Page *(2–3 hours)***
    - Filter by category or tag.
    - Display course cards (title, instructor, difficulty).
    - Display whether pagination or infinite scroll.
    
    > **Team member:** Frontend + Backend
    > 
- **Course Detail Page *(2–3 hours)***
    - Show course overview, tags, instructor info, student count.
    - Lock lessons/quizzes for guest users (Display a pop up requesting for subcribing account)
    
    > **Team member:** Frontend + Backend
    > 
- **Search System *(0.5–1 hours)***
    - Implement full-text search across title, summary, and tags.
    
    > **Team member:** Frontend + Backend
    > 
- **Public Navigation *(1 hours)***
    - Navbar (Home, Courses, Login/Signup).
    
    > **Team member:** Frontend
    > 

### Student Features

- **Enroll / Unenroll Flow *(3–4 hours)***
    - Allow to enroll courses based on the student’s budget.
    - Unenroll from “My Courses”.
    
    > **Team member:** Frontend + Backend
    > 
- **Lesson Viewer (text + video)** ***(7–8 hours)***
    - Show lesson list after enrollment.
    - Render text lessons (paper material/pdf slides) + embedded video lessons.
    
    > **Team member:** Frontend + Backend
    > 
- **Student Dashboard *(6–12 hours)***
    - List enrolled courses.
    - Course status: in-progress / completed.
    - Completion % = completed lessons / total lessons.
    - Suggested courses base on previous courses and interests (if applicable).
    - The current budget includes bonus credits awarded for high-performance courses. For any course in which a student achieves a high score (e.g., at least 90/100 overall or demonstrates active participation), the student will receive bonus credits as specified for that course. These credits can then be used as payment for future courses.
    
    > **Team member:** Frontend + Backend
    > 

## Total time: *~26-35 hours*

---

# **WEEK 3 — Instructor + Manual Quiz**

## **Goal:**

Allow instructors to create courses/lessons/quizzes; students can take quizzes and get instant scoring.

## **Tasks**

### Instructor Features

- **Course Management *(5-6 hours)***
    - Create course: title, summary, tags, category, level, thumbnail.
    - Edit/update/delete course.
    - Publish / unpublish (draft vs published).
    
    > **Team member:** Frontend + Backend
    > 
- **Lesson Management *(6 - 8 hours)***
    - Add / edit lessons with text.
    - Attach video link/file.
    
    > **Team member:** Frontend + Backend
    > 
- **Instructor Dashboard *(4–5 hours)***
    - Show created courses.
    - Show student enrollment + average quiz score.

### Quiz Features (Manual)

- **Instructor creates quizzes manually *(~7–8 hours)***
    - Create quiz per course or lesson.
    - Add MCQ questions (A/B/C/D + correct answer).
    
    > **Team member:** Frontend + Backend
    > 
- **Student takes quiz + instant scoring** ***(~6–7 hours)***
    - Submit answers → auto-grade.
    - Save submission + score.
    
    > **Team member:** Frontend + Backend
    > 

## Total time: ~*31**–34 hours***

---

# **WEEK 4 — Admin Module + AI Quiz Generator MVP**

## Goal

Build admin control and “highlight features”: AI-generated quizzes, and track learning progress.

## Tasks

### **Admin Features**

- **User Management *(6–8 hours)***
    - View all users.
    - Assign roles.
    - Lock/unlock accounts.
    
    > **Team member:** Frontend + Backend
    > 
- **Course Moderation *(5–6 hours)***
    - States: draft → pending → approved/published → rejected/hidden.
    
    > **Team member:** Frontend + Backend
    > 
- **System Statistics *(3–4 hours)***
    - Total users, courses, enrollments.
    
    > **Team member:** Frontend + Backend
    > 

### **Instructor Feature: AI Quiz Generator (MVP)**

- **Generate MCQ from lesson text** ***(~8–10 hours)***
    - Input: lesson text / course summary.
    - Output: 5–10 draft MCQs.
    
    > **Team member:** Backend
    > 
- **Instructor review & edit before saving** ***(~5–6 hours)***
    - Preview AI questions.
    - Edit answers, remove bad items.
    - Approve → quiz saved.
    
    > **Team member:** Frontend + Backend
    > 

## **Total time:** ~*30**–**34 hours*

---

# **WEEK 5 — Embedded IDE + Testing + Final Release**

## Goal

Build in-browser coding, polish UI/UX, full system testing, deployment, and final presentation.

## **Tasks**

### Student Feature: Embedded IDE (Optional)

- **IDE UI integration** *(~5–6 hours)*
    - Code editor, Run button, Output console.
    - Attach IDE to lesson or separate practice page.
    
    > **Team member:** Frontend
    > 
- **Multi-language runtime (≥2 languages)** *(~6–8 hours, Backend)*
    - Suggested languages: **Python + JavaScript**.
    
    > **Team member:** Backend
    > 

### **Final Polish & QA**

- **UI/UX refinement** *(~6–8 hours, Frontend)*
    - Responsive screens, loading/empty states, error messages.
    
    > **Team member:** Frontend
    > 
- **Testing + bug fixing** *(~10–12 hours, QA + All)*
    - Test core flows:
        - Auth + OTP
        - Guest browse/search
        - Student enroll → lessons → quiz → IDE
        - Instructor create course/lesson/quiz/AI quiz
        - Admin approve/reject/role control
    
    > **Team member:** QA + All
    > 
- **Deployment + demo preparation** *(~6–8 hours, All)*
    - Deploy FE/BE.
    - Seed demo data.
    - Final report + slides + demo script/video.
    
    > **Team member:** All
    > 

## **Total Time:** ~35 hours