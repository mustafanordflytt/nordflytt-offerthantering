import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPPCSimple() {
    console.log('🚀 Enkel PPC-test...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Navigera
        console.log('1️⃣ Navigerar till AI-marknadsföring...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing');
        await wait(5000); // Vänta längre
        
        // Klicka PPC
        console.log('2️⃣ Klickar på PPC-fliken...');
        await page.click('button:has-text("PPC")', { delay: 100 }).catch(() => {
            // Fallback om :has-text inte fungerar
            return page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent === 'PPC');
                if (btn) btn.click();
            });
        });
        
        await wait(5000); // Vänta längre för rendering
        
        // Analysera innehåll
        console.log('3️⃣ Analyserar innehåll...');
        const analysis = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                title: document.title,
                hasContent: false,
                toggleButton: null,
                errorText: null
            };
            
            // Kolla om det finns innehåll
            const contentDiv = document.querySelector('[class*="space-y-6"]');
            result.hasContent = !!contentDiv && contentDiv.children.length > 0;
            
            // Hitta toggle-knapp
            const buttons = Array.from(document.querySelectorAll('button'));
            const toggle = buttons.find(b => 
                b.textContent?.includes('Avancerad vy') || 
                b.textContent?.includes('Enkel vy')
            );
            if (toggle) {
                result.toggleButton = toggle.textContent?.trim();
            }
            
            // Kolla efter fel
            const errorEl = document.querySelector('[class*="error"], [role="alert"]');
            if (errorEl) {
                result.errorText = errorEl.textContent;
            }
            
            return result;
        });
        
        console.log('📊 Resultat:');
        console.log(`   URL: ${analysis.url}`);
        console.log(`   Titel: ${analysis.title}`);
        console.log(`   Har innehåll: ${analysis.hasContent ? '✅ Ja' : '❌ Nej'}`);
        console.log(`   Toggle-knapp: ${analysis.toggleButton || '❌ Ej hittad'}`);
        console.log(`   Fel: ${analysis.errorText || '✅ Inga fel'}`);
        
        // Ta screenshot
        await page.screenshot({ 
            path: 'ppc-simple-test.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot: ppc-simple-test.png');
        
        // Om toggle finns, testa den
        if (analysis.toggleButton) {
            console.log('\n4️⃣ Testar toggle...');
            
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent?.includes('Avancerad vy') || 
                              b.textContent?.includes('Enkel vy'));
                if (btn) btn.click();
            });
            
            await wait(3000);
            
            const newToggleText = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent?.includes('Avancerad vy') || 
                              b.textContent?.includes('Enkel vy'));
                return btn?.textContent?.trim();
            });
            
            console.log(`   Före: "${analysis.toggleButton}"`);
            console.log(`   Efter: "${newToggleText}"`);
            console.log(`   Fungerar: ${newToggleText !== analysis.toggleButton ? '✅ Ja' : '❌ Nej'}`);
            
            await page.screenshot({ 
                path: 'ppc-toggle-test.png',
                fullPage: true 
            });
            console.log('   📸 Screenshot: ppc-toggle-test.png');
        }
        
        console.log('\n✅ Test slutfört!');
        
    } catch (error) {
        console.error('❌ Fel:', error.message);
    } finally {
        await wait(5000);
        await browser.close();
    }
}

testPPCSimple();