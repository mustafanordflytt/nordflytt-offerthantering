// Kontrollera build-status
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkBuildStatus() {
  console.log('=== Kontrollerar Next.js Build Status ===\n');
  
  try {
    // Kör en build för att se om det finns fel
    console.log('Kör produktions-build...');
    const { stdout, stderr } = await execAsync('npm run build', { 
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    console.log('Build slutförd!');
    
    // Kolla efter varningar eller fel
    if (stderr) {
      console.log('\nVarningar/Fel:');
      console.log(stderr);
    }
    
    // Visa build-output
    if (stdout.includes('error') || stdout.includes('Error')) {
      console.log('\nFel hittade i build:');
      const lines = stdout.split('\n');
      lines.forEach(line => {
        if (line.toLowerCase().includes('error')) {
          console.log('❌', line);
        }
      });
    } else {
      console.log('\n✅ Build lyckades utan fel!');
    }
    
  } catch (error) {
    console.error('\n❌ Build misslyckades:');
    console.error(error.message);
    
    // Visa specifika fel
    if (error.stdout) {
      const lines = error.stdout.split('\n');
      lines.forEach(line => {
        if (line.includes('error') || line.includes('Error')) {
          console.log(line);
        }
      });
    }
  }
}

checkBuildStatus();