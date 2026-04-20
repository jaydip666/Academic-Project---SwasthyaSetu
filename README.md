<br/>
<div align="center">
  <h1 align="center">SwasthyaSetu - A Digital HealthCare Platform 🏥</h1>
  <p align="center">
    <strong>A seamless bridge connecting Patients, Doctors, and Hospitals with AI-driven healthcare insights.</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Frontend-React_19-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Backend-Django_REST-092E20?style=for-the-badge&logo=django" alt="Django" />
    <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/AI-Symptom_Checker-FF9900?style=for-the-badge&logo=openai" alt="AI" />
  </p>
</div>

<hr />

## 📖 Table of Contents
- [About the Project](#-about-the-project-project-necessity)
- [Key Modules & Features](#-key-modules--features)
- [Technology Stack](#-technology-stack)
- [Future Enhancements](#-future-enhancements)
- [Getting Started](#-getting-started)

---

## 🎯 About The Project (Project Necessity)

In today's fast-paced world, accessing the right healthcare at the right time is often fragmented and tedious. **SwasthyaSetu** (meaning "Health Bridge" in Sanskrit) is conceptualized to eliminate these healthcare accessibility bottlenecks. 

### **Why do we need SwasthyaSetu?**
1. **Centralized Healthcare Ecosystem:** Overcomes the fragmented nature of the healthcare system by seamlessly connecting patients, verified doctors, and esteemed hospitals in one unified portal.
2. **AI-Empowered Patient Guidance:** Not everyone knows which specialist to visit for a given symptom. The integrated **AI Symptom Checker** analyzes patient symptoms and maps them dynamically to the correct doctor/specialty.
3. **Digitized Medical Records:** Eradicates the manual hassle of managing physical medical documents by offering secure, fast, and reliable digital patient attachments and ledgers.
4. **Effortless Scheduling & Finances:** Intelligent appointment scheduling, rescheduling negotiations, and integrated secure payment gateways improve the clinical workflow for both parties.

---

## 🚀 Key Modules & Features

SwasthyaSetu is composed of several powerful modules designed to cater to User (Patient), Doctor, and Admin flows seamlessly.

### 1. 🔐 Authentication & Access Module
- Secure Role-Based Access Control (Patient, Doctor, Admin).
- JWT (JSON Web Token) based authentication.
- Password recovery and interactive security questions workflows.

### 2. 🤖 AI Symptom Checker & Triage Module
- **AI-Powered Diagnostics:** Uses advanced LLMs to parse patient symptoms and output structured JSON health predictions.
- **Smart Routing:** Dynamically suggests relevant hospitals and specialized doctors based on the AI diagnosis.
- **Medical Chat History:** Persists symptom check sessions so patients can review continuous triage outcomes.

### 3. 🗓️ Intelligent Appointment Engine
- Seamless Appointment Booking, Status Tracking (Active, Rescheduled, Rejected).
- **Propose & Respond Rescheduling:** Advanced mutual-consent rescheduling workflows for doctors and patients.
- Real-time availability calendar for doctors to manage time-slots efficiently.

### 4. 🗂️ Medical Records & File Management
- Centralized `Media` storage for Patient records, clinical receipts, and hospital image uploads.
- Secure, private retrieval logic protecting patient data confidentiality.

### 5. 💳 Financial Ledger & Payment Module
- **Payment Gateway Integration:** E-commerce style order creation and verification for clinical bookings.
- **Patient Financial Ledger:** A detailed dashboard showing transaction history.
- **Doctor Earnings & PDFs:** Doctors and admins can generate/export precise Financial Earnings and Ledger analytics in PDF formats.

### 6. 🏥 Hospital & User Administration (Admin Panel)
- **Hospital CRUD:** Complete management of hospital affiliations and assignments.
- **Doctor Verification:** Dedicated workflows for reviewing and approving pending Doctor Registrations.
- Advanced administrative reporting, PDF data exports, and system-wide tracking endpoints.

### 7. 💬 Collaborative Feedback & Notifications
- Comprehensive review-submission flow for completed appointments.
- System-wide notification tracking (mark as read, real-time alerts).
- Integrated inquiry submitting logic for external support.

---

## 💻 Technology Stack

SwasthyaSetu leverages modern, high-performance web frameworks to guarantee scale, security, and an excellent user experience.

### **Frontend (Client-Side)**
* **ReactJS (v19.2.0)** - Modern View layer utilizing Hooks and concurrent features.
* **Vite** - Blazing fast frontend build tool and development server.
* **React Router DOM** - For seamless Single Page Application (SPA) navigation.
* **Lucide React** - Clean and highly customizable iconography.
* **XLSX** - Used for Excel data parsing and generation.

### **Backend (Server-Side / API)**
* **Django (3.0.5)** - Robust Python web framework for backend architecture.
* **Django REST Framework (DRF)** - Building powerful Web APIs and routing serializers.
* **djangorestframework-simplejwt** - Handling JWT-based Stateless Authentication workflows.
* **Generative AI Parsing** - Custom Python parsers mapping natural language outputs to exact specialty codes.

### **Database & Data Management**
* **MongoDB** - Document-Oriented NoSQL Database for scalable, highly flexible schemas.
* **Djongo** - A Python module to use MongoDB as a backend database for Django effortlessly.

---

## 🌟 Future Enhancements

We are continually striving to make SwasthyaSetu the definitive healthcare platform. Our upcoming roadmap includes:

- [ ] **Telemedicine & Video Consultations:** Integrate WebRTC or Zoom APIs for secure online video appointments, allowing remote diagnosis.
- [ ] **IoT & Wearables Integration:** Sync Apple Health, Google Fit, and other smartwatches to provide doctors with live heartbeat, step counts, and SpO2 levels.
- [ ] **E-Pharmacy & Prescription Delivery:** Forward AI and Doctor prescriptions directly to assigned pharmacies for seamless doorstep medicine delivery.
- [ ] **Advanced Radiology AI:** Extend the AI module to analyze visual data like X-rays or MRI scans for a quicker second opinion.
- [ ] **Multi-lingual AI Agent:** Breaking the language barrier with localized UI and voice-to-text symptom capture in regional languages.

---

<br/>
<div align="center">
  <i>Developed with ❤️ for a healthier tomorrow.</i>
</div>
