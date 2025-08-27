// Fix script for mobile service addition and status update issues

// Function to fix service addition
function fixServiceAddition() {
  // Get current jobs
  const mockJobs = localStorage.getItem('mockJobs');
  if (!mockJobs) {
    console.log('No mock jobs found');
    return;
  }
  
  const jobs = JSON.parse(mockJobs);
  console.log('Current jobs:', jobs);
  
  // Check saved services
  const savedServices = localStorage.getItem('staff_jobs_with_services');
  console.log('Saved services:', savedServices);
  
  // Check job statuses
  const jobStatuses = localStorage.getItem('mockJobStatuses');
  console.log('Job statuses:', jobStatuses);
  
  // Fix any missing data
  if (savedServices) {
    const services = JSON.parse(savedServices);
    Object.keys(services).forEach(jobId => {
      console.log(`Job ${jobId} has services:`, services[jobId]);
    });
  }
}

// Function to manually add test services
function addTestServices(jobId) {
  const testServices = [
    {
      id: `added-${Date.now()}-1`,
      serviceId: 'flyttkartonger',
      name: 'Flyttkartonger',
      quantity: 10,
      price: 79,
      addedAt: new Date().toISOString(),
      addedBy: 'Test User'
    },
    {
      id: `added-${Date.now()}-2`,
      serviceId: 'packtejp',
      name: 'Packtejp',
      quantity: 2,
      price: 99,
      addedAt: new Date().toISOString(),
      addedBy: 'Test User'
    }
  ];
  
  const totalCost = testServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  
  // Save to localStorage
  const savedJobs = JSON.parse(localStorage.getItem('staff_jobs_with_services') || '{}');
  savedJobs[jobId] = {
    addedServices: testServices,
    totalAdditionalCost: totalCost
  };
  localStorage.setItem('staff_jobs_with_services', JSON.stringify(savedJobs));
  
  console.log(`Added test services to job ${jobId}, total cost: ${totalCost} kr`);
  console.log('Reload the page to see the changes');
}

// Function to fix job status
function fixJobStatus(jobId, newStatus) {
  const jobStatuses = JSON.parse(localStorage.getItem('mockJobStatuses') || '{}');
  jobStatuses[jobId] = newStatus;
  localStorage.setItem('mockJobStatuses', JSON.stringify(jobStatuses));
  console.log(`Updated job ${jobId} status to: ${newStatus}`);
  console.log('Reload the page to see the changes');
}

// Run diagnostics
console.log('=== Mobile Service Fix Diagnostics ===');
fixServiceAddition();

console.log('\n=== Instructions ===');
console.log('To add test services: addTestServices("2")');
console.log('To fix job status: fixJobStatus("2", "in_progress")');
console.log('Then reload the page');

// Make functions available globally
window.addTestServices = addTestServices;
window.fixJobStatus = fixJobStatus;