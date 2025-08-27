# GPS Modal Timing Fix

## Current Issue
The GPS modal appears when ending a job instead of when starting it. This is confusing UX.

## Root Cause
In the `handleJobStart` function:
1. It tries to start time tracking with GPS validation
2. If GPS fails, it falls back to `startTimeTrackingWithoutGPS` which bypasses the modal
3. But when ending the job, `stopTimeTracking` validates location and shows GPS modal

## Fix Applied
1. Added `lastRefresh` state to force UI updates after status changes
2. Added useEffect to reload jobs after status updates
3. Added `lastUpdated` timestamp to job objects to ensure React detects changes

## Remaining Issues to Fix

### 1. GPS Modal at Wrong Time
The GPS modal logic needs to be adjusted:
- Show GPS modal prominently when STARTING a job
- Skip GPS validation when ENDING a job (or make it optional)

### 2. Status Badge Inconsistency  
The job detail modal shows "Uppdrag pågår" but corner badge shows "Kommande"
- Need to ensure all status displays use the same source of truth

### 3. Visual Feedback
- Add loading states on buttons during async operations
- Add success animations when status changes
- Consider using a proper toast library instead of manual DOM manipulation

## Testing
Run the app and:
1. Click on a job
2. Start it - should show GPS modal (if location not available)
3. Dashboard should update immediately showing new status
4. Open job again - all status indicators should be consistent
5. End job - should NOT show GPS modal again