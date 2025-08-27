// Manual Debug Script - Run this in browser console on /staff/dashboard

console.log('🔍 MANUAL DEBUG SCRIPT\n');

// 1. Check if we're on the right page
console.log('1️⃣ PAGE CHECK');
console.log('  - URL:', window.location.href);
console.log('  - Title:', document.title);
console.log('  - Has job cards:', document.querySelectorAll('[class*="card"]').length > 0);

// 2. Check localStorage
console.log('\n2️⃣ LOCALSTORAGE CHECK');
const jobs = JSON.parse(localStorage.getItem('todaysJobs') || '[]');
const timeEntries = JSON.parse(localStorage.getItem('time_entries') || '[]');
const photos = JSON.parse(localStorage.getItem('staff_photos') || '[]');

console.log('  - Jobs:', jobs.length);
console.log('  - Time entries:', timeEntries.length);
console.log('  - Photos:', photos.length);

// 3. Check time tracking
console.log('\n3️⃣ TIME TRACKING CHECK');

// Find active job
const activeJob = jobs.find(j => j.status === 'in_progress');
if (activeJob) {
  console.log('  - Active job ID:', activeJob.id);
  
  // Find time entry
  const activeEntry = timeEntries.find(e => e.jobId === activeJob.id && e.status === 'started');
  if (activeEntry) {
    console.log('  - Active time entry:', activeEntry);
    const start = new Date(activeEntry.startTime);
    const now = new Date();
    const diff = now - start;
    const minutes = Math.floor(diff / 60000);
    console.log('  - Time elapsed:', minutes, 'minutes');
  } else {
    console.log('  - ❌ No active time entry');
  }
} else {
  console.log('  - ❌ No active job');
}

// 4. Check getCurrentWorkTime function
console.log('\n4️⃣ FUNCTION CHECK');
console.log('  - getCurrentWorkTime exists:', typeof getCurrentWorkTime !== 'undefined');
console.log('  - In window:', typeof window.getCurrentWorkTime !== 'undefined');

// Try to find it in modules
if (typeof getCurrentWorkTime === 'undefined') {
  console.log('  - Searching for function in page...');
  const scripts = Array.from(document.querySelectorAll('script'));
  const hasFunction = scripts.some(s => s.textContent && s.textContent.includes('getCurrentWorkTime'));
  console.log('  - Found in scripts:', hasFunction);
}

// 5. Check Supabase
console.log('\n5️⃣ SUPABASE CHECK');
console.log('  - process.env exists:', typeof process !== 'undefined');
console.log('  - window.__env exists:', typeof window.__env !== 'undefined');
console.log('  - Supabase in window:', typeof window.supabase !== 'undefined');

// Check for env variables in different places
const possibleEnvLocations = [
  'window.NEXT_PUBLIC_SUPABASE_URL',
  'window.__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_SUPABASE_URL',
  'window.env?.NEXT_PUBLIC_SUPABASE_URL'
];

for (const location of possibleEnvLocations) {
  try {
    const value = eval(location);
    if (value) {
      console.log(`  - Found at ${location}:`, value ? '✅' : '❌');
    }
  } catch (e) {
    // Skip
  }
}

// 6. Test time display update
console.log('\n6️⃣ TIME DISPLAY TEST');
console.log('  - Starting manual time update test...');

// Find time display elements
const timeDisplays = Array.from(document.querySelectorAll('*')).filter(el => {
  const text = el.textContent || '';
  return text.includes('Uppdrag pågår') || 
         text.includes('min') && text.includes('0') ||
         text.includes('Precis startad');
});

console.log('  - Time display elements found:', timeDisplays.length);
timeDisplays.forEach((el, i) => {
  console.log(`    ${i + 1}. "${el.textContent.trim()}"`);
});

// 7. Test photo upload
console.log('\n7️⃣ PHOTO UPLOAD TEST');

// Simulate photo save
const testPhoto = {
  id: `test_${Date.now()}`,
  dataUrl: 'data:image/jpeg;base64,test',
  serviceType: 'Test',
  timestamp: new Date().toISOString(),
  fileSize: 1000,
  publicUrl: null // Would be set by Supabase
};

const currentPhotos = JSON.parse(localStorage.getItem('staff_photos') || '[]');
currentPhotos.push(testPhoto);
localStorage.setItem('staff_photos', JSON.stringify(currentPhotos));

console.log('  - Test photo saved to localStorage');
console.log('  - Total photos now:', currentPhotos.length);

// 8. Mobile scroll test
console.log('\n8️⃣ MOBILE SCROLL TEST');

// Find category container
const categoryContainers = Array.from(document.querySelectorAll('*')).filter(el => {
  return el.className && el.className.includes && 
         (el.className.includes('category') || el.className.includes('scroll'));
});

console.log('  - Category containers found:', categoryContainers.length);
categoryContainers.forEach((el, i) => {
  const style = window.getComputedStyle(el);
  console.log(`    ${i + 1}. Class: ${el.className}`);
  console.log(`       Overflow-x: ${style.overflowX}`);
  console.log(`       Scrollable: ${el.scrollWidth > el.clientWidth}`);
});

console.log('\n✅ Debug script complete!');
console.log('\n📝 NEXT STEPS:');
console.log('1. If time shows 0 min, check console for "Updating time" logs');
console.log('2. If no Supabase URL found, add to .env.local and restart Next.js');
console.log('3. For mobile scroll, check if overflow-x is "auto" on category container');

// Export debug data
window.debugData = {
  jobs,
  timeEntries,
  photos,
  activeJob,
  timeDisplays: timeDisplays.map(el => el.textContent.trim())
};

console.log('\n💾 Debug data saved to window.debugData');