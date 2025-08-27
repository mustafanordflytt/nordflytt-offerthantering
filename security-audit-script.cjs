#!/usr/bin/env node

// NORDFLYTT SECURITY AUDIT SCRIPT
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔒 NORDFLYTT SECURITY AUDIT')
console.log('===========================\n')

const results = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: []
}

// Helper to add finding
function addFinding(severity, category, description, file = null, recommendation = null) {
  const finding = {
    category,
    description,
    file,
    recommendation
  }
  results[severity].push(finding)
}

// 1. Check environment variables
console.log('1. Checking environment variables...')
function checkEnvFiles() {
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development']
  const sensitivePatterns = [
    /API_KEY/i,
    /SECRET/i,
    /TOKEN/i,
    /PASSWORD/i,
    /CLIENT_ID/i,
    /PRIVATE/i,
    /DATABASE_URL/i,
    /SUPABASE.*KEY/i
  ]
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      
      // Check if it's in gitignore
      const gitignore = fs.readFileSync('.gitignore', 'utf8')
      if (!gitignore.includes(file)) {
        addFinding('critical', 'Environment', `${file} is NOT in .gitignore!`, file, 'Add to .gitignore immediately')
      }
      
      // Check for sensitive values
      lines.forEach((line, index) => {
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(line) && !line.trim().startsWith('#')) {
            console.log(`  Found sensitive var in ${file}:${index + 1}`)
          }
        })
      })
    }
  })
}

// 2. Check for hardcoded secrets
console.log('\n2. Scanning for hardcoded secrets...')
function scanForSecrets() {
  const extensions = ['.js', '.ts', '.tsx', '.jsx']
  const excludeDirs = ['node_modules', '.next', '.git', 'dist', 'build']
  
  const secretPatterns = [
    { pattern: /['"][A-Za-z0-9]{32,}['"]/, desc: 'Potential API key' },
    { pattern: /sk_live_[a-zA-Z0-9]{24,}/, desc: 'Stripe secret key' },
    { pattern: /SG\.[a-zA-Z0-9._-]{22,}/, desc: 'SendGrid API key' },
    { pattern: /AC[a-z0-9]{32}/, desc: 'Twilio Account SID' },
    { pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, desc: 'JWT token' },
    { pattern: /postgresql:\/\/[^:]+:[^@]+@/, desc: 'Database URL with password' }
  ]
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          scanDir(fullPath)
        }
      } else if (extensions.includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf8')
        
        secretPatterns.forEach(({ pattern, desc }) => {
          if (pattern.test(content)) {
            // Check if it's using process.env
            const match = content.match(pattern)
            if (match && !content.includes(`process.env`) && !content.includes('import.meta.env')) {
              addFinding('critical', 'Hardcoded Secret', desc, fullPath, 'Move to environment variable')
            }
          }
        })
      }
    })
  }
  
  scanDir('.')
}

// 3. Check API route security
console.log('\n3. Checking API route security...')
function checkAPIRoutes() {
  const apiDir = './app/api'
  
  function checkRoute(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for authentication
    if (!content.includes('auth') && !content.includes('public')) {
      if (content.includes('POST') || content.includes('PUT') || content.includes('DELETE')) {
        addFinding('high', 'API Security', 'Potentially unprotected mutation endpoint', filePath, 'Add authentication check')
      }
    }
    
    // Check for rate limiting
    if (!content.includes('rateLimit') && !content.includes('rate-limit')) {
      addFinding('medium', 'API Security', 'No rate limiting detected', filePath, 'Add rate limiting')
    }
    
    // Check for input validation
    if (!content.includes('validate') && !content.includes('parse') && !content.includes('schema')) {
      if (content.includes('request.json()')) {
        addFinding('medium', 'API Security', 'No input validation detected', filePath, 'Add input validation')
      }
    }
    
    // Check for CORS
    if (!content.includes('Access-Control-Allow-Origin') && !content.includes('cors')) {
      addFinding('low', 'API Security', 'No explicit CORS configuration', filePath, 'Configure CORS if needed')
    }
  }
  
  function scanAPIDir(dir) {
    if (!fs.existsSync(dir)) return
    
    const files = fs.readdirSync(dir)
    files.forEach(file => {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanAPIDir(fullPath)
      } else if (file === 'route.ts' || file === 'route.js') {
        checkRoute(fullPath)
      }
    })
  }
  
  scanAPIDir(apiDir)
}

