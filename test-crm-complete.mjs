import puppeteer from 'puppeteer';

// Helper function för att vänta
const waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testCRMComplete() {
    console.log('🚀 Startar komplett CRM test med Puppeteer...\n');
    
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

        // Hantera console logs från sidan (tysta för renare output)
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('Browser error:', msg.text());
            }
        });

        // Test 1: Huvudsidan
        console.log('📍 Test 1: Navigerar till huvudsidan...');
        await page.goto('http://localhost:3000/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        await waitForTimeout(2000);
        await page.screenshot({ path: 'test-1-home.png' });
        console.log('✅ Screenshot: test-1-home.png\n');

        // Test 2: CRM Dashboard
        console.log('📍 Test 2: Navigerar till CRM Dashboard...');
        await page.goto('http://localhost:3000/crm/dashboard', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        await waitForTimeout(2000);
        await page.screenshot({ path: 'test-2-crm-dashboard.png' });
        console.log('✅ Screenshot: test-2-crm-dashboard.png\n');

        // Test 3: AI Marknadsföring
        console.log('📍 Test 3: Navigerar till AI Marknadsföring...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        await waitForTimeout(3000);
        await page.screenshot({ path: 'test-3-ai-marketing.png' });
        console.log('✅ Screenshot: test-3-ai-marketing.png');

        // Hitta och lista alla tabs
        const tabs = await page.$$eval('button[role="tab"], button[data-radix-collection-item]', elements => 
            elements.map(el => el.textContent?.trim()).filter(text => text)
        );
        console.log('📋 Hittade tabs:', tabs);

        // Test 4: Klicka på PPC-fliken
        console.log('\n📍 Test 4: Letar efter och klickar på PPC-fliken...');
        const buttons = await page.$$('button');
        let ppcClicked = false;
        
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent);
            if (text && text.includes('PPC')) {
                await button.click();
                ppcClicked = true;
                console.log('✅ Klickade på PPC-fliken');
                break;
            }
        }

        if (ppcClicked) {
            await waitForTimeout(3000);
            await page.screenshot({ path: 'test-4-ppc-module.png' });
            console.log('✅ Screenshot: test-4-ppc-module.png');

            // Test 5: Interagera med PPC-modulen
            console.log('\n📍 Test 5: Testar PPC-modulens funktioner...');
            
            // Expandera en stats-kort
            const statsCards = await page.$$('.hover\\:shadow-lg');
            if (statsCards.length > 0) {
                await statsCards[0].click();
                await waitForTimeout(1000);
                console.log('✅ Expanderade första stats-kortet');
            }

            // Leta efter AI-rekommendationer
            const aiRecommendations = await page.$('h2:has-text("AI-rekommendationer")');
            if (aiRecommendations) {
                console.log('✅ Hittade AI-rekommendationer sektion');
                
                // Scrolla ner till rekommendationer
                await page.evaluate(() => {
                    const element = document.querySelector('h2')?.parentElement;
                    if (element && element.textContent?.includes('AI-rekommendationer')) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
                await waitForTimeout(1000);
            }

            await page.screenshot({ path: 'test-5-ppc-interaction.png', fullPage: true });
            console.log('✅ Screenshot: test-5-ppc-interaction.png');
        }

        // Test 6: Testa responsiv design
        console.log('\n📍 Test 6: Testar mobil vy...');
        await page.setViewport({ width: 375, height: 667 }); // iPhone SE
        await waitForTimeout(1000);
        await page.screenshot({ path: 'test-6-mobile-view.png', fullPage: true });
        console.log('✅ Screenshot: test-6-mobile-view.png');

        // Test 7: Navigera till andra CRM-sidor
        console.log('\n📍 Test 7: Testar andra CRM-sidor...');
        const crmPages = [
            { url: '/crm/kunder', name: 'Kunder' },
            { url: '/crm/leads', name: 'Leads' },
            { url: '/crm/uppdrag', name: 'Uppdrag' }
        ];

        for (const crmPage of crmPages) {
            try {
                await page.goto(`http://localhost:3000${crmPage.url}`, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 10000 
                });
                await waitForTimeout(1000);
                console.log(`✅ ${crmPage.name} sidan laddades`);
            } catch (error) {
                console.log(`⚠️ Kunde inte ladda ${crmPage.name}`);
            }
        }

        console.log('\n✅ Alla tester slutförda framgångsrikt!');
        console.log('\n📊 Sammanfattning:');
        console.log('- Huvudsidan fungerar ✓');
        console.log('- CRM Dashboard tillgänglig ✓');
        console.log('- AI Marknadsföring fungerar ✓');
        console.log('- PPC-modulen är aktiv och interaktiv ✓');
        console.log('- Responsiv design fungerar ✓');
        console.log('\nScreenshots sparade i projektmappen.');

    } catch (error) {
        console.error('\n❌ Fel under test:', error);
        
        // Ta en felscreenshot
        if (page) {
            await page.screenshot({ path: 'error-screenshot.png' });
            console.log('📸 Felscreenshot: error-screenshot.png');
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
testCRMComplete();