const puppeteer = require('puppeteer');

/**
 * TestSprite Test Suite for Lowisa Conversation Quality
 * 
 * This test suite validates:
 * 1. Conversation flow and logic
 * 2. Swedish language quality and appropriateness
 * 3. Information gathering completeness
 * 4. ML integration functionality
 */

describe('Lowisa Conversation Quality Tests', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Conversation Flow Tests', () => {
    test('Should start with appropriate Swedish greeting', async () => {
      // Navigate to recruitment page
      await page.goto('http://localhost:3000/crm/rekrytering');
      
      // Click on a candidate to open modal
      await page.waitForSelector('[data-testid="candidate-card"]');
      await page.click('[data-testid="candidate-card"]:first-child');
      
      // Switch to Lowisa tab
      await page.waitForSelector('button:has-text("Lowisa")');
      await page.click('button:has-text("Lowisa")');
      
      // Check initial greeting
      const greeting = await page.$eval('.lowisa-message:first-child', el => el.textContent);
      expect(greeting).toContain('Hej');
      expect(greeting).toContain('Tack för din ansökan');
      expect(greeting).toMatch(/Nordflytt/i);
    });

    test('Should follow logical question sequence', async () => {
      const expectedSequence = [
        'körkort',
        'arbetserfarenhet',
        'tillgänglighet',
        'svenska'
      ];
      
      // Track which topics have been covered
      const coveredTopics = new Set();
      
      // Send responses and track Lowisa's questions
      for (let i = 0; i < 4; i++) {
        // Send a generic response
        await page.type('[data-testid="lowisa-input"]', 'Ja, jag har erfarenhet');
        await page.click('[data-testid="send-button"]');
        
        // Wait for Lowisa's response
        await page.waitForTimeout(2000);
        
        // Get latest Lowisa message
        const messages = await page.$$eval('.lowisa-message', els => 
          els.map(el => el.textContent.toLowerCase())
        );
        
        const latestMessage = messages[messages.length - 1];
        
        // Check which topic is being discussed
        expectedSequence.forEach(topic => {
          if (latestMessage.includes(topic)) {
            coveredTopics.add(topic);
          }
        });
      }
      
      // Verify all topics were covered
      expect(coveredTopics.size).toBe(4);
    });

    test('Should complete conversation when all information gathered', async () => {
      // Complete all information fields
      const responses = [
        'Jag har B-körkort',
        'Jag har jobbat 3 år inom flytt och lager',
        'Jag kan jobba alla dagar, börja omgående',
        'Jag pratar flytande svenska, nivå 5'
      ];
      
      for (const response of responses) {
        await page.type('[data-testid="lowisa-input"]', response);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(1500);
      }
      
      // Check for completion message
      await page.waitForSelector('.completion-message', { timeout: 10000 });
      const completionText = await page.$eval('.completion-message', el => el.textContent);
      
      expect(completionText).toContain('Tack för dina svar');
      expect(completionText).toContain('https://syn7dh9e02w.typeform.com/to/pUeKubsb');
    });
  });

  describe('Swedish Language Quality Tests', () => {
    test('Should use appropriate formal/informal tone', async () => {
      const messages = await page.$$eval('.lowisa-message', els => 
        els.map(el => el.textContent)
      );
      
      messages.forEach(message => {
        // Check for appropriate pronouns (du/dig not ni)
        expect(message.toLowerCase()).toMatch(/\bdu\b|\bdig\b|\bditt\b|\bdina\b/);
        expect(message.toLowerCase()).not.toMatch(/\bni\b/);
        
        // Check for friendly but professional tone
        const friendlyPhrases = ['Tack', 'Hej', 'Kul', 'Bra'];
        const hasFriendlyTone = friendlyPhrases.some(phrase => 
          message.includes(phrase)
        );
        expect(hasFriendlyTone).toBe(true);
      });
    });

    test('Should use correct Swedish grammar and spelling', async () => {
      const messages = await page.$$eval('.lowisa-message', els => 
        els.map(el => el.textContent)
      );
      
      const commonErrors = [
        /\bär är\b/,  // Double verb
        /\bdet det\b/, // Double word
        /\bsom som\b/, // Double word
        /\bå\b(?![a-zåäö])/i, // Standalone å
      ];
      
      messages.forEach(message => {
        commonErrors.forEach(errorPattern => {
          expect(message).not.toMatch(errorPattern);
        });
        
        // Check for proper Swedish characters
        expect(message).toMatch(/[åäöÅÄÖ]/);
      });
    });

    test('Should adapt language based on candidate responses', async () => {
      // Test with informal response
      await page.reload();
      await page.type('[data-testid="lowisa-input"]', 'hej! ja har körkort typ');
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(2000);
      
      // Lowisa should maintain professional but friendly tone
      const response1 = await page.$eval('.lowisa-message:last-child', el => el.textContent);
      expect(response1).toMatch(/Vad bra|Toppen|Perfekt/);
      
      // Test with formal response
      await page.type('[data-testid="lowisa-input"]', 'Jag innehar B-körkort sedan 2018.');
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(2000);
      
      const response2 = await page.$eval('.lowisa-message:last-child', el => el.textContent);
      expect(response2).toMatch(/Utmärkt|Mycket bra/);
    });
  });

  describe('Information Gathering Tests', () => {
    test('Should extract driving license information correctly', async () => {
      const testCases = [
        { input: 'Jag har B-körkort', expected: 'B' },
        { input: 'Har både B och C kort', expected: 'B, C' },
        { input: 'CE-körkort sedan 5 år', expected: 'CE' },
        { input: 'Nej, inget körkort', expected: 'Inget' }
      ];
      
      for (const testCase of testCases) {
        await page.reload();
        await page.type('[data-testid="lowisa-input"]', testCase.input);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(2000);
        
        // Check information status update
        const status = await page.$eval('[data-testid="korkort-status"]', el => 
          el.textContent
        );
        expect(status).toContain(testCase.expected);
      }
    });

    test('Should extract work experience correctly', async () => {
      const testCases = [
        { 
          input: 'Jobbat 3 år på flyttfirma och 2 år inom lager',
          keywords: ['flytt', 'lager', '3 år', '2 år']
        },
        {
          input: 'Arbetat som städare i 18 månader',
          keywords: ['städ', '18 månader']
        }
      ];
      
      for (const testCase of testCases) {
        await page.type('[data-testid="lowisa-input"]', testCase.input);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(2000);
        
        const status = await page.$eval('[data-testid="experience-status"]', el => 
          el.textContent.toLowerCase()
        );
        
        testCase.keywords.forEach(keyword => {
          expect(status).toContain(keyword.toLowerCase());
        });
      }
    });

    test('Should handle availability information', async () => {
      const testCases = [
        {
          input: 'Kan börja nästa måndag, jobba alla dagar utom helger',
          shouldContain: ['måndag', 'helger']
        },
        {
          input: 'Tillgänglig omgående, flexibel med tider',
          shouldContain: ['omgående', 'flexibel']
        }
      ];
      
      for (const testCase of testCases) {
        await page.type('[data-testid="lowisa-input"]', testCase.input);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(2000);
        
        const status = await page.$eval('[data-testid="availability-status"]', el => 
          el.textContent.toLowerCase()
        );
        
        testCase.shouldContain.forEach(keyword => {
          expect(status).toContain(keyword);
        });
      }
    });

    test('Should assess Swedish language level', async () => {
      const testCases = [
        { input: 'Pratar flytande svenska', expected: 5 },
        { input: 'Min svenska är bra, nivå 4', expected: 4 },
        { input: 'Grundläggande svenska', expected: 2 },
        { input: '3 av 5 i svenska', expected: 3 }
      ];
      
      for (const testCase of testCases) {
        await page.type('[data-testid="lowisa-input"]', testCase.input);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(2000);
        
        const level = await page.$eval('[data-testid="svenska-level"]', el => 
          parseInt(el.textContent.match(/\d/)[0])
        );
        
        expect(level).toBe(testCase.expected);
      }
    });

    test('Should track conversation progress accurately', async () => {
      // Check initial progress
      let progress = await page.$eval('[data-testid="progress-bar"]', el => 
        parseInt(el.getAttribute('aria-valuenow'))
      );
      expect(progress).toBe(0);
      
      // Complete one field
      await page.type('[data-testid="lowisa-input"]', 'Jag har B-körkort');
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(2000);
      
      progress = await page.$eval('[data-testid="progress-bar"]', el => 
        parseInt(el.getAttribute('aria-valuenow'))
      );
      expect(progress).toBe(25);
      
      // Complete all fields
      const remainingInputs = [
        'Arbetat 2 år inom flytt',
        'Kan börja omgående',
        'Talar flytande svenska'
      ];
      
      for (const input of remainingInputs) {
        await page.type('[data-testid="lowisa-input"]', input);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(2000);
      }
      
      progress = await page.$eval('[data-testid="progress-bar"]', el => 
        parseInt(el.getAttribute('aria-valuenow'))
      );
      expect(progress).toBe(100);
    });
  });

  describe('ML Integration Tests', () => {
    test('Should show ML prediction when conversation completes', async () => {
      // Complete conversation quickly
      const inputs = [
        'B-körkort',
        '3 års erfarenhet inom flytt',
        'Kan börja direkt, alla dagar',
        'Nivå 5 svenska'
      ];
      
      for (const input of inputs) {
        await page.type('[data-testid="lowisa-input"]', input);
        await page.click('[data-testid="send-button"]');
        await page.waitForTimeout(1000);
      }
      
      // Wait for ML prediction message
      await page.waitForSelector('.ml-prediction-message', { timeout: 10000 });
      
      const mlMessage = await page.$eval('.ml-prediction-message', el => el.textContent);
      expect(mlMessage).toContain('ML-analys klar');
      expect(mlMessage).toMatch(/\d+%/); // Success probability
      expect(mlMessage).toContain('Rekommenderad position');
    });

    test('Should calculate conversation metrics', async () => {
      // Check that metrics are being tracked
      const metrics = await page.evaluate(() => {
        return window.__conversationMetrics;
      });
      
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('engagementLevel');
      expect(metrics).toHaveProperty('sentimentScore');
      expect(metrics.engagementLevel).toBeGreaterThan(0);
      expect(metrics.engagementLevel).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling Tests', () => {
    test('Should handle network errors gracefully', async () => {
      // Simulate offline
      await page.setOfflineMode(true);
      
      await page.type('[data-testid="lowisa-input"]', 'Test message');
      await page.click('[data-testid="send-button"]');
      
      // Should show error message
      await page.waitForSelector('.error-message');
      const errorText = await page.$eval('.error-message', el => el.textContent);
      expect(errorText).toContain('tekniskt problem');
      
      await page.setOfflineMode(false);
    });

    test('Should validate input before sending', async () => {
      // Try sending empty message
      await page.click('[data-testid="send-button"]');
      
      // Button should be disabled for empty input
      const isDisabled = await page.$eval('[data-testid="send-button"]', 
        el => el.disabled
      );
      expect(isDisabled).toBe(true);
      
      // Try very long message
      const longMessage = 'x'.repeat(1001);
      await page.type('[data-testid="lowisa-input"]', longMessage);
      
      // Should truncate or show warning
      const inputValue = await page.$eval('[data-testid="lowisa-input"]', 
        el => el.value
      );
      expect(inputValue.length).toBeLessThanOrEqual(1000);
    });
  });
});

// TestSprite configuration for this test suite
module.exports = {
  testsprite: {
    name: 'Lowisa Conversation Quality Tests',
    description: 'Comprehensive testing of Lowisa recruitment chatbot',
    tags: ['conversation', 'swedish', 'ml', 'recruitment'],
    requirements: [
      'Lowisa should conduct professional Swedish conversations',
      'Information gathering should be complete and accurate',
      'ML predictions should be generated after conversation',
      'Error handling should be user-friendly'
    ],
    testCategories: {
      conversationFlow: {
        priority: 'high',
        coverage: ['greeting', 'question-sequence', 'completion']
      },
      languageQuality: {
        priority: 'high',
        coverage: ['grammar', 'tone', 'adaptation']
      },
      informationGathering: {
        priority: 'critical',
        coverage: ['license', 'experience', 'availability', 'language']
      },
      mlIntegration: {
        priority: 'medium',
        coverage: ['predictions', 'metrics', 'scoring']
      }
    }
  }
};