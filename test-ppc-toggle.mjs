import puppeteer from 'puppeteer';

// Helper function för att vänta
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPPCToggle() {
    console.log('🚀 Testar PPC toggle-funktionalitet...\n');
    
    let browser;
    let page;
    try {
        // Starta browser
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: {
                width: 1440,
                height: 900
            },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();

        // Gå direkt till AI Marknadsföring
        console.log('📍 Navigerar till AI Marknadsföring...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        await waitForTimeout(3000);

        // Klicka på PPC-fliken
        console.log('🎯 Klickar på PPC-fliken...');
        const buttons = await page.$$('button');
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent);
            if (text && text.includes('PPC')) {
                await button.click();
                console.log('✅ PPC-fliken öppnad');
                break;
            }
        }

        await waitForTimeout(2000);

        // Ta screenshot i enkel vy
        await page.screenshot({ 
            path: 'ppc-simple-view.png',
            fullPage: true 
        });
        console.log('📸 Screenshot: ppc-simple-view.png (Enkel vy)');

        // Hitta toggle-knappen
        console.log('\n🔄 Letar efter toggle-knappen...');
        
        // Hitta knappen genom att söka efter text
        const toggleButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => 
                btn.textContent?.includes('Avancerad vy') || 
                btn.textContent?.includes('Enkel vy')
            );
        });
        
        const buttonText = await page.evaluate(btn => btn?.textContent, toggleButton);
        
        if (buttonText) {
            console.log(`✅ Hittade toggle-knapp: "${buttonText.trim()}"`);
            
            // Klicka på toggle
            await toggleButton.click();
            console.log('✅ Klickade på toggle-knappen');
            
            await waitForTimeout(2000);
            
            // Ta screenshot i ny vy
            await page.screenshot({ 
                path: 'ppc-after-toggle.png',
                fullPage: true 
            });
            console.log('📸 Screenshot: ppc-after-toggle.png');
            
            // Kolla om knappen ändrats
            const newButtonText = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => 
                    b.textContent?.includes('Avancerad vy') || 
                    b.textContent?.includes('Enkel vy')
                );
                return btn?.textContent;
            });
            
            if (newButtonText && newButtonText !== buttonText) {
                console.log(`✅ Toggle fungerar! Knappen visar nu "${newButtonText.trim()}"`);
                
                // Toggle tillbaka
                const newToggleButton = await page.evaluateHandle(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.find(btn => 
                        btn.textContent?.includes('Avancerad vy') || 
                        btn.textContent?.includes('Enkel vy')
                    );
                });
                
                await newToggleButton.click();
                await waitForTimeout(1000);
                console.log('✅ Togglat tillbaka');
                
                await page.screenshot({ 
                    path: 'ppc-toggled-back.png',
                    fullPage: true 
                });
                console.log('📸 Screenshot: ppc-toggled-back.png');
            } else {
                console.log('⚠️ Knappen ändrades inte - toggle kanske inte fungerar');
            }
        } else {
            console.log('❌ Kunde inte hitta toggle-knappen');
        }

        // Analysera skillnader
        console.log('\n📊 Analyserar vyer...');
        
        // Kolla antal synliga element
        const visibleCards = await page.$$eval('.space-y-4 > div', elements => elements.length);
        console.log(`Antal synliga kort: ${visibleCards}`);
        
        // Kolla om avancerade element finns
        const hasAdvancedElements = await page.evaluate(() => {
            const advancedSelectors = [
                'table', // Kampanjtabell
                'text:has-text("A/B-tester")',
                'text:has-text("Konkurrentaktivitet")'
            ];
            
            for (const selector of advancedSelectors) {
                if (document.querySelector(selector)) {
                    return true;
                }
            }
            return false;
        });
        
        console.log(`Avancerade element synliga: ${hasAdvancedElements ? 'Ja' : 'Nej'}`);
        
        console.log('\n✅ Test slutfört!');
        
    } catch (error) {
        console.error('❌ Fel under test:', error);
        
        if (page) {
            await page.screenshot({ path: 'ppc-toggle-error.png' });
            console.log('📸 Felscreenshot: ppc-toggle-error.png');
        }
    } finally {
        if (browser) {
            console.log('\n🔚 Stänger browser om 5 sekunder...');
            await waitForTimeout(5000);
            await browser.close();
        }
    }
}

// Kör testet
testPPCToggle();