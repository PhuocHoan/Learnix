# System Description

**Table of contents**

# 1. System Purpose

The purpose of Learnix is to provide a unified platform that improves both learning and teaching 1efficiency in IT education.

The system aims to help students learn more effectively through interactive coding and instant assessments, while supporting instructors with tools to manage content and generate quizzes automatically.

# 2. System Overview

### **2.1. Target Users**

- **Guests:** Guests: View course information, and search for topics without registration.
- **Students:** Learn IT courses, access lessons, practice coding, take quizzes, and track progress.
- **Instructors:** Create and manage courses, use AI to generate quizzes, and monitor learners.
- **Administrators:** Manage users, roles, and system configurations.

## 2.2. Scope of the System

Learnix is a web-based e-learning system with four user roles — **Guest, Student, Instructor, and Administrator** integrated with AI capabilities (AI Tutor, AI Quiz Generator).

It provides structured IT education with real-time coding practice and automated quiz generation.

# 3. System Functional Description

## 3.1. Guest subsystem - `guest`

### **Overview**

The Guest subsystem allows unregistered visitors to view course overviews and perform searches, but cannot access learning content or interactive features.

### **Main Functions**

- **Homepage**
  - Display featured courses and popular categories.
  - Show basic info: title, thumbnail, instructor, and short description.
- **Course List**
  - Browse courses by category or tag.
- **Course Details**
  - View course description, instructor name, difficulty level, and number of enrolled students.
  - Lessons and quizzes remain locked.
- **Search**
  - Search by course title, tags, or summary.
- **Register / Login**
  - Redirect to authentication when selecting “Enroll.”

## **3.2. Student Subsystem**

### **Overview**

The **Student subsystem** is the core learning module. Registered students can enroll in courses, study lessons, complete quizzes, and track their progress through an interactive learning dashboard.

### **Main Functions**

- **Course Enrollment**
  - Enroll or unenroll from courses.
  - Access lessons after enrolling.
- **Learning Lessons**
  - View lesson content in text or video format.
- **Quizzes**
  - Take quizzes created by instructors.
  - Receive immediate results and score.
- **Learning Dashboard**
  - View enrolled courses.
  - Track progress, quiz scores, and completion percentage.
- **Feedback**
  - Rate and comment on courses after completion.

## **3.3. Instructor Subsystem**

### **Overview**

The **Instructor subsystem** allows teachers to create, edit, and manage their courses, lessons, and quizzes. Instructors can utilize AI features to streamline quiz creation and track student performance.

### **Main Functions**

- **Course Management**
  - Create, edit, publish/unpublish, or delete courses.
  - Define title, description, categories, tags, and access type (free/premium).
- **Lesson Management**
  - Add or edit lessons with text or video content.
- **Quiz Management**
  - Create quizzes manually.
  - **AI Quiz Generator** Use AI to automatically generate multiple-choice or coding questions from course materials.
  - Add/edit multiple-choice questions.
- **Student Insights**
  - View enrolled students.
  - See average quiz scores and completion rates.
- **Feedback Management**
  - Review and respond to student comments.

## **3.4. Administrator Subsystem**

### **Overview**

The **Administrator subsystem** provides full control over user accounts, content moderation, and AI system configuration. It ensures smooth platform operation and compliance with content guidelines.

### **Main Functions**

- **User & Role Management**
  - View all users.
  - Lock/unlock users.
  - Assign roles (Student/Instructor/Admin).
- **Course Moderation**
  - View all courses.
  - Hide or delete inappropriate content.
  - Review reported courses or lessons.
- **System Configuration**
  - Manage environment-level settings.
- **Statistics**
  - View summary of users, courses, and completion metrics.

## 3.5. Common Features

- **Authentication**
  - Register, login, logout.
  - Forgot password flow.
- **Profile Management**
  - Update name, bio, date of birth, and profile picture.
- **Browse & Search**
  - Filter courses by title, instructor, tags, or categories.

---

# **4. Optional Advanced Features**

These features are considered **optional** and only implemented if time and resources allow.

## **4.1. Embedded IDE**

- Write and run code directly in the browser.
- Support for multiple programming languages.
- Run coding exercises with live output.

## **4.2. AI Quiz Generator**

- Auto-generate quiz questions from course materials.
- Instructor reviews and approves generated questions.

## **4.3. Gamification**

- Reward coins for quiz scores ≥ 80.
- Use coins to unlock premium courses.

# 5. AI Integration

### **AI Quiz Generator**

- Input: course materials (text or PDF)
- Output: 5–10 multiple-choice or coding questions.
- Model: OpenAI GPT-4o-mini or T5 Question Generation.

# **5. Technical Challenges**

During the development of **Learnix**, several technical challenges were identified and addressed:

## **5.1. AI Integration and Data Processing**

- Integrating the **AI Quiz Generator** required processing raw lesson content (text, markdown, PDF) into structured prompts suitable for the OpenAI API.
- Managing **context size and prompt efficiency** was challenging to ensure relevant and high-quality quiz generation while minimizing token usage and cost.

## **5.2. Optional Features**

**Embedded IDE Implementation**

- Developing a **browser-based code execution environment** that supports multiple programming languages demanded secure sandboxing.

## **5.3. Deployment and Integration**

- Deploying a full-stack web application with separate **frontend, backend, and database services** required consistent environment configuration and secure communication between components.
- Setting up proper **environment variables**, managing **CORS and API endpoints**, and ensuring smooth interaction between client and server layers were key technical considerations.

# 6. Evaluation

| **Criteria**           | **Description**                                                         | **Points** |
| ---------------------- | ----------------------------------------------------------------------- | ---------- |
| **1. Common Features** | - Registration, login with JWT or Session-Based authentication (0.5pts) |

- Profile management (Update name, bio) (0.25pts)
- View course list and details (0.25pts)
- Search courses by title, category, tag (0.25pts) | 1.75 |
  | **2. Basic Student Features** | - Enroll/unenroll courses (0.25pts)
- View lesson content (text, video) (0.5pts)
- Take quizzes, view results and earn reward coins (0.5pts)
- Rate and comment on courses (0.25pts) | 1.5 |
  | **3. Advanced Student Features** | - Embedded IDE integration for code execution (≥2 languages) (1pts)
- Learning progress tracking dashboard (0.5pts) | 1.5 |
  | **4. Instructor Features** | - Create and manage courses and lessons (1pts)
- Upload materials (video, code samples) (0.5pts)
- Create/edit quizzes manually (0.25pts)
- View student analytics and progress (0.5pts) | 2.25 |
  | **5. AI Quiz Generator Integration** | - AI auto-generates questions from course materials (1pts) | 1.0 |
  | **6. Administrator Features** | - Manage users, roles, and permissions (0.5pts)
- Content moderation and course management (0.5pts) | 1.0 |
  | **7. Deployment and Public Hosting** | - Deploy system to production environment
- Configure domain and ensure stable system operation | 0.5 |
  | **8. UI/UX and System Design** | - User-friendly, responsive interface
- Smooth user experience | 0.5 |

### **Notes:**

- Scores may be adjusted based on the actual complexity of each feature.
- Code quality, system architecture, and testing may also be evaluated as part of the overall score.
