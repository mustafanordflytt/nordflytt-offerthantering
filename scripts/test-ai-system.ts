#!/usr/bin/env node

/**
 * AI System Test Runner
 * Execute comprehensive tests on the AI implementation
 */

import { aiTestFramework } from '../lib/ai/testing/ai-test-framework';

async function main() {
  console.log('🤖 Nordflytt AI System Test Suite');
  console.log('=================================\n');

  try {
    // Run all tests
    console.log('Starting comprehensive AI system tests...\n');
    const results = await aiTestFramework.runAllTests();

    // Run performance benchmarks
    console.log('\n');
    await aiTestFramework.runPerformanceBenchmarks();

    // Check if all tests passed
    const allPassed = results.every(r => r.passed);
    
    if (allPassed) {
      console.log('\n✅ All tests passed! AI system is functioning correctly.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);