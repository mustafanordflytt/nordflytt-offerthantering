// Debug and fix script for mobile display issues
// Run this in the browser console to diagnose and fix the problem

(function() {
  console.log('=== NORDFLYTT MOBILE FIX ===');
  
  // 1. Check current state
  const mockJobs = localStorage.getItem('mockJobs');
  const jobStatuses = localStorage.getItem('mockJobStatuses');
  const savedServices = localStorage.getItem('staff_jobs_with_services');
  
  console.log('\n📊 Current State:');
  console.log('Mock jobs exist:', !!mockJobs);
  console.log('Job statuses exist:', !!jobStatuses);
  console.log('Saved services exist:', !!savedServices);
  
  if (savedServices) {
    const services = JSON.parse(savedServices);
    console.log('\n🛠️ Saved Services Structure:');
    Object.entries(services).forEach(([jobId, data]) => {
      console.log(`Job ${jobId}:`, data);
      if (data.addedServices) {
        console.log(`  - ${data.addedServices.length} services`);
        console.log(`  - Total cost: ${data.totalAdditionalCost} kr`);
      }
    });
  }
  
  // 2. Fix function to ensure services display
  window.fixServiceDisplay = function() {
    // Force a state update by adding a timestamp
    const timestamp = Date.now();
    localStorage.setItem('service_display_fix_timestamp', timestamp.toString());
    
    // Dispatch storage event to trigger React re-render
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'service_display_fix_timestamp',
      newValue: timestamp.toString(),
      url: window.location.href
    }));
    
    console.log('✅ Display fix applied. If services still don\'t show, reload the page.');
  };
  
  // 3. Function to add test services if none exist
  window.addTestServicesIfNeeded = function(jobId = '2') {
    const saved = JSON.parse(localStorage.getItem('staff_jobs_with_services') || '{}');
    
    if (!saved[jobId] || !saved[jobId].addedServices || saved[jobId].addedServices.length === 0) {
      const testServices = [
        {
          id: `test-${Date.now()}-1`,
          serviceId: 'flyttkartonger',
          name: 'Flyttkartonger',
          quantity: 10,
          price: 79,
          addedAt: new Date().toISOString(),
          addedBy: 'Test User'
        },
        {
          id: `test-${Date.now()}-2`,
          serviceId: 'packtejp',
          name: 'Packtejp',
          quantity: 2,
          price: 99,
          addedAt: new Date().toISOString(),
          addedBy: 'Test User'
        }
      ];
      
      saved[jobId] = {
        addedServices: testServices,
        totalAdditionalCost: 988
      };
      
      localStorage.setItem('staff_jobs_with_services', JSON.stringify(saved));
      console.log('✅ Test services added to job', jobId);
      return true;
    }
    
    console.log('ℹ️ Services already exist for job', jobId);
    return false;
  };
  
  // 4. Function to fix job status
  window.fixJobStatusIssue = function(jobId = '2', newStatus = 'in_progress') {
    const statuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}');
    const oldStatus = statuses[jobId];
    statuses[jobId] = newStatus;
    localStorage.setItem('mockJobStatuses', JSON.stringify(statuses));
    console.log(`✅ Job ${jobId} status changed from "${oldStatus}" to "${newStatus}"`);
  };
  
  // 5. Function to inspect DOM for service rendering
  window.inspectServiceRendering = function() {
    const serviceElements = document.querySelectorAll('[class*="Tillagda tjänster"]');
    console.log('\n🔍 DOM Inspection:');
    console.log('Service sections found:', serviceElements.length);
    
    serviceElements.forEach((el, index) => {
      console.log(`Section ${index + 1}:`, {
        visible: el.offsetParent !== null,
        innerHTML: el.innerHTML.substring(0, 100) + '...',
        parentClasses: el.parentElement?.className
      });
    });
    
    // Check for job cards
    const jobCards = document.querySelectorAll('[class*="card"]');
    console.log('Job cards found:', jobCards.length);
  };
  
  // 6. Comprehensive fix function
  window.applyCompleteFix = function() {
    console.log('\n🚀 Applying complete fix...');
    
    // Fix any missing services
    const servicesAdded = addTestServicesIfNeeded('2');
    
    // Fix job status
    fixJobStatusIssue('2', 'in_progress');
    
    // Apply display fix
    fixServiceDisplay();
    
    // Wait a bit then reload
    if (servicesAdded) {
      console.log('⏳ Reloading in 2 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.log('✅ Fix applied. Reload the page to see changes.');
    }
  };
  
  // Run initial inspection
  console.log('\n💡 Available Commands:');
  console.log('fixServiceDisplay() - Force display update');
  console.log('addTestServicesIfNeeded() - Add test services if needed');
  console.log('fixJobStatusIssue() - Fix job status');
  console.log('inspectServiceRendering() - Check DOM for services');
  console.log('applyCompleteFix() - Apply all fixes at once');
  
  // Auto-check for issues
  if (savedServices) {
    const services = JSON.parse(savedServices);
    const hasServices = Object.values(services).some(s => s.addedServices && s.addedServices.length > 0);
    if (hasServices) {
      console.log('\n⚠️ Services exist in localStorage but may not be displaying.');
      console.log('Run applyCompleteFix() to fix the issue.');
    }
  }
})();