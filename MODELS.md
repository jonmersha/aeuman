# LMS Platform - Implemented Models & Functionality

This document outlines the data models and their core functionality implemented in the LMS platform.

## 1. Core Identity & Organization

### User
**Functionality:** Centralized profile system for all platform participants.
- **Roles:** `super_admin`, `admin`, `school_manager`, `teacher`, `student`, `parent`, `provider`, `pending`.
- **Gamification:** Tracks `points` and `badges` earned through learning activities.
- **Association:** Linked to one or more schools (`schoolId`, `schoolIds`) and specific classes (`classId`).
- **Independent Status:** Supports independent learners or content providers not affiliated with a specific school.

### School
**Functionality:** Defines an educational organization.
- **Management:** Tracked by `adminId`.
- **Academic Structure:** Flexible field to define school levels (e.g., K-12, Higher Ed).
- **Onboarding:** Processes `JoinRequest` entities for new members.

### Class
**Functionality:** Groups students together for specific academic cycles.
- **Hierarchical:** Belongs to a `School`.
- **Instructional:** Linked to a primary `teacherId`.
- **Organization:** Tracks `grade` and `year`.

---

## 2. Learning Content Architecture

### Course
**Functionality:** The primary container for educational content.
- **Categorization:** Subject-based categories.
- **Access Control:** Can be `isPublic` (Marketplace) or school-private.
- **Commercial:** Supports a `price` field for content providers.
- **Assignment:** Linked to a teacher and optionally a school/class.

### Section
**Functionality:** Logical structural division within a `Course`.
- **Overview:** Supports Markdown-based introductory content.
- **Sequencing:** Uses an `order` field for consistent display.

### Lesson
**Functionality:** The atomic unit of learning content.
- **Multi-modal:** Supports `text` (Markdown), `video` (URL), `pdf`, and `quiz`.
- **Sub-structuring:** Supports `subSection` and `parentId` for nested lesson hierarchies.
- **Engagement:** Integrated with text-to-speech generation and AI summarization.

### Resource
**Functionality:** Supplemental materials.
- **Linking:** Can be attached to a specific `Course` or a specific `Lesson`.
- **Diversified Types:** Supports PDFs, external links, videos, and general documents.

---

## 3. Assessment & Progress

### Exam (Quizzes)
**Functionality:** Automated assessments.
- **Scope:** Can be lesson-specific, section-specific, or a final course exam.
- **Complexity:** Stores an array of `Question` objects with various formats.
- **Timed:** Supports a `duration` (in minutes) for testing environments.

### ExamResult
**Functionality:** Persistence of student performance.
- **Detailed Scoring:** Tracks total questions, correct answers, and final score.
- **Feedback:** Allows teachers to provide qualitative comments on results.

### Assignment
**Functionality:** Manual task management for students.
- **Scheduling:** Features a `dueDate` for deadline tracking.

### Submission
**Functionality:** Student output for assignments.
- **Workflow:** Tracks content, `grade`, and teacher `feedback`.
- **Timestamped:** Monitors `submittedAt` to verify on-time delivery.

### Enrollment
**Functionality:** The bridge between students and content.
- **Progress Tracking:** Real-time percentage tracking of course completion.
- **Lesson Completion:** Maintains an array of `completedLessons` IDs.
- **Approval Workflow:** `pending`, `approved`, or `denied` states for managed access.

---

## 4. Communication & Social

### Question & Answer
**Functionality:** Asynchronous Q&A forum within courses.
- **Threaded:** `Answer` entities link directly to `Question` IDs.
- **Role Awareness:** Answers track whether they came from a teacher, student, or admin.

### ChatMessage
**Functionality:** Course-wide real-time chat rooms.
- **Contextual:** Messages are scoped to specific `courseId` containers.

### Conversation & DirectMessage
**Functionality:** Secure 1-to-1 or group messaging.
- **Participant Isolation:** Access is restricted to `participants` listed in the `Conversation`.

---

## 5. Administrative Workflows

### JoinRequest
**Functionality:** Regulated onboarding for schools.
- **Request Cycle:** Captures user role intent (`student`, `teacher`, `parent`) and handles administrator approval via `status` updates.
