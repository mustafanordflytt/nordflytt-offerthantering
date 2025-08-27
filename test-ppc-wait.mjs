import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPPCWithWait() {
    console.log('🚀 PPC-test med explicit väntande...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 }
    });

    try {
        const page = await browser.newPage();
        
        // Logga konsoll för debugging
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warn') {
                console.log(`[${msg.type()}]`, msg.text());
            }
        });
        
        // Steg 1: Gå till sidan
        console.log('📍 Navigerar...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing', {
            waitUntil: 'networkidle0'
        });
        console.log('✅ Sidan laddad');
        
        // Steg 2: Vänta på att tabs renderas
        console.log('⏳ Väntar på tabs...');
        await page.waitForSelector('button[role="tab"]', { timeout: 10000 });
        console.log('✅ Tabs hittade');
        
        // Steg 3: Klicka på PPC
        console.log('🎯 Klickar på PPC...');
        const clicked = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
            const ppcTab = tabs.find(tab => tab.textContent?.trim() === 'PPC');
            if (ppcTab) {
                ppcTab.click();
                return true;
            }
            return false;
        });
        
        if (!clicked) {
            throw new Error('Kunde inte hitta PPC-fliken');
        }
        console.log('✅ PPC-flik klickad');
        
        // Steg 4: Vänta på innehåll
        console.log('⏳ Väntar på PPC-innehåll...');
        await wait(5000); // Ge React tid att rendera
        
        // Steg 5: Analysera sidan djupare
        console.log('🔍 Analyserar PPC-innehåll...');
        const analysis = await page.evaluate(() => {
            const result = {
                activeTab: null,
                visibleContent: [],
                allButtons: [],
                hasLiveData: false,
                toggleButton: null
            };
            
            // Hitta aktiv tab
            const activeTab = document.querySelector('button[role="tab"][data-state="active"]');
            result.activeTab = activeTab?.textContent?.trim();
            
            // Hitta synligt innehåll
            const contentPanels = document.querySelectorAll('[role="tabpanel"]');
            contentPanels.forEach(panel => {
                if (panel.getAttribute('data-state') === 'active' || 
                    panel.style.display !== 'none') {
                    const children = panel.children.length;
                    const text = panel.textContent?.substring(0, 100);
                    result.visibleContent.push({ children, text });
                }
            });
            
            // Lista alla knappar
            const buttons = Array.from(document.querySelectorAll('button'));
            result.allButtons = buttons
                .map(btn => btn.textContent?.trim())
                .filter(text => text && text.length > 0)
                .slice(0, 20); // Bara första 20
            
            // Kolla Live data
            result.hasLiveData = document.body.textContent?.includes('Live data') || false;
            
            // Hitta toggle specifikt
            const toggleBtn = buttons.find(btn => {
                const text = btn.textContent?.trim() || '';
                return text === 'Avancerad vy' || text === 'Enkel vy';
            });
            result.toggleButton = toggleBtn?.textContent?.trim() || null;
            
            return result;
        });
        
        console.log('\n📊 Detaljerad analys:');
        console.log('   Aktiv flik:', analysis.activeTab);
        console.log('   Synligt innehåll:', analysis.visibleContent.length, 'paneler');
        console.log('   Live data header:', analysis.hasLiveData ? '✅' : '❌');
        console.log('   Toggle-knapp:', analysis.toggleButton || '❌ Ej hittad');
        console.log('\n   Alla knappar:');
        analysis.allButtons.forEach((btn, idx) => {
            console.log(`     ${idx + 1}. "${btn}"`);
        });
        
        // Screenshot
        await page.screenshot({ 
            path: 'ppc-wait-test.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot: ppc-wait-test.png');
        
        // Om toggle finns, testa
        if (analysis.toggleButton) {
            console.log('\n🔄 Testar toggle...');
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent?.includes('Avancerad vy') || 
                              b.textContent?.includes('Enkel vy'));
                if (btn) btn.click();
            });
            await wait(2000);
            
            await page.screenshot({ 
                path: 'ppc-after-toggle-wait.png',
                fullPage: true 
            });
            console.log('📸 Efter toggle: ppc-after-toggle-wait.png');
        }
        
    } catch (error) {
        console.error('❌ Fel:', error.message);
        console.error(error.stack);
    } finally {
        console.log('\n⏱️ Väntar 10 sekunder innan stängning...');
        await wait(10000);
        await browser.close();
    }
}

testPPCWithWait();