# Resources & References

**Table of contents**

# Project Demo Summary

This document provides a brief summary of the two main features demonstrated in this project: **C++ Codespace Integration** and **AI Generate Quiz from HTML**.

---

## AI-quizz-web

[https://drive.google.com/drive/folders/1aA-DaHOJRhU-ksqmh429Jrf-rUOB0CKc?usp=sharing](https://drive.google.com/drive/folders/1aA-DaHOJRhU-ksqmh429Jrf-rUOB0CKc?usp=sharing)

Link Demo: [https://ai-quizz-web-mqpk.vercel.app/](https://ai-quizz-web-mqpk.vercel.app/)

# cpp-web-ide

[https://drive.google.com/drive/folders/1vDzEF79Eb7d2PwXIAQpPuRHmGF4Fancb?usp=sharing](https://drive.google.com/drive/folders/1vDzEF79Eb7d2PwXIAQpPuRHmGF4Fancb?usp=sharing)

## 1. C++ Codespace Integration ☁️

This feature showcases how our application integrates seamlessly within a **C++ Codespace** environment.

**Key Highlights:**

- **Streamlined Workflow:** Enhances the coding experience in a Codespace, ensuring developers get fast, relevant help without needing to leave the browser interface.

---

## 2. AI Generate Quiz from HTML 📝

This feature demonstrates the capability to automatically create quizzes by analyzing content sourced specifically from **HTML files** using a powerful large language model.

**Key Highlights:**

- **Content Sourcing from HTML:** Automatically parses text content, headings, and lists from an HTML file to identify key concepts.
- **Automated Quiz Creation:** Converts the extracted HTML content into engaging quiz questions.

---

## ⚠️ Important Backend Requirement (AI Generate Quiz)

The backend service for the **AI Generate Quiz** functionality relies on the Google Gemini API to power its content generation and natural language processing capabilities.

**To run this feature, you must set the following environment variable:**

### GEMINI_API_KEY

This variable must be set to your valid Google **GEMINI_API_KEY**. Without this key, the quiz generation functionality will not operate.

GEMINI_API_KEY="YOUR_API_KEY_HERE"
