-- ==============================================================================
-- Learnix COMPREHENSIVE SEED DATA - Proper Tiptap Format
-- All Tables | Proper JSON Structure | Complete Curricula for All Courses
-- ==============================================================================

TRUNCATE quiz_submissions, questions, quizzes, payments, notifications, 
         lesson_resources, lessons, enrollments, course_sections, courses, 
         external_auth, users CASCADE;

-- Password for all: Password@123
-- Hash: $2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri

-- ==============================================================================
-- 1. USERS
-- ==============================================================================

INSERT INTO users (id, email, password, "fullName", "avatarUrl", role, "isActive", "isEmailVerified", "createdAt", "updatedAt")
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@learnix.edu', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Admin User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'admin', TRUE, TRUE, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'instructor@learnix.edu', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Instructor User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor', 'instructor', TRUE, TRUE, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'student@learnix.edu', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Student User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student', 'student', TRUE, TRUE, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000001', 'dr.smith@learnix.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Dr. Alan Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alan', 'instructor', TRUE, TRUE, NOW() - INTERVAL '8 months', NOW()),
    ('10000000-0000-0000-0000-000000000002', 'prof.chen@learnix.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Prof. Sarah Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'instructor', TRUE, TRUE, NOW() - INTERVAL '7 months', NOW()),
    ('10000000-0000-0000-0000-000000000003', 'eng.kumar@learnix.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Eng. Raj Kumar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=raj', 'instructor', TRUE, TRUE, NOW() - INTERVAL '6 months', NOW()),
    ('20000000-0000-0000-0000-000000000001', 'alice.wonder@student.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Alice Wonderland', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', 'student', TRUE, TRUE, NOW() - INTERVAL '5 months', NOW()),
    ('20000000-0000-0000-0000-000000000002', 'bob.builder@student.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Bob Builder', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', 'student', TRUE, TRUE, NOW() - INTERVAL '4 months', NOW()),
    ('20000000-0000-0000-0000-000000000003', 'charlie.brown@student.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Charlie Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie', 'student', TRUE, TRUE, NOW() - INTERVAL '3 months', NOW()),
    ('20000000-0000-0000-0000-000000000004', 'diana.prince@student.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Diana Prince', 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', 'student', TRUE, TRUE, NOW() - INTERVAL '2 months', NOW()),
    ('20000000-0000-0000-0000-000000000005', 'ethan.hunt@student.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Ethan Hunt', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ethan', 'student', TRUE, TRUE, NOW() - INTERVAL '1 month', NOW()),
    ('20000000-0000-0000-0000-000000000006', 'fiona.apple@student.com', '$2b$10$0l/2jh5vOJVkkgjBbkfgveGpAYkGXLHiaVwI7AtMQHgzbkRlOt2Ri', 'Fiona Apple', 'https://api.dicebear.com/7.x/avataaars/svg?seed=fiona', 'student', TRUE, TRUE, NOW() - INTERVAL '3 weeks', NOW());

-- ==============================================================================
-- 2. EXTERNAL AUTH
-- ==============================================================================

INSERT INTO external_auth (id, provider, provider_id, user_id, "accessToken", "refreshToken", created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'google', 'google_alice_123456', '20000000-0000-0000-0000-000000000001', 'ya29.mock_access_token_alice', 'mock_refresh_token_alice', NOW() - INTERVAL '5 months', NOW()),
    (gen_random_uuid(), 'github', 'github_bob_789012', '20000000-0000-0000-0000-000000000002', 'gho_mock_access_token_bob', 'mock_refresh_token_bob', NOW() - INTERVAL '4 months', NOW()),
    (gen_random_uuid(), 'google', 'google_charlie_345678', '20000000-0000-0000-0000-000000000003', 'ya29.mock_access_token_charlie', 'mock_refresh_token_charlie', NOW() - INTERVAL '3 months', NOW());

-- ==============================================================================
-- 3. COURSES (5 Complete Courses)
-- ==============================================================================

INSERT INTO courses (id, title, description, "thumbnailUrl", price, level, status, "isPublished", tags, instructor_id, created_at, updated_at)
VALUES 
    ('c0000001-0000-0000-0000-000000000001', 'Complete Fullstack Web Development with React & Node.js', 
     'Master modern web development from frontend to backend. Build production-ready applications using React 19, Node.js, TypeScript, and PostgreSQL.',
     'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800', 
     129.99, 'beginner', 'published', TRUE, 'web,react,nodejs,typescript', 
     '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '6 months', NOW()),
    
    ('c0000001-0000-0000-0000-000000000002', 'Artificial Intelligence & Machine Learning with Python', 
     'Dive deep into AI and ML concepts. Master TensorFlow, PyTorch, neural networks, NLP, and computer vision.',
     'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 
     179.99, 'advanced', 'published', TRUE, 'ai,python,machinelearning', 
     '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 months', NOW()),
    
    ('c0000001-0000-0000-0000-000000000003', 'DevOps Mastery: Docker, Kubernetes & AWS', 
     'Complete DevOps journey covering containerization, orchestration, CI/CD pipelines, and cloud deployment.',
     'https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=800', 
     149.99, 'intermediate', 'published', TRUE, 'devops,docker,kubernetes,aws', 
     '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '4 months', NOW()),
    
    ('c0000001-0000-0000-0000-000000000004', 'Modern UI/UX Design with Figma', 
     'Learn professional UI/UX design principles, user research, wireframing, and building scalable design systems.',
     'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800', 
     89.99, 'beginner', 'published', TRUE, 'design,uiux,figma', 
     '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 months', NOW()),
    
    ('c0000001-0000-0000-0000-000000000005', 'Data Science & Analytics with Python', 
     'Master data analysis, visualization, statistical modeling, and predictive analytics with pandas, NumPy, and scikit-learn.',
     'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 
     139.99, 'intermediate', 'published', TRUE, 'datascience,python,analytics', 
     '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 months', NOW());

-- ==============================================================================
-- 4. COURSE SECTIONS
-- ==============================================================================

INSERT INTO course_sections (id, title, "orderIndex", course_id) VALUES
-- Course 1
('a1000001-0000-0000-0000-000000000001', 'Getting Started & Fundamentals', 0, 'c0000001-0000-0000-0000-000000000001'),
('a1000001-0000-0000-0000-000000000002', 'Frontend with React', 1, 'c0000001-0000-0000-0000-000000000001'),
('a1000001-0000-0000-0000-000000000003', 'Backend with Node.js', 2, 'c0000001-0000-0000-0000-000000000001'),
-- Course 2
('a1000002-0000-0000-0000-000000000001', 'Python & ML Basics', 0, 'c0000001-0000-0000-0000-000000000002'),
('a1000002-0000-0000-0000-000000000002', 'Neural Networks', 1, 'c0000001-0000-0000-0000-000000000002'),
-- Course 3
('a1000003-0000-0000-0000-000000000001', 'Docker & Containers', 0, 'c0000001-0000-0000-0000-000000000003'),
('a1000003-0000-0000-0000-000000000002', 'Kubernetes', 1, 'c0000001-0000-0000-0000-000000000003'),
-- Course 4
('a1000004-0000-0000-0000-000000000001', 'Design Principles', 0, 'c0000001-0000-0000-0000-000000000004'),
('a1000004-0000-0000-0000-000000000002', 'Figma Mastery', 1, 'c0000001-0000-0000-0000-000000000004'),
-- Course 5
('a1000005-0000-0000-0000-000000000001', 'Data Analysis', 0, 'c0000001-0000-0000-0000-000000000005'),
('a1000005-0000-0000-0000-000000000002', 'Visualization', 1, 'c0000001-0000-0000-0000-000000000005');

-- ==============================================================================
-- 5. LESSONS (Proper Tiptap JSON Format)
-- ==============================================================================

INSERT INTO lessons (id, title, type, content, "ideConfig", "durationSeconds", "isFreePreview", "orderIndex", section_id) VALUES
-- Course 1 Lessons
('b1000001-0000-0000-0000-000000000001', 'Welcome to Fullstack Development', 'standard',
 '[{"id":"intro1","type":"text","content":"# Welcome to Fullstack Web Development\n\nIn this comprehensive course, you will learn to build **production-ready web applications** from scratch.\n\n### What You Will Learn:\n\n- Modern React 19 with Server Components\n- TypeScript for type safety\n- Node.js and Express backend\n- PostgreSQL database design","orderIndex":0},{"id":"introimg","type":"image","content":"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800","metadata":{"caption":"Modern web development workspace"},"orderIndex":1},{"id":"vid1","type":"video","content":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","orderIndex":2}]',
 NULL, 720, TRUE, 0, 'a1000001-0000-0000-0000-000000000001'),

('b1000001-0000-0000-0000-000000000002', 'HTML5 and CSS3 Fundamentals', 'standard',
 '[{"id":"html1","type":"text","content":"## Modern HTML and CSS\n\nLearn the building blocks of the web:\n\n- HTML5 Semantic Elements\n- CSS3 Flexbox and Grid\n- Responsive Design","orderIndex":0},{"id":"htmlcode","type":"code","content":"<header>\n  <nav>\n    <ul>\n      <li><a href=\"/\">Home</a></li>\n      <li><a href=\"/about\">About</a></li>\n    </ul>\n  </nav>\n</header>\n<main>\n  <article>\n    <h1>Article Title</h1>\n    <p>Content here...</p>\n  </article>\n</main>","metadata":{"language":"html"},"orderIndex":1}]',
 NULL, 1200, TRUE, 1, 'a1000001-0000-0000-0000-000000000001'),

('b1000001-0000-0000-0000-000000000003', 'JavaScript ES6+ Essentials', 'standard',
 '[{"id":"js1","type":"text","content":"## Modern JavaScript\n\nMaster ES6+ features:\n\n- Arrow Functions\n- Destructuring\n- Async/Await\n- Modules","orderIndex":0}]',
 NULL, 1800, FALSE, 2, 'a1000001-0000-0000-0000-000000000001'),

('b1000001-0000-0000-0000-000000000004', 'React Components and Props', 'standard',
 '[{"id":"react1","type":"text","content":"# Building React Components\n\nComponents are the building blocks of React applications. Learn to create **reusable** and **composable** components.\n\n### Functional Components","orderIndex":0},{"id":"reactcode","type":"code","content":"function Welcome({ name }) {\n  return <h1>Hello, {name}!</h1>;\n}\n\n// Usage\n<Welcome name=\"Alice\" />","metadata":{"language":"javascript"},"orderIndex":1},{"id":"reactimg","type":"image","content":"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800","metadata":{"caption":"React component architecture"},"orderIndex":2}]',
 NULL, 2100, FALSE, 0, 'a1000001-0000-0000-0000-000000000002'),

('b1000001-0000-0000-0000-000000000005', 'State Management with Hooks', 'standard',
 '[{"id":"hooks1","type":"text","content":"## React Hooks\n\nHooks let you use state in functional components:\n\n- useState - Manage state\n- useEffect - Side effects\n- useContext - Access context","orderIndex":0}]',
 NULL, 2400, FALSE, 1, 'a1000001-0000-0000-0000-000000000002'),

('b1000001-0000-0000-0000-000000000006', 'Node.js and Express Fundamentals', 'standard',
 '[{"id":"node1","type":"text","content":"# Backend with Node.js\n\nNode.js allows you to run JavaScript on the server. Express is a minimal web framework.","orderIndex":0}]',
 NULL, 2700, FALSE, 0, 'a1000001-0000-0000-0000-000000000003'),

-- Course 2 Lessons
('b1000002-0000-0000-0000-000000000001', 'Introduction to Machine Learning', 'standard',
 '[{"id":"ml1","type":"text","content":"# Welcome to AI and Machine Learning\n\nDiscover the world of artificial intelligence.\n\n- Supervised Learning\n- Unsupervised Learning\n- Deep Learning","orderIndex":0},{"id":"mlimg","type":"image","content":"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800","metadata":{"caption":"AI and machine learning visualization"},"orderIndex":1},{"id":"mlcode","type":"code","content":"from sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\n\n# Split data\nX_train, X_test, y_train, y_test = train_test_split(X, y)\n\n# Train model\nmodel = LogisticRegression()\nmodel.fit(X_train, y_train)\n\n# Evaluate\nscore = model.score(X_test, y_test)\nprint(f''Accuracy: {score}'')","metadata":{"language":"python"},"orderIndex":2}]',
 NULL, 900, TRUE, 0, 'a1000002-0000-0000-0000-000000000001'),

('b1000002-0000-0000-0000-000000000002', 'Python for Data Science', 'standard',
 '[{"id":"py1","type":"text","content":"## Python Libraries for ML\n\nMaster essential libraries:\n\n- NumPy - Numerical computing\n- Pandas - Data manipulation\n- Scikit-learn - ML algorithms","orderIndex":0}]',
 NULL, 1800, TRUE, 1, 'a1000002-0000-0000-0000-000000000001'),

('b1000002-0000-0000-0000-000000000003', 'Neural Networks Architecture', 'standard',
 '[{"id":"nn1","type":"text","content":"# Understanding Neural Networks\n\nLearn how neural networks work.","orderIndex":0}]',
 NULL, 2400, FALSE, 0, 'a1000002-0000-0000-0000-000000000002'),

-- Course 3 Lessons
('b1000003-0000-0000-0000-000000000001', 'Docker Fundamentals', 'standard',
 '[{"id":"docker1","type":"text","content":"# Introduction to Docker\n\nLearn containerization with Docker. Containers package your application with all its dependencies.","orderIndex":0},{"id":"dockerimg","type":"image","content":"https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800","metadata":{"caption":"Docker containers architecture"},"orderIndex":1},{"id":"dockercode","type":"code","content":"FROM node:20-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm install\n\nCOPY . .\n\nEXPOSE 3000\n\nCMD [\"npm\", \"start\"]","metadata":{"language":"dockerfile"},"orderIndex":2}]',
 NULL, 1800, TRUE, 0, 'a1000003-0000-0000-0000-000000000001'),

('b1000003-0000-0000-0000-000000000002', 'Kubernetes Basics', 'standard',
 '[{"id":"k8s1","type":"text","content":"## Kubernetes Orchestration\n\nMaster container orchestration.","orderIndex":0}]',
 NULL, 2100, FALSE, 0, 'a1000003-0000-0000-0000-000000000002'),

-- Course 4 Lessons
('b1000004-0000-0000-0000-000000000001', 'Design Principles', 'standard',
 '[{"id":"design1","type":"text","content":"# UI/UX Design Fundamentals\n\nLearn core design principles:\n\n- **Contrast** - Make important elements stand out\n- **Alignment** - Create visual connections\n- **Repetition** - Build consistency\n- **Proximity** - Group related items","orderIndex":0},{"id":"designimg","type":"image","content":"https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800","metadata":{"caption":"UI/UX design principles in action"},"orderIndex":1}]',
 NULL, 1500, TRUE, 0, 'a1000004-0000-0000-0000-000000000001'),

('b1000004-0000-0000-0000-000000000002', 'Figma Essentials', 'standard',
 '[{"id":"figma1","type":"text","content":"## Mastering Figma\n\nFigma is the leading collaborative design tool.","orderIndex":0}]',
 NULL, 1800, TRUE, 1, 'a1000004-0000-0000-0000-000000000002'),

-- Course 5 Lessons
('b1000005-0000-0000-0000-000000000001', 'Pandas for Data Analysis', 'standard',
 '[{"id":"pandas1","type":"text","content":"# Data Analysis with Pandas\n\nPandas is essential for data manipulation in Python. Work with DataFrames and Series to analyze data efficiently.","orderIndex":0},{"id":"pandascode","type":"code","content":"import pandas as pd\n\n# Read CSV file\ndf = pd.read_csv(''data.csv'')\n\n# Display first rows\nprint(df.head())\n\n# Get summary statistics\nprint(df.describe())\n\n# Filter data\nfiltered = df[df[''age''] > 25]\n\n# Group and aggregate\ngrouped = df.groupby(''category'').mean()","metadata":{"language":"python"},"orderIndex":1},{"id":"pandasimg","type":"image","content":"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800","metadata":{"caption":"Data analysis visualization"},"orderIndex":2}]',
 NULL, 2000, TRUE, 0, 'a1000005-0000-0000-0000-000000000001'),

('b1000005-0000-0000-0000-000000000002', 'Data Visualization', 'standard',
 '[{"id":"viz1","type":"text","content":"## Visualizing Data\n\nCreate compelling visualizations with Matplotlib.","orderIndex":0}]',
 NULL, 1600, FALSE, 0, 'a1000005-0000-0000-0000-000000000002');

-- ==============================================================================
-- 6. LESSON RESOURCES
-- ==============================================================================

INSERT INTO lesson_resources (id, title, type, url, "fileSize", "lessonId", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'React Documentation', 'link', 'https://react.dev', NULL, 'b1000001-0000-0000-0000-000000000004', NOW(), NOW()),
(gen_random_uuid(), 'Node.js Best Practices', 'link', 'https://github.com/goldbergyoni/nodebestpractices', NULL, 'b1000001-0000-0000-0000-000000000006', NOW(), NOW()),
(gen_random_uuid(), 'TensorFlow Docs', 'link', 'https://www.tensorflow.org/learn', NULL, 'b1000002-0000-0000-0000-000000000003', NOW(), NOW()),
(gen_random_uuid(), 'Docker Documentation', 'link', 'https://docs.docker.com', NULL, 'b1000003-0000-0000-0000-000000000001', NOW(), NOW()),
(gen_random_uuid(), 'Figma Community', 'link', 'https://www.figma.com/community', NULL, 'b1000004-0000-0000-0000-000000000002', NOW(), NOW()),
(gen_random_uuid(), 'Pandas Documentation', 'link', 'https://pandas.pydata.org/docs', NULL, 'b1000005-0000-0000-0000-000000000001', NOW(), NOW());

-- ==============================================================================
-- 7. QUIZZES
-- ==============================================================================

INSERT INTO quizzes (id, title, description, course_id, lesson_id, status, created_by, ai_generated, created_at, updated_at) VALUES
('d1000001-0000-0000-0000-000000000001', 'Fullstack Fundamentals Quiz', 'Test your web development knowledge', 'c0000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000011', 'approved', '00000000-0000-0000-0000-000000000002', FALSE, NOW(), NOW()),
('d1000002-0000-0000-0000-000000000001', 'Machine Learning Basics', 'ML fundamentals assessment', 'c0000001-0000-0000-0000-000000000002', NULL, 'approved', '10000000-0000-0000-0000-000000000001', FALSE, NOW(), NOW()),
('d1000003-0000-0000-0000-000000000001', 'Docker and Kubernetes Quiz', 'Container orchestration check', 'c0000001-0000-0000-0000-000000000003', NULL, 'approved', '10000000-0000-0000-0000-000000000003', FALSE, NOW(), NOW()),
('d1000004-0000-0000-0000-000000000001', 'UI/UX Design Principles', 'Design fundamentals', 'c0000001-0000-0000-0000-000000000004', NULL, 'approved', '10000000-0000-0000-0000-000000000002', FALSE, NOW(), NOW()),
('d1000005-0000-0000-0000-000000000001', 'Data Science Fundamentals', 'Python data analysis', 'c0000001-0000-0000-0000-000000000005', NULL, 'approved', '10000000-0000-0000-0000-000000000001', FALSE, NOW(), NOW());

-- ==============================================================================
-- 8. QUESTIONS
-- ==============================================================================

INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 
 'Which HTML5 element is used for navigation?', NULL,
 '["<nav>", "<navigation>", "<menu>", "<links>"]', 'A',
 'The nav element is for navigation links.', 1, 0, 'multiple_choice', NOW()),
('e1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000001',
 'What CSS property makes text bold?', NULL,
 '["font-weight: bold", "text-style: bold", "font-bold: true", "text-weight: bold"]', 'A',
 'font-weight controls text thickness.', 1, 1, 'multiple_choice', NOW()),
('e1000001-0000-0000-0000-000000000003', 'd1000001-0000-0000-0000-000000000001',
 'Which is best for one-dimensional layouts?', NULL,
 '["Flexbox", "Grid", "Float", "Position"]', 'A',
 'Flexbox is for one-dimensional layouts.', 1, 2, 'multiple_choice', NOW()),
('e1000001-0000-0000-0000-000000000004', 'd1000001-0000-0000-0000-000000000001',
 'What does async/await do?', NULL,
 '["Makes async code look synchronous", "Runs in parallel", "Creates threads", "Blocks event loop"]', 'A',
 'async/await is syntactic sugar for Promises.', 1, 3, 'multiple_choice', NOW()),
('e1000001-0000-0000-0000-000000000005', 'd1000001-0000-0000-0000-000000000001',
 'What is a Promise?', NULL,
 '["Object for async completion", "Guaranteed return", "Sync operation", "Type of callback"]', 'A',
 'Promises represent async operation results.', 1, 4, 'multiple_choice', NOW());

-- ==============================================================================
-- 9. ENROLLMENTS
-- ==============================================================================

INSERT INTO enrollments (id, user_id, course_id, "completedLessonIds", "completedAt", is_archived, enrolled_at, last_accessed_at) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 
 'b1000001-0000-0000-0000-000000000001,b1000001-0000-0000-0000-000000000002', NULL, FALSE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002', 
 '', NULL, FALSE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
 'b1000001-0000-0000-0000-000000000001,b1000001-0000-0000-0000-000000000002,b1000001-0000-0000-0000-000000000003,b1000001-0000-0000-0000-000000000004,b1000001-0000-0000-0000-000000000005,b1000001-0000-0000-0000-000000000006',
 NOW() - INTERVAL '2 days', FALSE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001',
 'b1000001-0000-0000-0000-000000000001', NULL, FALSE, NOW() - INTERVAL '45 days', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002',
 '', NULL, FALSE, NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 hours'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004',
 '', NULL, FALSE, NOW() - INTERVAL '25 days', NOW() - INTERVAL '4 hours'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000002',
 '', NULL, FALSE, NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 hours'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000005',
 '', NULL, FALSE, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 hour');

-- ==============================================================================
-- 10. PAYMENTS
-- ==============================================================================

INSERT INTO payments (id, user_id, course_id, amount, currency, status, transaction_id, method, created_at, updated_at) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 
 129.99, 'USD', 'completed', 'txn_eval_001', 'credit_card', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002',
 179.99, 'USD', 'completed', 'txn_eval_002', 'paypal', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
 129.99, 'USD', 'completed', 'txn_alice_001', 'credit_card', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001',
 129.99, 'USD', 'completed', 'txn_bob_001', 'paypal', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002',
 179.99, 'USD', 'completed', 'txn_charlie_001', 'credit_card', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000004',
 89.99, 'USD', 'completed', 'txn_diana_001', 'paypal', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000002',
 179.99, 'USD', 'completed', 'txn_ethan_001', 'credit_card', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(gen_random_uuid(), '20000000-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000005',
 139.99, 'USD', 'completed', 'txn_fiona_001', 'paypal', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- ==============================================================================
-- 11. QUIZ SUBMISSIONS
-- ==============================================================================

INSERT INTO quiz_submissions (id, quiz_id, user_id, score, total_points, percentage, responses, completed_at) VALUES
(gen_random_uuid(), 'd1000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003',
 4, 5, 80.00, '{"e1000001-0000-0000-0000-000000000001":"A","e1000001-0000-0000-0000-000000000002":"A","e1000001-0000-0000-0000-000000000003":"A","e1000001-0000-0000-0000-000000000004":"A","e1000001-0000-0000-0000-000000000005":"B"}', NOW() - INTERVAL '12 days'),
(gen_random_uuid(), 'd1000001-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 5, 5, 100.00, '{"e1000001-0000-0000-0000-000000000001":"A","e1000001-0000-0000-0000-000000000002":"A","e1000001-0000-0000-0000-000000000003":"A","e1000001-0000-0000-0000-000000000004":"A","e1000001-0000-0000-0000-000000000005":"A"}', NOW() - INTERVAL '55 days'),
(gen_random_uuid(), 'd1000001-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
 3, 5, 60.00, '{"e1000001-0000-0000-0000-000000000001":"A","e1000001-0000-0000-0000-000000000002":"B","e1000001-0000-0000-0000-000000000003":"A","e1000001-0000-0000-0000-000000000004":"A","e1000001-0000-0000-0000-000000000005":"B"}', NOW() - INTERVAL '40 days');

-- ==============================================================================
-- 12. NOTIFICATIONS
-- ==============================================================================

INSERT INTO notifications (id, title, message, type, "notificationType", "userId", "isRead", link, metadata, "createdAt") VALUES
(gen_random_uuid(), 'Welcome to Learnix!', 'Start your learning journey today.', 'info', 'system', '00000000-0000-0000-0000-000000000003', TRUE, '/courses', NULL, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'Successfully Enrolled!', 'You are now enrolled in Complete Fullstack Web Development', 'success', 'enrollment', '00000000-0000-0000-0000-000000000003', TRUE, '/courses/c0000001-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'Payment Successful', 'Your payment of $129.99 has been processed.', 'success', 'payment_success', '00000000-0000-0000-0000-000000000003', TRUE, '/payments', NULL, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'Quiz Submitted', 'Your quiz has been submitted. Score: 80%', 'info', 'quiz_submitted', '00000000-0000-0000-0000-000000000003', TRUE, '/quizzes/results', NULL, NOW() - INTERVAL '12 days'),
(gen_random_uuid(), 'Course Completed!', 'Congratulations! You completed Complete Fullstack Web Development', 'success', 'course_completed', '20000000-0000-0000-0000-000000000001', FALSE, '/certificates', NULL, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'New Course Enrollment', 'A student enrolled in your course', 'info', 'enrollment', '00000000-0000-0000-0000-000000000002', FALSE, '/instructor/courses', NULL, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'Perfect Score!', 'Amazing! You scored 100% on the quiz', 'success', 'quiz_submitted', '20000000-0000-0000-0000-000000000001', FALSE, '/quizzes/results', NULL, NOW() - INTERVAL '55 days');

-- ==============================================================================
-- END OF COMPREHENSIVE SEED DATA
-- ==============================================================================


-- ==============================================================================
-- Additional Code Exercise Lessons (1-2 per course)
-- ==============================================================================

INSERT INTO lessons (id, title, type, content, "ideConfig", "durationSeconds", "isFreePreview", "orderIndex", section_id) VALUES
-- Course 1: Code Exercises
('b1000001-0000-0000-0000-000000000007', 'Build a React Counter App', 'standard',
 '[{"id":"exercise1","type":"text","content":"## Interactive Exercise\n\nBuild a counter application using React hooks.\n\n### Requirements\n- Use useState to manage counter state\n- Implement increment and decrement buttons\n- Display current count","orderIndex":0}]',
 '{"allowedLanguages":[{"language":"javascript","initialCode":"import React, { useState } from ''react'';\n\nfunction Counter() {\n  // Your code here\n  \n  return (\n    <div>\n      <h1>Counter: 0</h1>\n      <button>Increment</button>\n      <button>Decrement</button>\n    </div>\n  );\n}\n\nexport default Counter;","expectedOutput":"Counter component with working increment/decrement"}],"defaultLanguage":"javascript"}',
 1800, FALSE, 2, 'a1000001-0000-0000-0000-000000000002'),

('b1000001-0000-0000-0000-000000000008', 'Create an Express API Endpoint', 'standard',
 '[{"id":"exercise2","type":"text","content":"## Backend Exercise\n\nCreate a REST API endpoint that returns user data.\n\n### Requirements\n- Create GET /api/users endpoint\n- Return JSON array of users\n- Add proper error handling","orderIndex":0}]',
 '{"allowedLanguages":[{"language":"javascript","initialCode":"// Write your code here\nfunction solution(a, b) {\n    return a + b;\n}\n\n// Input Example:\n// const n = parseInt(input());              // Read an integer\n// const arr = input().split('' '').map(Number); // Read an array\n\nprint(solution(1, 2));","expectedOutput":"3"}],"defaultLanguage":"javascript"}',
 2100, FALSE, 1, 'a1000001-0000-0000-0000-000000000003'),

 -- Course 1 Quiz Lessons
 ('b1000001-0000-0000-0000-000000000009', 'React Advanced Assessment', 'quiz', '[]', NULL, 900, FALSE, 3, 'a1000001-0000-0000-0000-000000000002'),
 ('b1000001-0000-0000-0000-000000000010', 'Node.js Mastery Assessment', 'quiz', '[]', NULL, 900, FALSE, 2, 'a1000001-0000-0000-0000-000000000003'),
 ('b1000001-0000-0000-0000-000000000011', 'Fullstack Fundamentals Assessment', 'quiz', '[]', NULL, 900, FALSE, 2, 'a1000001-0000-0000-0000-000000000001'),

-- Course 2: ML Code Exercise
('b1000002-0000-0000-0000-000000000004', 'Build a Linear Regression Model', 'standard',
 '[{"id":"mlexercise","type":"text","content":"## Machine Learning Exercise\n\nImplement a simple linear regression model using scikit-learn.\n\n### Task\n- Load sample data\n- Train a linear regression model\n- Make predictions","orderIndex":0}]',
 '{"allowedLanguages":[{"language":"python","initialCode":"import numpy as np\nfrom sklearn.linear_model import LinearRegression\n\n# Sample data\nX = np.array([[1], [2], [3], [4], [5]])\ny = np.array([2, 4, 6, 8, 10])\n\n# Your code here\n","expectedOutput":"Trained model with predictions"}],"defaultLanguage":"python"}',
 2400, FALSE, 1, 'a1000002-0000-0000-0000-000000000002'),

-- Course 3: DevOps Exercise
('b1000003-0000-0000-0000-000000000003', 'Write a Dockerfile', 'standard',
 '[{"id":"dockerexercise","type":"text","content":"## Docker Exercise\n\nCreate a Dockerfile for a Node.js application.\n\n### Requirements\n- Use Node 20 Alpine base image\n- Copy package files and install dependencies\n- Expose port 3000","orderIndex":0}]',
 '{"allowedLanguages":[{"language":"dockerfile","initialCode":"# Your Dockerfile here\n","expectedOutput":"Complete Dockerfile for Node.js app"}],"defaultLanguage":"dockerfile"}',
 1500, FALSE, 1, 'a1000003-0000-0000-0000-000000000001'),

-- Course 5: Data Science Exercise
('b1000005-0000-0000-0000-000000000003', 'Data Cleaning with Pandas', 'standard',
 '[{"id":"pandasexercise","type":"text","content":"## Pandas Exercise\n\nClean and analyze a dataset using Pandas.\n\n### Tasks\n- Load CSV data\n- Handle missing values\n- Calculate summary statistics","orderIndex":0}]',
 '{"allowedLanguages":[{"language":"python","initialCode":"import pandas as pd\nimport numpy as np\n\n# Sample data with missing values\ndata = {\n    ''name'': [''Alice'', ''Bob'', None, ''David''],\n    ''age'': [25, None, 35, 40],\n    ''salary'': [50000, 60000, 75000, None]\n}\n\ndf = pd.DataFrame(data)\n\n# Your code here\n","expectedOutput":"Cleaned dataset with statistics"}],"defaultLanguage":"python"}',
 2000, FALSE, 1, 'a1000005-0000-0000-0000-000000000002');

-- ==============================================================================
-- Additional Quizzes (2-3 per course)
-- ==============================================================================

INSERT INTO quizzes (id, title, description, course_id, lesson_id, status, created_by, ai_generated, created_at, updated_at) VALUES
-- Course 1 Additional Quizzes
('d1000001-0000-0000-0000-000000000002', 'React Advanced Concepts', 'Test your React expertise', 'c0000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000009', 'approved', '00000000-0000-0000-0000-000000000002', FALSE, NOW(), NOW()),
('d1000001-0000-0000-0000-000000000003', 'Node.js and Express Mastery', 'Backend development assessment', 'c0000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000010', 'approved', '00000000-0000-0000-0000-000000000002', FALSE, NOW(), NOW()),

-- Course 2 Additional Quizzes
('d1000002-0000-0000-0000-000000000002', 'Deep Learning Fundamentals', 'Neural networks and deep learning', 'c0000001-0000-0000-0000-000000000002', NULL, 'approved', '10000000-0000-0000-0000-000000000001', FALSE, NOW(), NOW()),
('d1000002-0000-0000-0000-000000000003', 'TensorFlow and PyTorch', 'ML frameworks comparison', 'c0000001-0000-0000-0000-000000000002', NULL, 'approved', '10000000-0000-0000-0000-000000000001', TRUE, NOW(), NOW()),

-- Course 3 Additional Quizzes
('d1000003-0000-0000-0000-000000000002', 'CI/CD Pipelines', 'Continuous integration and deployment', 'c0000001-0000-0000-0000-000000000003', NULL, 'approved', '10000000-0000-0000-0000-000000000003', FALSE, NOW(), NOW()),
('d1000003-0000-0000-0000-000000000003', 'AWS Cloud Services', 'Amazon Web Services fundamentals', 'c0000001-0000-0000-0000-000000000003', NULL, 'approved', '10000000-0000-0000-0000-000000000003', FALSE, NOW(), NOW()),

-- Course 4 Additional Quizzes
('d1000004-0000-0000-0000-000000000002', 'User Research Methods', 'UX research and testing', 'c0000001-0000-0000-0000-000000000004', NULL, 'approved', '10000000-0000-0000-0000-000000000002', FALSE, NOW(), NOW()),
('d1000004-0000-0000-0000-000000000003', 'Design Systems Best Practices', 'Building scalable design systems', 'c0000001-0000-0000-0000-000000000004', NULL, 'approved', '10000000-0000-0000-0000-000000000002', FALSE, NOW(), NOW()),

-- Course 5 Additional Quizzes
('d1000005-0000-0000-0000-000000000002', 'Statistical Analysis', 'Statistics for data science', 'c0000001-0000-0000-0000-000000000005', NULL, 'approved', '10000000-0000-0000-0000-000000000001', FALSE, NOW(), NOW()),
('d1000005-0000-0000-0000-000000000003', 'Machine Learning Algorithms', 'ML algorithms and applications', 'c0000001-0000-0000-0000-000000000005', NULL, 'approved', '10000000-0000-0000-0000-000000000001', FALSE, NOW(), NOW());

-- ==============================================================================
-- Questions for Additional Quizzes (5 per quiz)
-- ==============================================================================

-- Quiz: React Advanced Concepts
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000006-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000002',
 'What is the purpose of useCallback?', NULL,
 '["Memoize callback functions", "Create callbacks", "Call functions", "Handle events"]', 'A',
 'useCallback memoizes callback functions to prevent unnecessary re-renders.', 1, 0, 'multiple_choice', NOW()),
('e1000006-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000002',
 'What is React Context used for?', NULL,
 '["Share data across components", "Create contexts", "Style components", "Route pages"]', 'A',
 'Context provides a way to pass data through the component tree without props.', 1, 1, 'multiple_choice', NOW()),
('e1000006-0000-0000-0000-000000000003', 'd1000001-0000-0000-0000-000000000002',
 'What is code splitting in React?', NULL,
 '["Lazy loading components", "Splitting code files", "Breaking components", "Dividing logic"]', 'A',
 'Code splitting allows you to split your app into smaller chunks loaded on demand.', 1, 2, 'multiple_choice', NOW()),
('e1000006-0000-0000-0000-000000000004', 'd1000001-0000-0000-0000-000000000002',
 'What is the purpose of React.memo?', NULL,
 '["Prevent unnecessary re-renders", "Memorize values", "Create memos", "Store data"]', 'A',
 'React.memo is a higher order component that memoizes component output.', 1, 3, 'multiple_choice', NOW()),
('e1000006-0000-0000-0000-000000000005', 'd1000001-0000-0000-0000-000000000002',
 'What are custom hooks?', NULL,
 '["Reusable stateful logic", "Built-in hooks", "Event hooks", "Lifecycle methods"]', 'A',
 'Custom hooks let you extract component logic into reusable functions.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Node.js and Express Mastery
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000007-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000003',
 'What is Express middleware?', NULL,
 '["Functions with access to req, res, next", "Database connectors", "Route handlers", "Template engines"]', 'A',
 'Middleware functions have access to request, response, and next function.', 1, 0, 'multiple_choice', NOW()),
('e1000007-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000003',
 'What is the purpose of body-parser?', NULL,
 '["Parse incoming request bodies", "Parse responses", "Parse URLs", "Parse headers"]', 'A',
 'body-parser extracts the entire body portion of an incoming request.', 1, 1, 'multiple_choice', NOW()),
('e1000007-0000-0000-0000-000000000003', 'd1000001-0000-0000-0000-000000000003',
 'What is JWT used for?', NULL,
 '["Authentication and authorization", "Data storage", "Routing", "Templating"]', 'A',
 'JWT (JSON Web Token) is used for securely transmitting information between parties.', 1, 2, 'multiple_choice', NOW()),
('e1000007-0000-0000-0000-000000000004', 'd1000001-0000-0000-0000-000000000003',
 'What does REST stand for?', NULL,
 '["Representational State Transfer", "Remote State Transfer", "Request State Transfer", "Resource State Transfer"]', 'A',
 'REST is an architectural style for designing networked applications.', 1, 3, 'multiple_choice', NOW()),
('e1000007-0000-0000-0000-000000000005', 'd1000001-0000-0000-0000-000000000003',
 'What is the purpose of helmet.js?', NULL,
 '["Secure Express apps by setting HTTP headers", "Create helmets", "Protect routes", "Validate data"]', 'A',
 'Helmet helps secure Express apps by setting various HTTP headers.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Deep Learning Fundamentals
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000008-0000-0000-0000-000000000001', 'd1000002-0000-0000-0000-000000000002',
 'What is backpropagation?', NULL,
 '["Algorithm for training neural networks", "Forward pass", "Data preprocessing", "Model evaluation"]', 'A',
 'Backpropagation calculates gradients for updating network weights.', 1, 0, 'multiple_choice', NOW()),
('e1000008-0000-0000-0000-000000000002', 'd1000002-0000-0000-0000-000000000002',
 'What is a convolutional layer?', NULL,
 '["Layer for processing grid-like data", "Fully connected layer", "Pooling layer", "Dropout layer"]', 'A',
 'Convolutional layers apply filters to detect features in images.', 1, 1, 'multiple_choice', NOW()),
('e1000008-0000-0000-0000-000000000003', 'd1000002-0000-0000-0000-000000000002',
 'What is overfitting?', NULL,
 '["Model performs well on training but poorly on test data", "Model performs poorly on all data", "Model is too simple", "Model trains too fast"]', 'A',
 'Overfitting occurs when a model learns training data too well including noise.', 1, 2, 'multiple_choice', NOW()),
('e1000008-0000-0000-0000-000000000004', 'd1000002-0000-0000-0000-000000000002',
 'What is dropout?', NULL,
 '["Regularization technique", "Activation function", "Loss function", "Optimizer"]', 'A',
 'Dropout randomly sets neurons to zero during training to prevent overfitting.', 1, 3, 'multiple_choice', NOW()),
('e1000008-0000-0000-0000-000000000005', 'd1000002-0000-0000-0000-000000000002',
 'What is transfer learning?', NULL,
 '["Using pre-trained models for new tasks", "Transferring data", "Moving models", "Sharing weights"]', 'A',
 'Transfer learning leverages knowledge from pre-trained models for new tasks.', 1, 4, 'multiple_choice', NOW());

-- Quiz: CI/CD Pipelines
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000009-0000-0000-0000-000000000001', 'd1000003-0000-0000-0000-000000000002',
 'What is continuous integration?', NULL,
 '["Automatically integrating code changes", "Manual code review", "Deploying to production", "Testing manually"]', 'A',
 'CI automatically integrates code changes from multiple contributors.', 1, 0, 'multiple_choice', NOW()),
('e1000009-0000-0000-0000-000000000002', 'd1000003-0000-0000-0000-000000000002',
 'What is continuous deployment?', NULL,
 '["Automatically deploying to production", "Manual deployment", "Testing code", "Building code"]', 'A',
 'CD automatically deploys every change that passes tests to production.', 1, 1, 'multiple_choice', NOW()),
('e1000009-0000-0000-0000-000000000003', 'd1000003-0000-0000-0000-000000000002',
 'What is Jenkins?', NULL,
 '["Automation server for CI/CD", "Container platform", "Cloud provider", "Version control"]', 'A',
 'Jenkins is an open-source automation server for building CI/CD pipelines.', 1, 2, 'multiple_choice', NOW()),
('e1000009-0000-0000-0000-000000000004', 'd1000003-0000-0000-0000-000000000002',
 'What is a build artifact?', NULL,
 '["Output of build process", "Source code", "Test results", "Configuration file"]', 'A',
 'Build artifacts are files produced by the build process like binaries or packages.', 1, 3, 'multiple_choice', NOW()),
('e1000009-0000-0000-0000-000000000005', 'd1000003-0000-0000-0000-000000000002',
 'What is blue-green deployment?', NULL,
 '["Two identical production environments", "Single environment", "Testing environment", "Development environment"]', 'A',
 'Blue-green deployment uses two identical environments to reduce downtime.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Machine Learning Basics (d1000002-0000-0000-0000-000000000001)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000002-0000-0000-0000-000000000001', 'd1000002-0000-0000-0000-000000000001',
 'What is supervised learning?', NULL,
 '["Learning with labeled data", "Learning without labels", "Reinforcement learning", "Self-learning"]', 'A',
 'Supervised learning uses labeled training data to learn mappings from inputs to outputs.', 1, 0, 'multiple_choice', NOW()),
('e1000002-0000-0000-0000-000000000002', 'd1000002-0000-0000-0000-000000000001',
 'What is the purpose of train/test split?', NULL,
 '["Evaluate model on unseen data", "Speed up training", "Reduce data size", "Increase accuracy"]', 'A',
 'Train/test split helps evaluate how well a model generalizes to new data.', 1, 1, 'multiple_choice', NOW()),
('e1000002-0000-0000-0000-000000000003', 'd1000002-0000-0000-0000-000000000001',
 'What is a feature in machine learning?', NULL,
 '["An input variable", "The output variable", "The model", "The algorithm"]', 'A',
 'Features are measurable properties or characteristics used as inputs.', 1, 2, 'multiple_choice', NOW()),
('e1000002-0000-0000-0000-000000000004', 'd1000002-0000-0000-0000-000000000001',
 'What is classification?', NULL,
 '["Predicting discrete labels", "Predicting continuous values", "Clustering data", "Reducing dimensions"]', 'A',
 'Classification predicts categorical class labels for new instances.', 1, 3, 'multiple_choice', NOW()),
('e1000002-0000-0000-0000-000000000005', 'd1000002-0000-0000-0000-000000000001',
 'What is regression?', NULL,
 '["Predicting continuous values", "Predicting categories", "Grouping data", "Finding patterns"]', 'A',
 'Regression predicts continuous numerical values.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Docker and Kubernetes (d1000003-0000-0000-0000-000000000001)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000003-0000-0000-0000-000000000001', 'd1000003-0000-0000-0000-000000000001',
 'What is a Docker container?', NULL,
 '["Lightweight isolated runtime environment", "Virtual machine", "Physical server", "Database"]', 'A',
 'Containers are lightweight, standalone packages that include everything needed to run an application.', 1, 0, 'multiple_choice', NOW()),
('e1000003-0000-0000-0000-000000000002', 'd1000003-0000-0000-0000-000000000001',
 'What is a Docker image?', NULL,
 '["Read-only template for containers", "Running container", "Configuration file", "Log file"]', 'A',
 'Docker images are read-only templates used to create containers.', 1, 1, 'multiple_choice', NOW()),
('e1000003-0000-0000-0000-000000000003', 'd1000003-0000-0000-0000-000000000001',
 'What is Kubernetes?', NULL,
 '["Container orchestration platform", "Container runtime", "Programming language", "Database"]', 'A',
 'Kubernetes automates deployment, scaling, and management of containerized applications.', 1, 2, 'multiple_choice', NOW()),
('e1000003-0000-0000-0000-000000000004', 'd1000003-0000-0000-0000-000000000001',
 'What is a Kubernetes Pod?', NULL,
 '["Smallest deployable unit", "Node in cluster", "Container image", "Service"]', 'A',
 'A Pod is the smallest deployable unit that can contain one or more containers.', 1, 3, 'multiple_choice', NOW()),
('e1000003-0000-0000-0000-000000000005', 'd1000003-0000-0000-0000-000000000001',
 'What does docker-compose do?', NULL,
 '["Define multi-container applications", "Build images", "Push to registry", "Monitor containers"]', 'A',
 'Docker Compose defines and runs multi-container Docker applications.', 1, 4, 'multiple_choice', NOW());

-- Quiz: UI/UX Design Principles (d1000004-0000-0000-0000-000000000001)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000004-0000-0000-0000-000000000001', 'd1000004-0000-0000-0000-000000000001',
 'What is the purpose of visual hierarchy?', NULL,
 '["Guide users to important elements", "Make designs colorful", "Add animations", "Use images"]', 'A',
 'Visual hierarchy helps users understand the importance and order of elements.', 1, 0, 'multiple_choice', NOW()),
('e1000004-0000-0000-0000-000000000002', 'd1000004-0000-0000-0000-000000000001',
 'What is whitespace in design?', NULL,
 '["Empty space between elements", "White color", "Background images", "Text content"]', 'A',
 'Whitespace (negative space) gives elements room to breathe and improves readability.', 1, 1, 'multiple_choice', NOW()),
('e1000004-0000-0000-0000-000000000003', 'd1000004-0000-0000-0000-000000000001',
 'What is a design system?', NULL,
 '["Collection of reusable components", "Single design", "Color palette", "Font family"]', 'A',
 'Design systems provide consistent, reusable components and guidelines.', 1, 2, 'multiple_choice', NOW()),
('e1000004-0000-0000-0000-000000000004', 'd1000004-0000-0000-0000-000000000001',
 'What is the 60-30-10 rule?', NULL,
 '["Color proportion guideline", "Layout rule", "Typography rule", "Spacing rule"]', 'A',
 'The 60-30-10 rule suggests using a dominant color 60%, secondary 30%, accent 10%.', 1, 3, 'multiple_choice', NOW()),
('e1000004-0000-0000-0000-000000000005', 'd1000004-0000-0000-0000-000000000001',
 'What is accessibility in design?', NULL,
 '["Making designs usable by everyone", "Making designs pretty", "Using bright colors", "Adding animations"]', 'A',
 'Accessibility ensures designs are usable by people with disabilities.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Data Science Fundamentals (d1000005-0000-0000-0000-000000000001)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000005-0000-0000-0000-000000000001', 'd1000005-0000-0000-0000-000000000001',
 'What is a DataFrame in Pandas?', NULL,
 '["2D labeled data structure", "1D array", "Database table", "File format"]', 'A',
 'DataFrame is a 2-dimensional labeled data structure with columns of different types.', 1, 0, 'multiple_choice', NOW()),
('e1000005-0000-0000-0000-000000000002', 'd1000005-0000-0000-0000-000000000001',
 'What does df.describe() do?', NULL,
 '["Generates summary statistics", "Describes columns", "Shows data types", "Counts rows"]', 'A',
 'describe() generates descriptive statistics like mean, count, std, etc.', 1, 1, 'multiple_choice', NOW()),
('e1000005-0000-0000-0000-000000000003', 'd1000005-0000-0000-0000-000000000001',
 'How do you handle missing values?', NULL,
 '["fillna() or dropna()", "ignore them", "delete the file", "restart Python"]', 'A',
 'fillna() fills missing values, dropna() removes rows with missing values.', 1, 2, 'multiple_choice', NOW()),
('e1000005-0000-0000-0000-000000000004', 'd1000005-0000-0000-0000-000000000001',
 'What is groupby used for?', NULL,
 '["Grouping data for aggregation", "Sorting data", "Filtering data", "Joining data"]', 'A',
 'groupby() splits data into groups based on criteria for aggregate operations.', 1, 3, 'multiple_choice', NOW()),
('e1000005-0000-0000-0000-000000000005', 'd1000005-0000-0000-0000-000000000001',
 'What library is used for data visualization?', NULL,
 '["Matplotlib/Seaborn", "Pandas", "NumPy", "scikit-learn"]', 'A',
 'Matplotlib and Seaborn are popular libraries for creating visualizations.', 1, 4, 'multiple_choice', NOW());

-- Quiz: TensorFlow and PyTorch (d1000002-0000-0000-0000-000000000003)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000010-0000-0000-0000-000000000001', 'd1000002-0000-0000-0000-000000000003',
 'What is TensorFlow?', NULL,
 '["Open-source ML framework by Google", "Database", "Programming language", "Operating system"]', 'A',
 'TensorFlow is an open-source machine learning framework developed by Google.', 1, 0, 'multiple_choice', NOW()),
('e1000010-0000-0000-0000-000000000002', 'd1000002-0000-0000-0000-000000000003',
 'What is PyTorch?', NULL,
 '["Open-source ML framework by Facebook", "Web framework", "Database system", "Cloud service"]', 'A',
 'PyTorch is an open-source machine learning framework developed by Facebook.', 1, 1, 'multiple_choice', NOW()),
('e1000010-0000-0000-0000-000000000003', 'd1000002-0000-0000-0000-000000000003',
 'What is a tensor?', NULL,
 '["Multi-dimensional array", "Single number", "String", "Boolean"]', 'A',
 'Tensors are multi-dimensional arrays that are fundamental to deep learning frameworks.', 1, 2, 'multiple_choice', NOW()),
('e1000010-0000-0000-0000-000000000004', 'd1000002-0000-0000-0000-000000000003',
 'What is eager execution?', NULL,
 '["Operations execute immediately", "Delayed execution", "Parallel execution", "Sequential execution"]', 'A',
 'Eager execution evaluates operations immediately without building a graph.', 1, 3, 'multiple_choice', NOW()),
('e1000010-0000-0000-0000-000000000005', 'd1000002-0000-0000-0000-000000000003',
 'What is autograd in PyTorch?', NULL,
 '["Automatic differentiation", "Auto-scaling", "Auto-saving", "Auto-loading"]', 'A',
 'Autograd automatically computes gradients for tensor operations.', 1, 4, 'multiple_choice', NOW());

-- Quiz: AWS Cloud Services (d1000003-0000-0000-0000-000000000003)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000011-0000-0000-0000-000000000001', 'd1000003-0000-0000-0000-000000000003',
 'What is AWS EC2?', NULL,
 '["Virtual servers in the cloud", "Database service", "Storage service", "Networking service"]', 'A',
 'EC2 (Elastic Compute Cloud) provides resizable virtual servers in the cloud.', 1, 0, 'multiple_choice', NOW()),
('e1000011-0000-0000-0000-000000000002', 'd1000003-0000-0000-0000-000000000003',
 'What is AWS S3?', NULL,
 '["Object storage service", "Compute service", "Database", "Networking"]', 'A',
 'S3 (Simple Storage Service) is an object storage service for any amount of data.', 1, 1, 'multiple_choice', NOW()),
('e1000011-0000-0000-0000-000000000003', 'd1000003-0000-0000-0000-000000000003',
 'What is AWS Lambda?', NULL,
 '["Serverless compute service", "Database service", "Container service", "Storage service"]', 'A',
 'Lambda runs code without provisioning or managing servers (serverless).', 1, 2, 'multiple_choice', NOW()),
('e1000011-0000-0000-0000-000000000004', 'd1000003-0000-0000-0000-000000000003',
 'What is AWS RDS?', NULL,
 '["Managed relational database", "File storage", "Compute service", "CDN service"]', 'A',
 'RDS (Relational Database Service) manages relational databases in the cloud.', 1, 3, 'multiple_choice', NOW()),
('e1000011-0000-0000-0000-000000000005', 'd1000003-0000-0000-0000-000000000003',
 'What is an AWS region?', NULL,
 '["Physical location with data centers", "Virtual network", "Security group", "User account"]', 'A',
 'AWS Regions are physical locations around the world with clusters of data centers.', 1, 4, 'multiple_choice', NOW());

-- Quiz: User Research Methods (d1000004-0000-0000-0000-000000000002)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000012-0000-0000-0000-000000000001', 'd1000004-0000-0000-0000-000000000002',
 'What is a user persona?', NULL,
 '["Fictional representation of target user", "Real user", "Developer", "Designer"]', 'A',
 'Personas are fictional characters representing user types based on research.', 1, 0, 'multiple_choice', NOW()),
('e1000012-0000-0000-0000-000000000002', 'd1000004-0000-0000-0000-000000000002',
 'What is A/B testing?', NULL,
 '["Comparing two versions to see which performs better", "Alphabet testing", "Audio testing", "Bug testing"]', 'A',
 'A/B testing compares two versions to determine which one performs better.', 1, 1, 'multiple_choice', NOW()),
('e1000012-0000-0000-0000-000000000003', 'd1000004-0000-0000-0000-000000000002',
 'What is usability testing?', NULL,
 '["Observing users interact with product", "Code testing", "Performance testing", "Security testing"]', 'A',
 'Usability testing evaluates a product by observing real users interactions.', 1, 2, 'multiple_choice', NOW()),
('e1000012-0000-0000-0000-000000000004', 'd1000004-0000-0000-0000-000000000002',
 'What is a user journey map?', NULL,
 '["Visualization of user experience over time", "Road map", "Site map", "Mind map"]', 'A',
 'User journey maps visualize the complete experience a user has with a product.', 1, 3, 'multiple_choice', NOW()),
('e1000012-0000-0000-0000-000000000005', 'd1000004-0000-0000-0000-000000000002',
 'What is card sorting?', NULL,
 '["Method to organize information architecture", "Playing cards", "Credit cards", "Business cards"]', 'A',
 'Card sorting helps understand how users categorize and organize information.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Design Systems Best Practices (d1000004-0000-0000-0000-000000000003)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000013-0000-0000-0000-000000000001', 'd1000004-0000-0000-0000-000000000003',
 'What is a design token?', NULL,
 '["Named values for design decisions", "Authentication token", "Access token", "Security token"]', 'A',
 'Design tokens store design decisions like colors, spacing, and typography.', 1, 0, 'multiple_choice', NOW()),
('e1000013-0000-0000-0000-000000000002', 'd1000004-0000-0000-0000-000000000003',
 'What is atomic design?', NULL,
 '["Methodology for creating design systems", "Nuclear design", "Molecular design", "Physical design"]', 'A',
 'Atomic design creates design systems from atoms to organisms to templates.', 1, 1, 'multiple_choice', NOW()),
('e1000013-0000-0000-0000-000000000003', 'd1000004-0000-0000-0000-000000000003',
 'What is component documentation?', NULL,
 '["Guidelines for using components", "Code comments", "User manual", "API docs"]', 'A',
 'Component documentation explains how and when to use design system components.', 1, 2, 'multiple_choice', NOW()),
('e1000013-0000-0000-0000-000000000004', 'd1000004-0000-0000-0000-000000000003',
 'What is design system governance?', NULL,
 '["Process for managing system evolution", "Government regulations", "Legal compliance", "Security policy"]', 'A',
 'Governance defines how the design system is maintained and updated.', 1, 3, 'multiple_choice', NOW()),
('e1000013-0000-0000-0000-000000000005', 'd1000004-0000-0000-0000-000000000003',
 'What is a pattern library?', NULL,
 '["Collection of reusable design patterns", "Image library", "Book library", "Code library"]', 'A',
 'Pattern libraries contain reusable design patterns and their usage guidelines.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Statistical Analysis (d1000005-0000-0000-0000-000000000002)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000014-0000-0000-0000-000000000001', 'd1000005-0000-0000-0000-000000000002',
 'What is the mean?', NULL,
 '["Average of all values", "Middle value", "Most frequent value", "Range of values"]', 'A',
 'The mean is the sum of all values divided by the count.', 1, 0, 'multiple_choice', NOW()),
('e1000014-0000-0000-0000-000000000002', 'd1000005-0000-0000-0000-000000000002',
 'What is the median?', NULL,
 '["Middle value when sorted", "Average value", "Most common value", "Highest value"]', 'A',
 'The median is the middle value in a sorted dataset.', 1, 1, 'multiple_choice', NOW()),
('e1000014-0000-0000-0000-000000000003', 'd1000005-0000-0000-0000-000000000002',
 'What is standard deviation?', NULL,
 '["Measure of data spread", "Average value", "Maximum value", "Minimum value"]', 'A',
 'Standard deviation measures how spread out the values are from the mean.', 1, 2, 'multiple_choice', NOW()),
('e1000014-0000-0000-0000-000000000004', 'd1000005-0000-0000-0000-000000000002',
 'What is correlation?', NULL,
 '["Relationship between variables", "Cause and effect", "Single variable", "No relationship"]', 'A',
 'Correlation measures the strength and direction of relationship between variables.', 1, 3, 'multiple_choice', NOW()),
('e1000014-0000-0000-0000-000000000005', 'd1000005-0000-0000-0000-000000000002',
 'What is a p-value?', NULL,
 '["Probability of results occurring by chance", "Percentage", "Proportion", "Probability density"]', 'A',
 'P-value indicates the probability of observing results if the null hypothesis is true.', 1, 4, 'multiple_choice', NOW());

-- Quiz: Machine Learning Algorithms (d1000005-0000-0000-0000-000000000003)
INSERT INTO questions (id, quiz_id, "questionText", image_url, options, "correctAnswer", explanation, points, position, type, created_at) VALUES
('e1000015-0000-0000-0000-000000000001', 'd1000005-0000-0000-0000-000000000003',
 'What is a decision tree?', NULL,
 '["Tree-like model of decisions", "Database structure", "File system", "Network topology"]', 'A',
 'Decision trees use a tree structure to make decisions based on feature values.', 1, 0, 'multiple_choice', NOW()),
('e1000015-0000-0000-0000-000000000002', 'd1000005-0000-0000-0000-000000000003',
 'What is random forest?', NULL,
 '["Ensemble of decision trees", "Single tree", "Linear model", "Neural network"]', 'A',
 'Random forest combines multiple decision trees for better predictions.', 1, 1, 'multiple_choice', NOW()),
('e1000015-0000-0000-0000-000000000003', 'd1000005-0000-0000-0000-000000000003',
 'What is k-means clustering?', NULL,
 '["Algorithm to partition data into k clusters", "Sorting algorithm", "Search algorithm", "Compression algorithm"]', 'A',
 'K-means partitions data into k clusters based on similarity.', 1, 2, 'multiple_choice', NOW()),
('e1000015-0000-0000-0000-000000000004', 'd1000005-0000-0000-0000-000000000003',
 'What is SVM?', NULL,
 '["Support Vector Machine classifier", "System Virtual Machine", "Storage Volume Manager", "Simple Verification Method"]', 'A',
 'SVM finds the optimal hyperplane to separate classes.', 1, 3, 'multiple_choice', NOW()),
('e1000015-0000-0000-0000-000000000005', 'd1000005-0000-0000-0000-000000000003',
 'What is gradient boosting?', NULL,
 '["Ensemble method that builds models sequentially", "Gradient descent", "Feature scaling", "Data augmentation"]', 'A',
 'Gradient boosting builds models sequentially, each correcting predecessor errors.', 1, 4, 'multiple_choice', NOW());
