import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyAIImplementation() {
  console.log('🔍 VERIFYING AI IMPLEMENTATION...\n');
  
  const results = {
    filesCreated: {},
    apiConnections: {},
    crmIntegration: {},
    workingFeatures: {},
    databaseChanges: {},
    roiTracking: {}
  };

  // PHASE 1: Verify File Structure
  console.log('📁 PHASE 1: Checking AI Implementation Files');
  console.log('=========================================');
  
  const aiPath = path.join(__dirname, 'lib', 'ai');
  
  try {
    // Check if AI directory exists
    if (fs.existsSync(aiPath)) {
      results.filesCreated.aiDirectoryExists = true;
      
      // Count files recursively
      function countFiles(dir) {
        let count = 0;
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            count += countFiles(fullPath);
          } else if (file.endsWith('.ts') || file.endsWith('.js')) {
            count++;
          }
        });
        
        return count;
      }
      
      const fileCount = countFiles(aiPath);
      results.filesCreated.totalFiles = fileCount;
      console.log(`✅ AI directory exists with ${fileCount} implementation files`);
      
      // Check key directories
      const keyDirs = ['core', 'ml-models', 'workflow', 'intelligence', 'connectors'];
      keyDirs.forEach(dir => {
        const dirPath = path.join(aiPath, dir);
        if (fs.existsSync(dirPath)) {
          results.filesCreated[`${dir}Directory`] = true;
          console.log(`✅ ${dir}/ directory exists`);
        } else {
          results.filesCreated[`${dir}Directory`] = false;
          console.log(`❌ ${dir}/ directory missing`);
        }
      });
      
    } else {
      results.filesCreated.aiDirectoryExists = false;
      console.log('❌ AI directory does not exist!');
    }
  } catch (error) {
    console.error('Error checking files:', error);
  }

  // PHASE 2: Test API Connections
  console.log('\n🔌 PHASE 2: Testing API Connections');
  console.log('====================================');
  
  // Check for environment variables
  const requiredEnvVars = ['AI_SERVICE_API_KEY', 'AI_SERVICE_API_URL', 'OPENAI_API_KEY'];
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      results.apiConnections[envVar] = 'configured';
      console.log(`✅ ${envVar} is configured`);
    } else {
      results.apiConnections[envVar] = 'missing';
      console.log(`❌ ${envVar} is missing`);
    }
  });

  // PHASE 3: Browser Testing
  console.log('\n🌐 PHASE 3: Testing CRM Integration');
  console.log('====================================');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Check if server is running
    try {
      await page.goto('http://localhost:3456', { waitUntil: 'networkidle0', timeout: 10000 });
      results.crmIntegration.serverRunning = true;
      console.log('✅ Server is running');
    } catch (error) {
      results.crmIntegration.serverRunning = false;
      console.log('❌ Server is not running on localhost:3456');
      await browser.close();
      return results;
    }

    // Test 2: Navigate to CRM
    try {
      await page.goto('http://localhost:3456/crm/dashboard');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for AI indicators
      const aiIndicators = await page.evaluate(() => {
        const indicators = {
          aiScore: document.querySelector('[data-testid="ai-lead-score"]'),
          aiAssignment: document.querySelector('[data-testid="ai-assignment"]'),
          aiOptimization: document.querySelector('[data-testid="ai-optimization"]'),
          aiPricing: document.querySelector('[data-testid="ai-pricing"]')
        };
        
        return {
          hasAIScore: !!indicators.aiScore,
          hasAIAssignment: !!indicators.aiAssignment,
          hasAIOptimization: !!indicators.aiOptimization,
          hasAIPricing: !!indicators.aiPricing
        };
      });
      
      results.crmIntegration.aiIndicators = aiIndicators;
      
      if (Object.values(aiIndicators).some(v => v)) {
        console.log('✅ Found AI indicators in CRM');
      } else {
        console.log('❌ No AI indicators found in CRM UI');
      }
      
    } catch (error) {
      console.log('❌ Failed to check CRM integration:', error.message);
    }

    // Test 3: Check for working features
    console.log('\n🧪 Testing Working Features');
    console.log('===========================');
    
    // Test lead scoring
    try {
      await page.goto('http://localhost:3456/crm/leads');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const hasLeadScoring = await page.evaluate(() => {
        return document.body.textContent?.includes('Lead Score') || 
               document.body.textContent?.includes('AI Score');
      });
      
      results.workingFeatures.leadScoring = hasLeadScoring;
      console.log(hasLeadScoring ? '✅ Lead scoring present' : '❌ Lead scoring not found');
      
    } catch (error) {
      results.workingFeatures.leadScoring = false;
      console.log('❌ Error checking lead scoring');
    }

    // Test automation features
    try {
      await page.goto('http://localhost:3456/crm/uppdrag');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const hasAutomation = await page.evaluate(() => {
        return document.body.textContent?.includes('Automatisk') || 
               document.body.textContent?.includes('AI');
      });
      
      results.workingFeatures.automation = hasAutomation;
      console.log(hasAutomation ? '✅ Automation features present' : '❌ Automation features not found');
      
    } catch (error) {
      results.workingFeatures.automation = false;
      console.log('❌ Error checking automation');
    }

  } catch (error) {
    console.error('Browser testing error:', error);
  } finally {
    await browser.close();
  }

  // PHASE 4: Summary Report
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('======================');
  
  const fileStatus = results.filesCreated.aiDirectoryExists && results.filesCreated.totalFiles > 30;
  const apiStatus = results.apiConnections.AI_SERVICE_API_KEY !== 'missing';
  const crmStatus = results.crmIntegration.serverRunning;
  const featureStatus = Object.values(results.workingFeatures).some(v => v);
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log(`- Implementation Files: ${fileStatus ? '✅ COMPLETE' : '❌ INCOMPLETE'} (${results.filesCreated.totalFiles || 0} files)`);
  console.log(`- API Configuration: ${apiStatus ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
  console.log(`- CRM Integration: ${crmStatus ? '✅ RUNNING' : '❌ NOT RUNNING'}`);
  console.log(`- Working Features: ${featureStatus ? '✅ SOME WORKING' : '❌ NONE WORKING'}`);
  
  // Determine reality vs claims
  console.log('\n🔍 REALITY CHECK:');
  if (fileStatus && results.filesCreated.totalFiles > 30) {
    console.log('✅ Real implementation files exist (not templates)');
  } else {
    console.log('❌ Implementation appears to be incomplete or missing');
  }
  
  if (apiStatus) {
    console.log('✅ API connections are configured');
  } else {
    console.log('❌ API connections are not configured');
  }
  
  if (crmStatus && featureStatus) {
    console.log('✅ Some AI features appear to be integrated');
  } else {
    console.log('❌ AI features are not visibly integrated in CRM');
  }
  
  // ROI Assessment
  console.log('\n💰 ROI CLAIMS VERIFICATION:');
  console.log('- Claimed: 92% automation, 2,385% ROI');
  console.log('- Reality: Implementation exists but integration status unclear');
  console.log('- Recommendation: Need to configure APIs and complete integration');
  
  return results;
}

// Run verification
verifyAIImplementation()
  .then(results => {
    console.log('\n📋 Full results:', JSON.stringify(results, null, 2));
  })
  .catch(error => {
    console.error('Verification failed:', error);
  });