// ENKEL OCH ROBUST GPS MODAL - Garanterat fungerar

export const createSimpleGPSModal = (address: string): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('Creating simple GPS modal for address:', address);
    
    // Skapa overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    // Skapa modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
    `;
    
    // Skapa innehåll
    modal.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">🌐</div>
      <h2 style="color: #002A5C; font-size: 24px; font-weight: bold; margin: 0 0 16px 0;">
        GPS-bekräftelse
      </h2>
      <p style="color: #64748b; font-size: 16px; margin: 0 0 24px 0;">
        GPS är inte tillgänglig. Du kan starta jobbet ändå.
      </p>
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="font-weight: 600; color: #002A5C; margin-bottom: 4px;">📍 Jobbadress:</div>
        <div style="color: #64748b; font-size: 14px;">${address}</div>
      </div>
    `;
    
    // Skapa knappar manuellt
    const startBtn = document.createElement('button');
    startBtn.textContent = '✅ Starta ändå';
    startBtn.style.cssText = `
      display: block;
      width: 100%;
      background: #16a34a;
      color: white;
      border: none;
      padding: 18px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 12px;
      min-height: 56px;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Avbryt';
    cancelBtn.style.cssText = `
      display: block;
      width: 100%;
      background: #f1f5f9;
      color: #475569;
      border: none;
      padding: 16px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      min-height: 48px;
    `;
    
    // Lägg till knappar till modal
    modal.appendChild(startBtn);
    modal.appendChild(cancelBtn);
    
    // Lägg till modal till overlay
    overlay.appendChild(modal);
    
    // Cleanup funktion
    const cleanup = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };
    
    // Event handlers - enkel version
    startBtn.onclick = () => {
      startBtn.textContent = '✅ Startar...';
      startBtn.style.opacity = '0.7';
      setTimeout(() => {
        cleanup();
        resolve(true);
      }, 200);
    };
    
    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
    
    // Klick utanför modal
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };
    
    // Lägg till i DOM
    document.body.appendChild(overlay);
    console.log('Simple GPS modal added to DOM');
    
    // Fokusera på start-knappen
    setTimeout(() => {
      startBtn.focus();
      console.log('Simple GPS modal ready for interaction');
    }, 100);
  });
};