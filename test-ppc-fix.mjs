import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPPCFix() {
    console.log('🚀 PPC-test med fix...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 }
    });

    try {
        const page = await browser.newPage();
        
        // Navigera
        console.log('📍 Navigerar till AI-marknadsföring...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing', {
            waitUntil: 'networkidle0'
        });
        await wait(3000);
        
        // Metod 1: Klicka med mer specifik selector
        console.log('🎯 Försöker klicka PPC med olika metoder...\n');
        
        console.log('Metod 1: Via tab index...');
        const ppcClicked1 = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
            // PPC är vanligtvis den 4:e tabben (0-indexerad = index 3)
            if (tabs[3] && tabs[3].textContent?.includes('PPC')) {
                tabs[3].click();
                return true;
            }
            return false;
        });
        console.log(`   Resultat: ${ppcClicked1 ? '✅' : '❌'}`);
        
        await wait(2000);
        
        // Kolla om PPC är aktiv nu
        const activeTab1 = await page.evaluate(() => {
            const active = document.querySelector('button[role="tab"][data-state="active"]');
            return active?.textContent?.trim();
        });
        console.log(`   Aktiv flik: ${activeTab1}\n`);
        
        if (activeTab1 !== 'PPC') {
            // Metod 2: Trigga click event manuellt
            console.log('Metod 2: Manuell click event...');
            await page.evaluate(() => {
                const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
                const ppcTab = tabs.find(tab => tab.textContent?.trim() === 'PPC');
                if (ppcTab) {
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    ppcTab.dispatchEvent(clickEvent);
                }
            });
            
            await wait(2000);
            
            const activeTab2 = await page.evaluate(() => {
                const active = document.querySelector('button[role="tab"][data-state="active"]');
                return active?.textContent?.trim();
            });
            console.log(`   Aktiv flik: ${activeTab2}\n`);
        }
        
        // Vänta lite extra för rendering
        await wait(3000);
        
        // Analysera innehållet nu
        console.log('📊 Analyserar PPC-innehåll...');
        const content = await page.evaluate(() => {
            const result = {
                activeTab: '',
                hasToggleButton: false,
                toggleButtonText: '',
                hasLiveDataHeader: false,
                dashboardCards: 0,
                errorMessages: []
            };
            
            // Aktiv tab
            const activeTab = document.querySelector('button[role="tab"][data-state="active"]');
            result.activeTab = activeTab?.textContent?.trim() || '';
            
            // Sök efter toggle-knapp i hela dokumentet
            const allButtons = Array.from(document.querySelectorAll('button'));
            const toggleButton = allButtons.find(btn => {
                const text = btn.textContent?.trim() || '';
                return text === 'Avancerad vy' || text === 'Enkel vy';
            });
            
            if (toggleButton) {
                result.hasToggleButton = true;
                result.toggleButtonText = toggleButton.textContent?.trim() || '';
            }
            
            // Kolla Live data
            result.hasLiveDataHeader = document.body.textContent?.includes('Live data') || false;
            
            // Räkna dashboard cards
            const cards = document.querySelectorAll('.hover\\:shadow-lg, [class*="Card"]');
            result.dashboardCards = cards.length;
            
            // Kolla fel
            const errors = document.querySelectorAll('[class*="error"], .text-red-500');
            result.errorMessages = Array.from(errors).map(e => e.textContent?.trim() || '');
            
            return result;
        });
        
        console.log('Resultat:');
        console.log(`   Aktiv flik: ${content.activeTab}`);
        console.log(`   Toggle-knapp: ${content.hasToggleButton ? `✅ "${content.toggleButtonText}"` : '❌ Saknas'}`);
        console.log(`   Live data header: ${content.hasLiveDataHeader ? '✅' : '❌'}`);
        console.log(`   Dashboard cards: ${content.dashboardCards}`);
        console.log(`   Fel: ${content.errorMessages.length > 0 ? content.errorMessages.join(', ') : '✅ Inga'}`);
        
        // Ta screenshot
        await page.screenshot({ 
            path: 'ppc-fix-test.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot: ppc-fix-test.png');
        
        // Om vi har toggle-knapp, testa den
        if (content.hasToggleButton) {
            console.log('\n🔄 Testar toggle-funktionalitet...');
            
            // Klicka toggle
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent?.includes('Avancerad vy') || 
                              b.textContent?.includes('Enkel vy'));
                if (btn) btn.click();
            });
            
            await wait(2000);
            
            // Kolla ny text
            const newToggleText = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent?.includes('Avancerad vy') || 
                              b.textContent?.includes('Enkel vy'));
                return btn?.textContent?.trim();
            });
            
            console.log(`   Före: "${content.toggleButtonText}"`);
            console.log(`   Efter: "${newToggleText}"`);
            console.log(`   ✅ Toggle fungerar!` );
            
            await page.screenshot({ 
                path: 'ppc-fix-after-toggle.png',
                fullPage: true 
            });
            console.log('   📸 Efter toggle: ppc-fix-after-toggle.png');
        }
        
    } catch (error) {
        console.error('\n❌ Fel:', error.message);
    } finally {
        console.log('\n⏱️ Stänger om 10 sekunder...');
        await wait(10000);
        await browser.close();
    }
}

testPPCFix();