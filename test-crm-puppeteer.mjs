import puppeteer from 'puppeteer';

// Helper function för att vänta
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testCRM() {
    console.log('🚀 Startar CRM test med Puppeteer...');
    
    let browser;
    let page;
    try {
        // Starta browser
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: {
                width: 1280,
                height: 720
            },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();

        // Hantera console logs från sidan
        page.on('console', msg => console.log('Browser console:', msg.text()));
        page.on('error', err => console.error('Browser error:', err));
        page.on('pageerror', err => console.error('Page error:', err));

        // Gå till CRM
        console.log('📍 Navigerar till CRM...');
        try {
            await page.goto('http://localhost:3000/crm', { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
        } catch (error) {
            console.log('⚠️ Kunde inte ladda /crm, testar root...');
            await page.goto('http://localhost:3000/', { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
        }

        // Vänta lite så sidan hinner ladda
        await waitForTimeout(3000);

        // Ta screenshot
        await page.screenshot({ 
            path: 'crm-root-screenshot.png',
            fullPage: true 
        });
        console.log('📸 Screenshot tagen: crm-root-screenshot.png');

        // Försök navigera till AI-marknadsföring direkt
        console.log('🎯 Navigerar till AI-marknadsföring...');
        try {
            await page.goto('http://localhost:3000/crm/ai-marknadsforing', { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });

            // Vänta lite så sidan hinner ladda
            await waitForTimeout(5000);

            // Ta screenshot av AI-marknadsföring
            await page.screenshot({ 
                path: 'ai-marketing-screenshot.png',
                fullPage: true 
            });
            console.log('📸 Screenshot tagen: ai-marketing-screenshot.png');

            // Kontrollera om PPC-tabben finns med olika selektorer
            const ppcSelectors = [
                'button:has-text("PPC")',
                '[role="tab"]:has-text("PPC")',
                'button[data-state="inactive"]:has-text("PPC")',
                'button[data-state="active"]:has-text("PPC")'
            ];
            
            let ppcFound = false;
            for (const selector of ppcSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        console.log(`✅ PPC-fliken hittades med selector: ${selector}`);
                        await element.click();
                        ppcFound = true;
                        break;
                    }
                } catch (e) {
                    // Fortsätt med nästa selector
                }
            }

            if (!ppcFound) {
                // Försök hitta genom text
                const buttons = await page.$$('button');
                for (const button of buttons) {
                    const text = await button.evaluate(el => el.textContent);
                    if (text && text.includes('PPC')) {
                        console.log('✅ PPC-fliken hittades genom textmatchning!');
                        await button.click();
                        ppcFound = true;
                        break;
                    }
                }
            }

            if (ppcFound) {
                await waitForTimeout(3000);

                // Ta screenshot av PPC-modulen
                await page.screenshot({ 
                    path: 'ppc-module-screenshot.png',
                    fullPage: true 
                });
                console.log('📸 Screenshot tagen av PPC-modulen: ppc-module-screenshot.png');
            } else {
                console.log('❌ PPC-fliken hittades inte');
                
                // Lista alla knappar för debugging
                const buttonTexts = await page.$$eval('button', buttons => 
                    buttons.map(btn => btn.textContent?.trim()).filter(text => text)
                );
                console.log('Alla knappar på sidan:', buttonTexts);
            }

        } catch (error) {
            console.error('❌ Kunde inte navigera till AI-marknadsföring:', error.message);
        }

        console.log('✅ Test slutfört!');

    } catch (error) {
        console.error('❌ Fel under test:', error);
        
        // Ta en felscreenshot
        if (page) {
            await page.screenshot({ path: 'error-screenshot.png' });
            console.log('📸 Felscreenshot tagen: error-screenshot.png');
        }
    } finally {
        if (browser) {
            await waitForTimeout(2000); // Vänta lite innan vi stänger
            await browser.close();
        }
    }
}

// Kör testet
testCRM();