/**
 * Test the CRM Jobs API to verify enhanced features
 */

const fetch = require('node-fetch');

async function testJobsAPI() {
  console.log('🧪 TESTING CRM JOBS API ENHANCED FEATURES\n');
  
  try {
    // Fetch jobs from API
    const response = await fetch('http://localhost:3000/api/crm/jobs');
    const data = await response.json();
    
    if (!data.jobs || data.jobs.length === 0) {
      console.log('❌ No jobs found in API response');
      return;
    }
    
    console.log(`📊 Found ${data.jobs.length} jobs\n`);
    
    // Find NF-23857BDE if it exists
    const targetJob = data.jobs.find(job => job.bookingNumber === 'NF-23857BDE');
    
    if (targetJob) {
      console.log('🎯 FOUND NF-23857BDE:');
      console.log(`   Estimated Hours: ${targetJob.estimatedHours}h`);
      console.log(`   Volume: ${targetJob.estimatedVolume} m³`);
      console.log(`   Distance: ${targetJob.distance} km`);
      console.log('');
      
      // Check for enhanced features
      console.log('🔍 ENHANCED FEATURES CHECK:');
      console.log(`   timeBreakdown: ${targetJob.timeBreakdown ? '✅ Present' : '❌ Missing'}`);
      console.log(`   teamOptimization: ${targetJob.teamOptimization ? '✅ Present' : '❌ Missing'}`);
      console.log(`   competitiveAnalysis: ${targetJob.competitiveAnalysis ? '✅ Present' : '❌ Missing'}`);
      
      if (targetJob.timeBreakdown) {
        console.log('\n📈 Time Breakdown:');
        Object.entries(targetJob.timeBreakdown).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}h`);
        });
      }
      
      if (targetJob.teamOptimization) {
        console.log('\n🏆 Team Optimization:');
        console.log(`   Current Team Size: ${targetJob.teamOptimization.currentTeamSize}`);
        console.log(`   Current Efficiency: ${targetJob.teamOptimization.currentEfficiency} m³/h`);
        console.log(`   Efficiency Rating: ${targetJob.teamOptimization.efficiencyRating}`);
        console.log(`   Optimal Team Size: ${targetJob.teamOptimization.optimalTeamSize}`);
      }
      
      if (targetJob.competitiveAnalysis) {
        console.log('\n🎖️ Competitive Analysis:');
        console.log(`   vs Competitors: ${targetJob.competitiveAnalysis.estimateVsCompetitors}`);
        console.log(`   Market Position: ${targetJob.competitiveAnalysis.marketPosition}`);
      }
    } else {
      console.log('⚠️ NF-23857BDE not found, checking first job instead:\n');
      
      const firstJob = data.jobs[0];
      console.log(`📋 Job: ${firstJob.bookingNumber}`);
      console.log(`   Estimated Hours: ${firstJob.estimatedHours}h`);
      console.log(`   Volume: ${firstJob.estimatedVolume} m³`);
      console.log('');
      
      console.log('🔍 ENHANCED FEATURES CHECK:');
      console.log(`   timeBreakdown: ${firstJob.timeBreakdown ? '✅ Present' : '❌ Missing'}`);
      console.log(`   teamOptimization: ${firstJob.teamOptimization ? '✅ Present' : '❌ Missing'}`);
      console.log(`   competitiveAnalysis: ${firstJob.competitiveAnalysis ? '✅ Present' : '❌ Missing'}`);
    }
    
    // Overall verification
    const jobsWithEnhanced = data.jobs.filter(job => 
      job.teamOptimization && job.competitiveAnalysis
    );
    
    console.log('\n📊 OVERALL STATISTICS:');
    console.log(`   Total Jobs: ${data.jobs.length}`);
    console.log(`   Jobs with Enhanced Features: ${jobsWithEnhanced.length}`);
    console.log(`   Coverage: ${((jobsWithEnhanced.length / data.jobs.length) * 100).toFixed(1)}%`);
    
    if (jobsWithEnhanced.length === data.jobs.length) {
      console.log('\n✅ SUCCESS: All jobs have enhanced features!');
    } else {
      console.log('\n⚠️ WARNING: Not all jobs have enhanced features');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\nMake sure the Next.js dev server is running on port 3000');
  }
}

// Run the test
testJobsAPI();