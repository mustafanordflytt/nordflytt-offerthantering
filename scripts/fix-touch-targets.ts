#!/usr/bin/env ts-node

// Script to automatically fix touch target issues in the codebase
import fs from 'fs'
import path from 'path'
import glob from 'glob'

interface TouchTargetFix {
  pattern: RegExp
  replacement: string
  description: string
}

const fixes: TouchTargetFix[] = [
  // Button height fixes
  {
    pattern: /className="([^"]*?)h-6([^"]*?)"/g,
    replacement: 'className="$1h-11$2"',
    description: 'Fix h-6 (24px) buttons to h-11 (44px)'
  },
  {
    pattern: /className="([^"]*?)h-7([^"]*?)"/g,
    replacement: 'className="$1h-11$2"',
    description: 'Fix h-7 (28px) buttons to h-11 (44px)'
  },
  {
    pattern: /className="([^"]*?)h-8([^"]*?)"/g,
    replacement: 'className="$1h-11$2"',
    description: 'Fix h-8 (32px) buttons to h-11 (44px)'
  },
  {
    pattern: /className="([^"]*?)h-9([^"]*?)"/g,
    replacement: 'className="$1h-11$2"',
    description: 'Fix h-9 (36px) buttons to h-11 (44px)'
  },
  
  // Width fixes for square buttons
  {
    pattern: /className="([^"]*?)w-6 h-6([^"]*?)"/g,
    replacement: 'className="$1w-11 h-11$2"',
    description: 'Fix 24px square buttons to 44px'
  },
  {
    pattern: /className="([^"]*?)w-7 h-7([^"]*?)"/g,
    replacement: 'className="$1w-11 h-11$2"',
    description: 'Fix 28px square buttons to 44px'
  },
  {
    pattern: /className="([^"]*?)w-8 h-8([^"]*?)"/g,
    replacement: 'className="$1w-11 h-11$2"',
    description: 'Fix 32px square buttons to 44px'
  },
  {
    pattern: /className="([^"]*?)w-9 h-9([^"]*?)"/g,
    replacement: 'className="$1w-11 h-11$2"',
    description: 'Fix 36px square buttons to 44px'
  },
  
  // Checkbox fixes
  {
    pattern: /className="([^"]*?)w-3 h-3([^"]*?)"/g,
    replacement: 'className="$1w-5 h-5$2" style={{ minHeight: "44px", minWidth: "44px" }}',
    description: 'Fix tiny checkboxes with proper touch targets'
  },
  
  // Small icon fixes (when used as buttons)
  {
    pattern: /<(\w+) className="h-3 w-3"([^>]*?)>/g,
    replacement: '<$1 className="h-4 w-4"$2 style={{ minHeight: "44px", minWidth: "44px", padding: "20px" }}>',
    description: 'Fix tiny interactive icons'
  },
  
  // Button component fixes
  {
    pattern: /<Button([^>]*?)size="sm"([^>]*?)>/g,
    replacement: '<Button$1size="default"$2 className="min-h-[44px] min-w-[44px]">',
    description: 'Fix small Button components'
  },
  
  // Add touch-manipulation to buttons without it
  {
    pattern: /<button([^>]*?)className="([^"]*?)"([^>]*?)>/g,
    replacement: '<button$1className="$2 touch-manipulation"$3>',
    description: 'Add touch-manipulation to native buttons'
  }
]

// Patterns to exclude (to avoid false positives)
const excludePatterns = [
  /touch-manipulation/,
  /min-h-\[44px\]/,
  /min-w-\[44px\]/,
  /already-fixed/
]

function shouldExcludeFix(content: string, fix: TouchTargetFix): boolean {
  return excludePatterns.some(pattern => pattern.test(content))
}

function fixTouchTargetsInFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8')
  let updatedContent = content
  let hasChanges = false
  
  console.log(`\nProcessing: ${filePath}`)
  
  fixes.forEach(fix => {
    if (shouldExcludeFix(content, fix)) {
      return
    }
    
    const matches = updatedContent.match(fix.pattern)
    if (matches) {
      console.log(`  - Applying: ${fix.description}`)
      console.log(`    Found ${matches.length} instances`)
      updatedContent = updatedContent.replace(fix.pattern, fix.replacement)
      hasChanges = true
    }
  })
  
  if (hasChanges) {
    // Create backup
    fs.writeFileSync(`${filePath}.backup`, content)
    fs.writeFileSync(filePath, updatedContent)
    console.log(`  ✅ Updated ${filePath}`)
  } else {
    console.log(`  ℹ️  No touch target issues found`)
  }
}

function fixTouchTargets(): void {
  console.log('🔧 Fixing touch target issues in staff app...\n')
  
  // Define paths to fix
  const paths = [
    'app/staff/**/*.tsx',
    'components/staff/**/*.tsx',
    'app/staff/**/*.ts',
    'components/ui/**/*.tsx'
  ]
  
  // Get all files
  const files: string[] = []
  paths.forEach(pattern => {
    const matchedFiles = glob.sync(pattern, { 
      ignore: [
        '**/*.d.ts',
        '**/*.backup',
        '**/node_modules/**',
        '**/.next/**'
      ]
    })
    files.push(...matchedFiles)
  })
  
  console.log(`Found ${files.length} files to process\n`)
  
  // Process each file
  files.forEach(fixTouchTargetsInFile)
  
  console.log('\n✅ Touch target fixes complete!')
  console.log('\nNext steps:')
  console.log('1. Test the app on mobile devices')
  console.log('2. Verify all interactive elements are at least 44px')
  console.log('3. Restore from .backup files if needed')
  console.log('4. Import touch-targets.css in your main CSS file')
}

// Add CSS import reminder
function addCSSImport(): void {
  const globalCSSPath = 'app/globals.css'
  
  if (fs.existsSync(globalCSSPath)) {
    const content = fs.readFileSync(globalCSSPath, 'utf-8')
    
    if (!content.includes('touch-targets.css')) {
      const importStatement = `\n/* Touch target fixes for mobile usability */\n@import '../styles/touch-targets.css';\n`
      const updatedContent = content + importStatement
      
      fs.writeFileSync(globalCSSPath, updatedContent)
      console.log('✅ Added touch-targets.css import to globals.css')
    }
  }
}

// Run the fixes
if (require.main === module) {
  fixTouchTargets()
  addCSSImport()
}

export { fixTouchTargets, addCSSImport }