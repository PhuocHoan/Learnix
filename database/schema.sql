-- ==============================================================================
-- Learnix Database Schema
-- PostgreSQL Migration Script
-- Generated from TypeORM entities
-- ==============================================================================

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS quiz_submissions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS lesson_resources CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS course_sections CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS external_auth CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;
DROP TYPE IF EXISTS quiz_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS auth_provider CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS lesson_type CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;

-- ==============================================================================
-- ENUM TYPES
-- ==============================================================================

CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_status AS ENUM ('draft', 'pending', 'published', 'rejected');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE quiz_status AS ENUM ('draft', 'ai_generated', 'approved');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE auth_provider AS ENUM ('google', 'github');
CREATE TYPE notification_type AS ENUM ('enrollment', 'payment_success', 'payment_failed', 'course_approved', 'course_rejected', 'course_submitted', 'course_completed', 'course_unenrollment', 'quiz_submitted', 'system');
CREATE TYPE lesson_type AS ENUM ('standard', 'quiz');
CREATE TYPE resource_type AS ENUM ('file', 'link');

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    "fullName" VARCHAR(255),
    "avatarUrl" VARCHAR(500),
    "oauthAvatarUrl" VARCHAR(500),
    role user_role,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "activationToken" VARCHAR(255),
    "activationTokenExpiry" TIMESTAMPTZ,
    "passwordResetToken" VARCHAR(255),
    "passwordResetTokenExpiry" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- External Auth Table (OAuth providers)
-- -----------------------------------------------------------------------------
CREATE TABLE external_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider auth_provider NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "accessToken" VARCHAR(500),
    "refreshToken" VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_id)
);

-- -----------------------------------------------------------------------------
-- Courses Table
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    level course_level NOT NULL DEFAULT 'beginner',
    status course_status NOT NULL DEFAULT 'draft',
    "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT,
    instructor_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_level ON courses(level);

-- -----------------------------------------------------------------------------
-- Course Sections Table
-- -----------------------------------------------------------------------------
CREATE TABLE course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_course_sections_course ON course_sections(course_id);

-- -----------------------------------------------------------------------------
-- Lessons Table
-- -----------------------------------------------------------------------------
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type lesson_type NOT NULL DEFAULT 'standard',
    content JSONB,
    "ideConfig" JSONB,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "isFreePreview" BOOLEAN NOT NULL DEFAULT FALSE,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_lessons_section ON lessons(section_id);

-- -----------------------------------------------------------------------------
-- Lesson Resources Table
-- -----------------------------------------------------------------------------
CREATE TABLE lesson_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type resource_type NOT NULL,
    url VARCHAR(500) NOT NULL,
    "fileSize" INTEGER,
    "lessonId" UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_lesson_resources_lesson ON lesson_resources("lessonId");

-- -----------------------------------------------------------------------------
-- Enrollments Table
-- -----------------------------------------------------------------------------
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    "completedLessonIds" TEXT,
    "completedAt" TIMESTAMPTZ,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- -----------------------------------------------------------------------------
-- Quizzes Table
-- -----------------------------------------------------------------------------
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID,
    lesson_id UUID,
    status quiz_status NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES users(id),
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_course ON quizzes(course_id);
CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_creator ON quizzes(created_by);

-- -----------------------------------------------------------------------------
-- Questions Table
-- -----------------------------------------------------------------------------
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    "questionText" TEXT NOT NULL,
    image_url TEXT,
    options JSONB NOT NULL,
    "correctAnswer" VARCHAR(10) NOT NULL,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id);

-- -----------------------------------------------------------------------------
-- Quiz Submissions Table
-- -----------------------------------------------------------------------------
CREATE TABLE quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    score REAL,
    total_points REAL,
    percentage REAL,
    responses JSONB NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_submissions_quiz ON quiz_submissions(quiz_id);
CREATE INDEX idx_quiz_submissions_user ON quiz_submissions(user_id);

-- -----------------------------------------------------------------------------
-- Payments Table
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255),
    method VARCHAR(50) NOT NULL DEFAULT 'credit_card',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_course ON payments(course_id);
CREATE INDEX idx_payments_status ON payments(status);

-- -----------------------------------------------------------------------------
-- Notifications Table
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info',
    "notificationType" notification_type,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(500),
    metadata JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications("userId", "isRead");
CREATE INDEX idx_notifications_user_type ON notifications("userId", "notificationType");

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
