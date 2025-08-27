import puppeteer from 'puppeteer';

const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPPCDirect() {
    console.log('🚀 Testar PPC direkt...\n');
    
    let browser;
    let page;
    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1440, height: 900 }
        });

        page = await browser.newPage();
        
        // Logga konsoll-meddelanden
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Browser error:', msg.text());
            }
        });

        // Gå direkt till AI Marknadsföring
        console.log('📍 Går till AI Marknadsföring...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        await waitForTimeout(3000);
        
        // Lista alla knappar
        console.log('\n📋 Listar alla knappar på sidan:');
        const allButtons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(btn => ({
                text: btn.textContent?.trim(),
                visible: btn.offsetParent !== null,
                className: btn.className
            }));
        });
        
        allButtons.forEach((btn, idx) => {
            if (btn.text && btn.visible) {
                console.log(`  ${idx}: "${btn.text}"`);
            }
        });
        
        // Försök klicka på PPC med olika metoder
        console.log('\n🎯 Försöker klicka på PPC-fliken...');
        
        // Metod 1: Klicka via index
        const ppcClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const ppcButton = buttons.find(btn => btn.textContent?.trim() === 'PPC');
            if (ppcButton) {
                ppcButton.click();
                return true;
            }
            return false;
        });
        
        if (ppcClicked) {
            console.log('✅ Klickade på PPC-fliken');
            await waitForTimeout(3000);
        } else {
            console.log('❌ Kunde inte klicka på PPC');
        }
        
        // Ta screenshot
        await page.screenshot({ 
            path: 'ppc-direct-test.png',
            fullPage: true 
        });
        console.log('📸 Screenshot: ppc-direct-test.png');
        
        // Sök efter toggle-knappen igen
        console.log('\n🔍 Söker efter toggle-knapp...');
        const toggleButtons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim() || '';
                return text === 'Avancerad vy' || text === 'Enkel vy';
            }).map(btn => ({
                text: btn.textContent?.trim(),
                visible: btn.offsetParent !== null
            }));
        });
        
        if (toggleButtons.length > 0) {
            console.log('✅ Hittade toggle-knapp:', toggleButtons[0].text);
            
            // Försök klicka med evaluate
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const toggleBtn = buttons.find(btn => 
                    btn.textContent?.includes('Avancerad vy') || 
                    btn.textContent?.includes('Enkel vy')
                );
                if (toggleBtn) {
                    toggleBtn.click();
                }
            });
            
            console.log('✅ Klickade på toggle');
            await waitForTimeout(2000);
            
            await page.screenshot({ 
                path: 'ppc-after-toggle-direct.png',
                fullPage: true 
            });
            console.log('📸 Screenshot: ppc-after-toggle-direct.png');
            
        } else {
            console.log('❌ Ingen toggle-knapp hittad');
        }
        
        console.log('\n✅ Test slutfört!');
        
    } catch (error) {
        console.error('❌ Fel:', error);
    } finally {
        if (browser) {
            await waitForTimeout(3000);
            await browser.close();
        }
    }
}

testPPCDirect();