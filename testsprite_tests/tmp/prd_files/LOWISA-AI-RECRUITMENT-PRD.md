# Lowisa AI Recruitment System - Product Requirements Document

## Overview
Lowisa is an AI-powered recruitment assistant for Nordflytt, designed to automate the initial screening of job applicants through intelligent conversation and ML-based prediction.

## Core Features

### 1. Conversational AI Interface
- **Swedish-First Design**: Professional recruitment conversations in Swedish
- **Multi-Language Support**: Adaptive language capabilities for non-native speakers
- **Natural Language Processing**: Understanding context and extracting key information
- **Progressive Information Gathering**: Structured approach to collect all required data

### 2. Information Collection Requirements
The system must gather:
- Full name
- Driving license status (B-körkort)
- Previous experience (moving, warehouse, service)
- Availability (days/times)
- Language proficiency
- Physical capability confirmation
- Contact information

### 3. ML Prediction System
- **Candidate Scoring**: 0-100% hiring probability prediction
- **Feature Analysis**: Experience, communication, flexibility, cultural fit
- **Continuous Learning**: Model improvement based on hiring outcomes
- **Real-time Processing**: Sub-second prediction response times

### 4. Integration Points
- **CRM Synchronization**: Automatic candidate profile creation
- **Email Automation**: SendGrid integration for follow-ups
- **Typeform Integration**: Seamless handoff for detailed applications
- **Analytics Dashboard**: Real-time recruitment metrics

## Quality Requirements

### Performance Metrics
- **Response Time**: < 2 seconds per interaction
- **Accuracy**: > 90% information extraction accuracy
- **Completion Rate**: > 85% conversation completion
- **ML Accuracy**: > 80% prediction accuracy within 6 months

### Language Quality
- **Professional Tone**: Consistent business Swedish
- **Cultural Appropriateness**: Swedish recruitment norms
- **Error Handling**: Graceful recovery from misunderstandings
- **Accessibility**: Clear communication for all proficiency levels

## Test Scenarios

### Scenario 1: Complete Swedish Speaker
```
Input: "Hej! Jag heter Erik Andersson, har B-körkort och 3 års erfarenhet från lagerarbete. Kan jobba alla dagar utom söndagar. Talar flytande svenska."
Expected: Complete profile creation, high ML score, Typeform link sent
```

### Scenario 2: Non-Native Speaker
```
Input: "Hello, my name Ahmed. I want work moving company. Have experience but Swedish not perfect."
Expected: Language adaptation, patient questioning, complete screening
```

### Scenario 3: Incomplete Information
```
Input: "Jag vill jobba hos er som flyttare."
Expected: Structured follow-up questions, progressive information gathering
```

## Success Criteria
- Professional Swedish conversation quality
- Complete information gathering in >90% of cases
- Accurate ML predictions correlating with hiring outcomes
- Seamless integration with existing recruitment pipeline
- Positive candidate experience feedback

## Technical Architecture
- **Frontend**: React/Next.js chat interface
- **Backend**: Node.js API with OpenAI integration
- **ML Service**: TensorFlow.js for real-time predictions
- **Database**: Supabase for candidate data storage
- **Infrastructure**: Scalable cloud deployment

## Compliance & Security
- GDPR compliant data handling
- Encrypted storage of personal information
- Audit trail for all interactions
- Data retention policies aligned with Swedish law