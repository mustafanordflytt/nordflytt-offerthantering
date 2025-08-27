import puppeteer from 'puppeteer';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPPCUrl() {
    console.log('🚀 PPC-test via URL...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 }
    });

    try {
        const page = await browser.newPage();
        
        // Försök 1: Gå direkt till sidan och klicka
        console.log('📍 Navigerar till AI-marknadsföring...');
        await page.goto('http://localhost:3000/crm/ai-marknadsforing');
        await wait(5000);
        
        // Använd page.click istället för evaluate
        console.log('🎯 Klickar PPC med page.click...');
        try {
            // Prova olika selektorer
            const selectors = [
                'button:has-text("PPC")',
                '[role="tab"]:has-text("PPC")',
                'button[role="tab"]:nth-child(4)', // Om PPC är 4:e tabben
                'button:contains("PPC")'
            ];
            
            let clicked = false;
            for (const selector of selectors) {
                try {
                    await page.click(selector, { delay: 100 });
                    clicked = true;
                    console.log(`✅ Klickade med selector: ${selector}`);
                    break;
                } catch (e) {
                    // Fortsätt med nästa
                }
            }
            
            if (!clicked) {
                // Fallback: evaluate
                await page.evaluate(() => {
                    const tabs = document.querySelectorAll('button[role="tab"]');
                    tabs.forEach((tab, index) => {
                        if (tab.textContent === 'PPC') {
                            console.log(`Hittade PPC på index ${index}`);
                            tab.click();
                        }
                    });
                });
                console.log('✅ Klickade via evaluate');
            }
        } catch (e) {
            console.log('❌ Kunde inte klicka:', e.message);
        }
        
        await wait(5000);
        
        // Analysera
        console.log('\n📊 Analyserar sidan...');
        const analysis = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                activeTab: '',
                tabPanelVisible: false,
                toggleButton: null,
                contentSummary: ''
            };
            
            // Hitta aktiv tab
            const activeTab = document.querySelector('button[role="tab"][data-state="active"]');
            result.activeTab = activeTab?.textContent?.trim() || 'Ingen';
            
            // Kolla om rätt tabpanel är synlig
            const panels = document.querySelectorAll('[role="tabpanel"]');
            panels.forEach(panel => {
                if (panel.getAttribute('data-state') === 'active') {
                    result.tabPanelVisible = true;
                    result.contentSummary = panel.textContent?.substring(0, 100) + '...';
                }
            });
            
            // Hitta toggle
            const buttons = Array.from(document.querySelectorAll('button'));
            const toggle = buttons.find(b => 
                b.textContent === 'Avancerad vy' || 
                b.textContent === 'Enkel vy'
            );
            if (toggle) {
                result.toggleButton = toggle.textContent;
            }
            
            return result;
        });
        
        console.log('Resultat:');
        console.log(`  URL: ${analysis.url}`);
        console.log(`  Aktiv tab: ${analysis.activeTab}`);
        console.log(`  TabPanel synlig: ${analysis.tabPanelVisible ? '✅' : '❌'}`);
        console.log(`  Toggle-knapp: ${analysis.toggleButton || '❌ Saknas'}`);
        console.log(`  Innehåll: ${analysis.contentSummary.substring(0, 50)}...`);
        
        await page.screenshot({ 
            path: 'ppc-url-test.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot: ppc-url-test.png');
        
        // Om toggle finns, testa
        if (analysis.toggleButton) {
            console.log('\n🔄 Testar toggle...');
            
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent === 'Avancerad vy' || b.textContent === 'Enkel vy');
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });
            
            await wait(2000);
            
            const newToggle = await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent === 'Avancerad vy' || b.textContent === 'Enkel vy');
                return btn?.textContent;
            });
            
            console.log(`  Före: ${analysis.toggleButton}`);
            console.log(`  Efter: ${newToggle}`);
            console.log(`  Fungerar: ${newToggle !== analysis.toggleButton ? '✅' : '❌'}`);
            
            await page.screenshot({ 
                path: 'ppc-url-after-toggle.png',
                fullPage: true 
            });
            console.log('  📸 Efter toggle: ppc-url-after-toggle.png');
        }
        
    } catch (error) {
        console.error('❌ Fel:', error);
    } finally {
        console.log('\n⏱️ Stänger om 10 sekunder...');
        await wait(10000);
        await browser.close();
    }
}

testPPCUrl();