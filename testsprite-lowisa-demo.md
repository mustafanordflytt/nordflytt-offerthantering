# TestSprite - Lowisa Conversation Quality Testing

## 🧪 Overview

This document shows how to use TestSprite to test the Lowisa AI recruitment assistant's conversation quality, Swedish language responses, and information gathering capabilities.

## 🚀 Quick Start

### 1. Using TestSprite MCP in Claude

Simply say to Claude:
```
Help me test the Lowisa recruitment chatbot with TestSprite
```

TestSprite will automatically:
- Analyze the Lowisa implementation
- Generate comprehensive test plans
- Create and execute test cases
- Provide detailed quality reports

### 2. Command Line Testing

```bash
# Test all Lowisa functionality
npm run test:lowisa

# Test specific aspects
npm run test:conversation-flow    # Test conversation logic
npm run test:swedish              # Validate Swedish language
npm run test:info-gathering       # Check information collection
```

### 3. Direct TestSprite Commands

```bash
# Full TestSprite analysis
npx testsprite --test-conversation-flow
npx testsprite --validate-swedish-responses
npx testsprite --check-information-gathering
```

## 📋 What TestSprite Tests

### 1. **Conversation Flow** (`--test-conversation-flow`)
- ✅ Greeting appropriateness
- ✅ Question sequence logic
- ✅ Conversation completion
- ✅ Error handling
- ✅ User experience flow

### 2. **Swedish Language Quality** (`--validate-swedish-responses`)
- ✅ Grammar correctness
- ✅ Spelling accuracy
- ✅ Tone consistency (du/dig, not ni)
- ✅ Professional yet friendly language
- ✅ Contextual adaptation

### 3. **Information Gathering** (`--check-information-gathering`)
- ✅ Driving license extraction
- ✅ Work experience parsing
- ✅ Availability understanding
- ✅ Language level assessment
- ✅ Progress tracking accuracy

### 4. **ML Integration** (Automatic)
- ✅ Prediction generation
- ✅ Metric calculation
- ✅ Risk factor identification
- ✅ Confidence scoring

## 📊 Example Test Results

```
🧪 TestSprite - Lowisa Conversation Quality Testing

▶ Conversation Flow
  Testing conversation logic and flow

  ✓ Should start with appropriate Swedish greeting (2.3s)
  ✓ Should follow logical question sequence (8.1s)
  ✓ Should complete conversation when all information gathered (12.5s)

✅ Conversation Flow - PASSED

▶ Swedish Language Quality
  Validating Swedish responses and grammar

  ✓ Should use appropriate formal/informal tone (1.2s)
  ✓ Should use correct Swedish grammar and spelling (0.8s)
  ✓ Should adapt language based on candidate responses (3.4s)

✅ Swedish Language Quality - PASSED

▶ Information Gathering
  Checking information collection completeness

  ✓ Should extract driving license information correctly (4.2s)
  ✓ Should extract work experience correctly (3.8s)
  ✓ Should handle availability information (2.9s)
  ✓ Should assess Swedish language level (3.1s)
  ✓ Should track conversation progress accurately (5.2s)

✅ Information Gathering - PASSED

📊 TestSprite Analysis Complete

Generated:
├── Conversation Flow Test Results
├── Swedish Language Validation Report
├── Information Gathering Analysis
├── ML Integration Performance Metrics
└── Comprehensive Test Coverage Report

Quality Metrics:
  conversationQuality: 92%
  swedishAccuracy: 95%
  informationCompleteness: 88%
  mlIntegration: 90%
  overallScore: 91%
```

## 🎯 Test Scenarios

### Ideal Candidate Flow
```javascript
// TestSprite automatically tests with:
- "Hej! Jag har B-körkort sedan 5 år"
- "Jag har jobbat 3 år på flyttfirma"
- "Kan börja omgående"
- "Pratar flytande svenska"

Expected: High success probability (>80%)
```

### Challenging Candidate Flow
```javascript
// TestSprite tests edge cases:
- "Hej, jag har inget körkort"
- "Ingen erfarenhet"
- "Bara vardagar"
- "Svenska är okej"

Expected: Lower success probability (<50%)
```

### Error Handling
```javascript
// TestSprite validates:
- Network failures
- Empty messages
- Very long inputs
- Invalid responses
```

## 🔧 Configuration

TestSprite uses the `testsprite.config.js` file to understand:
- Swedish language requirements
- Conversation flow expectations
- Information fields to validate
- ML integration points
- Performance benchmarks

## 📈 Continuous Testing

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test Lowisa Conversation Quality
  run: |
    npm run test:lowisa
    npx testsprite --generate-report
```

## 🤝 Integration with Claude Code

When using TestSprite through Claude Code MCP:

1. TestSprite analyzes your entire codebase
2. Understands the Lowisa implementation
3. Generates context-aware tests
4. Provides actionable improvement suggestions

Example Claude prompt:
```
"TestSprite, please analyze our Lowisa chatbot and suggest improvements 
for Swedish language quality and information gathering accuracy"
```

## 📝 Reports

TestSprite generates detailed reports including:
- Conversation flow diagrams
- Language quality scores
- Information extraction accuracy
- ML prediction performance
- User experience metrics
- Accessibility compliance
- Security vulnerability checks

Reports are saved in `./test-results/` directory.