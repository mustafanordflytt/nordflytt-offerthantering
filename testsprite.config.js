/**
 * TestSprite Configuration for Nordflytt Recruitment System
 * Focus: Lowisa AI Recruitment Assistant
 */

module.exports = {
  projectName: 'Nordflytt Lowisa Recruitment Assistant',
  projectDescription: 'AI-powered Swedish recruitment chatbot with ML predictions',
  
  // Test Environment Configuration
  environment: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    testTimeout: 30000,
    headless: false,
    slowMo: 100 // Slow down for better observation
  },

  // Swedish Language Testing Configuration
  languageTesting: {
    primaryLanguage: 'sv-SE',
    validateGrammar: true,
    validateSpelling: true,
    validateTone: {
      expected: 'professional-friendly',
      formalityLevel: 'informal', // Du/dig, not Ni
      emotionalTone: 'warm-encouraging'
    },
    commonPhrases: {
      greetings: ['Hej', 'Tack', 'Välkommen'],
      encouragement: ['Bra', 'Utmärkt', 'Toppen', 'Perfekt'],
      transitions: ['Låt oss', 'Nu behöver jag', 'Nästa steg']
    }
  },

  // Conversation Flow Testing
  conversationFlow: {
    expectedSequence: [
      'greeting',
      'driving_license_inquiry',
      'work_experience_inquiry', 
      'availability_inquiry',
      'swedish_language_inquiry',
      'completion_with_typeform_link'
    ],
    requiredInformation: {
      korkort: {
        field: 'driving_license',
        required: true,
        validValues: ['B', 'C', 'CE', 'D', 'Inget'],
        extractionPatterns: [
          /\b([BCDE]E?)\b-?körkort/i,
          /körkort.*\b([BCDE]E?)\b/i,
          /\b([BCDE]E?)\b(?:\s+och\s+([BCDE]E?))?/i
        ]
      },
      arbetserfarenhet: {
        field: 'work_experience',
        required: true,
        keywordCategories: {
          flytt: ['flytt', 'flyttfirma', 'flyttjobb'],
          stad: ['städ', 'städning', 'städare'],
          lager: ['lager', 'logistik', 'truck'],
          bygg: ['bygg', 'byggarbete', 'snickare'],
          restaurang: ['restaurang', 'kök', 'servering']
        },
        durationPatterns: [
          /(\d+)\s*år/i,
          /(\d+)\s*månad/i,
          /(\d+)\s*veckor/i
        ]
      },
      tillganglighet: {
        field: 'availability',
        required: true,
        startDateKeywords: ['omgående', 'direkt', 'nästa vecka', 'måndag'],
        scheduleKeywords: ['helger', 'kvällar', 'alla dagar', 'vardagar']
      },
      svenska: {
        field: 'swedish_level',
        required: true,
        levelMapping: {
          'flytande': 5,
          'mycket bra': 4,
          'bra': 3,
          'grundläggande': 2,
          'begränsad': 1
        },
        numberPattern: /\b([1-5])\b/
      }
    }
  },

  // ML Integration Testing
  mlIntegration: {
    expectPrediction: true,
    predictionTiming: 'after_completion',
    requiredPredictionFields: [
      'successProbability',
      'recommendedPosition',
      'riskFactors'
    ],
    metricsToTrack: [
      'responseTime',
      'messageLength',
      'sentimentScore',
      'engagementLevel',
      'clarityScore',
      'professionalismScore'
    ],
    sentimentAnalysis: {
      positiveIndicators: ['ja', 'gärna', 'absolut', 'bra', 'perfekt'],
      negativeIndicators: ['nej', 'inte', 'problem', 'svårt', 'osäker'],
      expectedRange: [-1, 1]
    }
  },

  // Test Scenarios
  testScenarios: [
    {
      name: 'Ideal Candidate Flow',
      description: 'Candidate with all qualifications answers positively',
      inputs: [
        'Hej! Jag har B-körkort sedan 5 år',
        'Jag har jobbat 3 år på flyttfirma och 2 år inom lager',
        'Kan börja omgående och jobba alla dagar',
        'Jag pratar flytande svenska, uppvuxen här'
      ],
      expectedOutcome: {
        completionTime: '<5min',
        informationComplete: true,
        mlPrediction: {
          successProbability: '>0.8',
          riskFactors: 0
        }
      }
    },
    {
      name: 'Challenging Candidate Flow',
      description: 'Candidate with limited qualifications',
      inputs: [
        'Hej, jag har inget körkort',
        'Ingen direkt erfarenhet men villig att lära',
        'Kan bara jobba vardagar',
        'Min svenska är okej, kanske 3 av 5'
      ],
      expectedOutcome: {
        completionTime: '<10min',
        informationComplete: true,
        mlPrediction: {
          successProbability: '<0.5',
          riskFactors: '>2'
        }
      }
    },
    {
      name: 'Unclear Responses Flow',
      description: 'Candidate gives vague or unclear answers',
      inputs: [
        'Körkort? Ja typ',
        'Har jobbat lite här och där',
        'Det beror på',
        'Svenska är sådär'
      ],
      expectedBehavior: {
        followUpQuestions: true,
        clarificationRequests: true,
        patience: 'high'
      }
    }
  ],

  // Error Scenarios
  errorScenarios: [
    {
      name: 'Network Failure',
      simulation: 'offline_mode',
      expectedBehavior: 'graceful_error_message'
    },
    {
      name: 'API Timeout',
      simulation: 'slow_response',
      expectedBehavior: 'loading_indicator_and_retry'
    },
    {
      name: 'Invalid Input',
      simulation: 'empty_or_too_long_message',
      expectedBehavior: 'input_validation'
    }
  ],

  // Performance Benchmarks
  performanceBenchmarks: {
    responseTime: {
      target: '<2s',
      acceptable: '<5s',
      metric: 'time_to_lowisa_response'
    },
    conversationCompletion: {
      target: '<5min',
      acceptable: '<10min',
      metric: 'time_to_all_fields_complete'
    },
    mlPredictionGeneration: {
      target: '<3s',
      acceptable: '<5s',
      metric: 'time_to_ml_result_after_completion'
    }
  },

  // Accessibility Testing
  accessibility: {
    wcagLevel: 'AA',
    keyboardNavigation: true,
    screenReaderSupport: true,
    colorContrast: 'AAA',
    focusIndicators: true
  },

  // Security Testing  
  security: {
    validateInputSanitization: true,
    checkXSSVulnerabilities: true,
    validateAPIAuthentication: true,
    sensitiveDataHandling: {
      personalInfo: 'never_logged',
      apiKeys: 'environment_only'
    }
  },

  // Reporting Configuration
  reporting: {
    format: ['junit', 'html', 'json'],
    screenshots: {
      onFailure: true,
      onSuccess: false,
      fullPage: true
    },
    videos: {
      enabled: true,
      keepOnSuccess: false
    },
    customMetrics: {
      conversationQuality: true,
      swedishLanguageScore: true,
      informationCompletenessScore: true,
      mlPredictionAccuracy: true
    }
  }
};