// 4. Check authentication implementation
console.log('\n4. Checking authentication...')
function checkAuth() {
  // Check middleware
  if (fs.existsSync('./middleware.ts')) {
    const middleware = fs.readFileSync('./middleware.ts', 'utf8')
    console.log('  ✓ Middleware exists')
    
    if (!middleware.includes('auth') && !middleware.includes('jwt')) {
      addFinding('high', 'Authentication', 'Middleware exists but no auth logic detected', 'middleware.ts', 'Implement auth middleware')
    }
  } else {
    addFinding('medium', 'Authentication', 'No middleware.ts file found', null, 'Create middleware for auth')
  }
  
  // Check for secure session handling
  const authFiles = ['./lib/auth.ts', './lib/supabase.ts', './app/api/auth']
  authFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  ✓ Auth file found: ${file}`)
    }
  })
}

// 5. Check for SQL injection vulnerabilities
console.log('\n5. Checking for SQL injection risks...')
function checkSQLInjection() {
  const patterns = [
    { pattern: /query\s*\(\s*['"`].*\$\{.*\}.*['"`]\s*\)/, desc: 'String interpolation in query' },
    { pattern: /query\s*\(\s*['"`].*\+.*['"`]\s*\)/, desc: 'String concatenation in query' },
    { pattern: /raw\s*\(\s*['"`].*\$\{.*\}.*['"`]\s*\)/, desc: 'Raw query with interpolation' }
  ]
  
  const jsFiles = execSync('find . -name "*.js" -o -name "*.ts" | grep -v node_modules | grep -v .next', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      
      patterns.forEach(({ pattern, desc }) => {
        if (pattern.test(content)) {
          addFinding('critical', 'SQL Injection', desc, file, 'Use parameterized queries')
        }
      })
    }
  })
}

// 6. Check XSS vulnerabilities
console.log('\n6. Checking for XSS vulnerabilities...')
function checkXSS() {
  const patterns = [
    { pattern: /dangerouslySetInnerHTML/, desc: 'dangerouslySetInnerHTML usage' },
    { pattern: /innerHTML\s*=/, desc: 'Direct innerHTML assignment' },
    { pattern: /document\.write/, desc: 'document.write usage' }
  ]
  
  const jsxFiles = execSync('find . -name "*.tsx" -o -name "*.jsx" | grep -v node_modules | grep -v .next', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  jsxFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      
      patterns.forEach(({ pattern, desc }) => {
        if (pattern.test(content)) {
          // Check if it's sanitized
          if (!content.includes('sanitize') && !content.includes('DOMPurify')) {
            addFinding('high', 'XSS', desc, file, 'Sanitize user input before rendering')
          }
        }
      })
    }
  })
}

// 7. Check dependency vulnerabilities
console.log('\n7. Checking dependency vulnerabilities...')
function checkDependencies() {
  try {
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' })
    const audit = JSON.parse(auditResult)
    
    if (audit.vulnerabilities) {
      Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
        const severity = vuln.severity === 'critical' ? 'critical' : 
                        vuln.severity === 'high' ? 'high' :
                        vuln.severity === 'moderate' ? 'medium' : 'low'
        
        addFinding(severity, 'Dependencies', `${name}: ${vuln.title || vuln.severity} vulnerability`, 'package.json', `Run: npm audit fix`)
      })
    }
  } catch (error) {
    console.log('  Could not run npm audit')
  }
}

// 8. Check HTTPS enforcement
console.log('\n8. Checking HTTPS enforcement...')
function checkHTTPS() {
  // Check for HTTP URLs in code
  const httpPattern = /http:\/\/(?!localhost|127\.0\.0\.1)/
  
  const files = execSync('find . -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      if (httpPattern.test(content)) {
        addFinding('medium', 'HTTPS', 'HTTP URL found (not localhost)', file, 'Use HTTPS URLs')
      }
    }
  })
}

// 9. Check for sensitive data exposure
console.log('\n9. Checking for sensitive data exposure...')
function checkDataExposure() {
  // Check console.logs
  const files = execSync('grep -r "console.log" --include="*.js" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next || true', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  files.forEach(line => {
    if (line.includes('password') || line.includes('token') || line.includes('secret')) {
      const file = line.split(':')[0]
      addFinding('high', 'Data Exposure', 'Console.log with potentially sensitive data', file, 'Remove console.logs in production')
    }
  })
}

// Run all checks
try {
  checkEnvFiles()
  scanForSecrets()
  checkAPIRoutes()
  checkAuth()
  checkSQLInjection()
  checkXSS()
  checkDependencies()
  checkHTTPS()
  checkDataExposure()
} catch (error) {
  console.error('Error during audit:', error.message)
}

// Generate report
console.log('\n\n' + '='.repeat(60))
console.log('🔒 SECURITY AUDIT REPORT')
console.log('='.repeat(60))

const severities = ['critical', 'high', 'medium', 'low', 'info']
const emojis = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  info: 'ℹ️'
}

let totalFindings = 0

severities.forEach(severity => {
  const findings = results[severity]
  if (findings.length > 0) {
    console.log(`\n${emojis[severity]} ${severity.toUpperCase()} (${findings.length})`)
    console.log('-'.repeat(40))
    
    findings.forEach((finding, index) => {
      console.log(`${index + 1}. [${finding.category}] ${finding.description}`)
      if (finding.file) console.log(`   File: ${finding.file}`)
      if (finding.recommendation) console.log(`   Fix: ${finding.recommendation}`)
    })
    
    totalFindings += findings.length
  }
})

// Summary
console.log('\n' + '='.repeat(60))
console.log('📊 SUMMARY')
console.log('='.repeat(60))
console.log(`Total findings: ${totalFindings}`)
console.log(`Critical: ${results.critical.length}`)
console.log(`High: ${results.high.length}`)
console.log(`Medium: ${results.medium.length}`)
console.log(`Low: ${results.low.length}`)

// Generate JSON report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: totalFindings,
    critical: results.critical.length,
    high: results.high.length,
    medium: results.medium.length,
    low: results.low.length,
    info: results.info.length
  },
  findings: results
}

fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2))
console.log('\n✅ Report saved to security-audit-report.json')

// Exit code based on findings
if (results.critical.length > 0) {
  console.log('\n❌ Critical security issues found!')
  process.exit(1)
} else if (results.high.length > 0) {
  console.log('\n⚠️  High severity issues found')
  process.exit(0)
} else {
  console.log('\n✅ No critical issues found')
  process.exit(0)
}