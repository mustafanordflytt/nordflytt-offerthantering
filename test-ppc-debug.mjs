import puppeteer from 'puppeteer';

const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugPPC() {
    console.log('🔍 Debug PPC-modul...\n');
    
    let browser;
    let page;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1440, height: 900 }
        });

        page = await browser.newPage();
        
        // Logga alla konsoll-meddelanden
        page.on('console', msg => {
            console.log(`Browser [${msg.type()}]:`, msg.text());
        });
        
        page.on('error', err => {
            console.error('Page error:', err);
        });

        // Gå till AI Marknadsföring
        console.log('📍 Navigerar...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing', { 
            waitUntil: 'networkidle2'
        });
        
        await waitForTimeout(2000);
        
        // Klicka på PPC
        console.log('\n🎯 Klickar på PPC...');
        await page.evaluate(() => {
            const ppcButton = Array.from(document.querySelectorAll('button'))
                .find(btn => btn.textContent?.trim() === 'PPC');
            if (ppcButton) ppcButton.click();
        });
        
        await waitForTimeout(3000);
        
        // Analysera sidan
        console.log('\n📊 Analyserar PPC-innehåll...');
        
        const pageContent = await page.evaluate(() => {
            const result = {
                hasLiveDataHeader: false,
                toggleButtonText: null,
                mainCards: [],
                errorMessages: [],
                divCount: document.querySelectorAll('div').length,
                buttonCount: document.querySelectorAll('button').length
            };
            
            // Sök efter Live data header
            const liveDataDiv = Array.from(document.querySelectorAll('div'))
                .find(div => div.textContent?.includes('Live data'));
            result.hasLiveDataHeader = !!liveDataDiv;
            
            // Sök efter toggle-knapp
            const toggleButton = Array.from(document.querySelectorAll('button'))
                .find(btn => {
                    const text = btn.textContent?.trim() || '';
                    return text === 'Avancerad vy' || text === 'Enkel vy';
                });
            if (toggleButton) {
                result.toggleButtonText = toggleButton.textContent?.trim();
            }
            
            // Hitta huvudkort
            const cards = document.querySelectorAll('.hover\\:shadow-lg');
            result.mainCards = Array.from(cards).slice(0, 4).map(card => 
                card.querySelector('.text-sm.font-medium')?.textContent?.trim() || 'Unknown'
            );
            
            // Kolla efter felmeddelanden
            const errors = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"]'));
            result.errorMessages = errors.map(el => el.textContent?.trim() || '');
            
            return result;
        });
        
        console.log('Resultat:', JSON.stringify(pageContent, null, 2));
        
        // Ta detaljerad screenshot
        await page.screenshot({ 
            path: 'ppc-debug-full.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot: ppc-debug-full.png');
        
        // Om toggle-knapp finns, klicka på den
        if (pageContent.toggleButtonText) {
            console.log(`\n✅ Toggle-knapp hittad: "${pageContent.toggleButtonText}"`);
            
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent?.includes('Avancerad vy') || b.textContent?.includes('Enkel vy'));
                if (btn) btn.click();
            });
            
            await waitForTimeout(2000);
            
            // Kolla om något ändrades
            const afterToggle = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent?.includes('Avancerad vy') || b.textContent?.includes('Enkel vy'));
                return btn?.textContent?.trim();
            });
            
            console.log(`Efter toggle: "${afterToggle}"`);
            
            await page.screenshot({ 
                path: 'ppc-debug-after-toggle.png',
                fullPage: true 
            });
            console.log('📸 Screenshot: ppc-debug-after-toggle.png');
        }
        
        console.log('\n✅ Debug slutförd!');
        
    } catch (error) {
        console.error('❌ Fel:', error);
    } finally {
        if (browser) {
            await waitForTimeout(5000);
            await browser.close();
        }
    }
}

debugPPC();