// Types för prisberäkning
export interface MoveDetails {
    volym_m3: number;
    avstand_km: number;
    hiss_typ_A: 'ingen' | 'liten' | 'stor' | 'trappa';
    vaningar_A: number;
    hiss_typ_B: 'ingen' | 'liten' | 'stor' | 'trappa';
    vaningar_B: number;
    lagenhet_kvm: number;
    packHjalp: boolean;
    flyttstad: boolean;
    antal_tunga_objekt: number;
    lang_barvag: boolean;
    barvag_extra_meter: number;
    nyckelkund: boolean;
    lagsasong: boolean;
    
    // NYA FÄLT för extra tjänster
    mobelmontering: boolean;
    upphangning: boolean;
    bortforsling: boolean;
    allergistadning: boolean; // NY - för att skilja från vanlig städning
    
    // NYA FÄLT för kartongkostnader
    antal_flyttkartonger: number;
    antal_garderobskartonger: number;
    antal_tavelkartonger: number;
    antal_spegelkartonger: number;
  }
  
  export interface PriceBreakdown {
    slutpris: number;
    antal_tillagg: number;
    komborabatt_procent: number;
    delsummor: {
      grundpris: number;
      avstandsavgift: number;
      barhjalp_A: number;
      barhjalp_B: number;
      packkostnad: number;
      stadkostnad: number;
      tungtillagg: number;
      barvagstillagg: number;
      // NYA FÄLT
      mobelmontering_kostnad: number;
      upphangning_kostnad: number;
      bortforsling_kostnad: number;
      kartongkostnad: number;
    };
    rabatter: {
      komborabatt: number;
      volymrabatt: number;
      nyckelkundrabatt: number;
      sasongrabatt: number;
      total_rabatt: number;
    };
  }
  
  /**
   * Beräknar flyttkostnad enligt Nordflytts prismodell
   * Alla priser är inklusive moms och RUT-avdrag
   */
  export function berakna_flyttkostnad(details: MoveDetails): PriceBreakdown {
      // Standardisera hisstyper till lowercase
      const hiss_typ_A = typeof details.hiss_typ_A === 'string' ? details.hiss_typ_A.toLowerCase() : 'stor';
      const hiss_typ_B = typeof details.hiss_typ_B === 'string' ? details.hiss_typ_B.toLowerCase() : 'stor';
      
      // 1. Grundpris baserat på volym (variabelt pris per m³ inklusive moms)
      let pris_per_m3;
      const volym_m3 = details.volym_m3;
      
      if (volym_m3 <= 5) {
          pris_per_m3 = 320; // För små flyttar (≤5 m³)
      } else if (volym_m3 >= 57) {
          pris_per_m3 = 128; // För stora flyttar (≥57 m³)
      } else {
          // Trappstegsmodell för mellansegmentet
          const brytpunkt_1 = 15; // m³
          const brytpunkt_2 = 40; // m³
          
          if (volym_m3 <= brytpunkt_1) {
              // Från 5 m³ till 15 m³
              const lutning_1 = (200 - 320) / (brytpunkt_1 - 5);
              pris_per_m3 = 320 + lutning_1 * (volym_m3 - 5);
          } else if (volym_m3 <= brytpunkt_2) {
              // Från 15 m³ till 40 m³
              const lutning_2 = (144 - 200) / (brytpunkt_2 - brytpunkt_1);
              pris_per_m3 = 200 + lutning_2 * (volym_m3 - brytpunkt_1);
          } else {
              // Från 40 m³ till 57 m³
              const lutning_3 = (128 - 144) / (57 - brytpunkt_2);
              pris_per_m3 = 144 + lutning_3 * (volym_m3 - brytpunkt_2);
          }
      }
      
      let grundpris = volym_m3 * pris_per_m3;
      
      // Säkerställ minimipris på 1600 kr inklusive moms
      if (grundpris < 1600) {
          grundpris = 1600;
      }
      
      // 2. UPPDATERAD Avstånd med 1.7x modell för flera lastbilar
      let avstandsavgift = 0;
      
      // Beräkna antal lastbilar (19 m³ per lastbil)
      const antal_lastbilar = Math.ceil(details.volym_m3 / 19);
      
      if (details.avstand_km > 50) {
          let km_pris_per_bil = 0;
          
          if (details.avstand_km <= 400) {
              // Regional: hela sträckan × 10.4 kr/km
              km_pris_per_bil = details.avstand_km * 10.4;
          } else {
              // Långdistans: hela sträckan × 15.0 kr/km (övernattning krävs)
              km_pris_per_bil = details.avstand_km * 15.0;
          }
          
          // Multiplikator för extra lastbilar: 1.7x modell
          // Formel: antal_lastbilar × 0.7 + 0.3
          // 1 bil = 1.0x, 2 bilar = 1.7x, 3 bilar = 2.4x
          const lastbils_multiplikator = antal_lastbilar * 0.7 + 0.3;
          avstandsavgift = km_pris_per_bil * lastbils_multiplikator;
      }
      
      // 3. Bärhjälp på båda adresser (priser inklusive moms)
      function barhjalpsavgift(hiss_typ: string, vaningar: number): number {
          if (hiss_typ === "stor") {
              return 0; // Ingen extra kostnad för stor hiss
          } else if (hiss_typ === "liten") {
              // 10 kr per m³ och våning för liten hiss
              return volym_m3 * vaningar * 10; 
          } else if (hiss_typ === "trappa") {
              // 20 kr per m³ och våning för trappa
              return volym_m3 * vaningar * 20; 
          } else {
              return 0; // Okänd hisstyp
          }
      }
      
      const barhjalp_A = barhjalpsavgift(hiss_typ_A, details.vaningar_A);
      const barhjalp_B = barhjalpsavgift(hiss_typ_B, details.vaningar_B);
      
      // 4. Packhjälp (44 kr/m² inklusive moms och RUT-avdrag)
      const packkostnad = details.packHjalp ? details.lagenhet_kvm * 44 : 0;
      
      // 5. UPPDATERAD Städning (hantera både vanlig och allergi)
      let stadkostnad = 0;
      if (details.allergistadning) {
          stadkostnad = details.lagenhet_kvm * 65; // NY - Allergistädning dyrare
      } else if (details.flyttstad) {
          stadkostnad = details.lagenhet_kvm * 44; // BEFINTLIG - Vanlig städning
      }
      
      // 6. Tunga föremål (800 kr per objekt inklusive moms och RUT-avdrag)
      const tungtillagg = details.antal_tunga_objekt * 800;
      
      // 7. Lång bärväg (80 kr per extra meter utöver 10 meter inklusive moms)
     // 🔧 FIXAT: Sätt rimlig maxgräns för bärväg (max 100 meter extra)
const barvag_meter = Math.min(details.barvag_extra_meter || 0, 100);
const barvagstillagg = details.lang_barvag ? barvag_meter * 80 : 0;
      
      // 8. NYA TJÄNSTER - Ytterligare tjänster (fasta priser)
      const mobelmontering_kostnad = details.mobelmontering ? 1500 : 0;
      const upphangning_kostnad = details.upphangning ? 1200 : 0;
      const bortforsling_kostnad = details.bortforsling ? 1800 : 0;
      
      // 9. NYA TJÄNSTER - Kartongkostnader
      const kartongkostnad = 
          (details.antal_flyttkartonger || 0) * 20 +
          (details.antal_garderobskartonger || 0) * 40 +
          (details.antal_tavelkartonger || 0) * 60 +
          (details.antal_spegelkartonger || 0) * 75;
      
      // 10. UPPDATERAD Räkna antal tilläggstjänster för komborabatten
      let antal_tillagg = 0;
      if (details.packHjalp) antal_tillagg++;
      if (details.flyttstad || details.allergistadning) antal_tillagg++; // Städning räknas som 1 tillägg
      if (details.mobelmontering) antal_tillagg++;  // NY
      if (details.upphangning) antal_tillagg++;     // NY
      if (details.bortforsling) antal_tillagg++;    // NY
      
      // 11. UPPDATERAD Delsumma innan rabatter (lägg till nya kostnader)
      let delsumma = grundpris + avstandsavgift + barhjalp_A + barhjalp_B + 
                     packkostnad + stadkostnad + tungtillagg + barvagstillagg +
                     mobelmontering_kostnad + upphangning_kostnad + 
                     bortforsling_kostnad + kartongkostnad;
      
      // 12. Stegvis komborabatt (5% per tilläggstjänst)
      const komborabatt = (antal_tillagg >= 1) ? delsumma * (antal_tillagg * 0.05) : 0;
      
      // Uppdatera delsumma efter komborabatt
      delsumma -= komborabatt;
      
      // 13. Volymrabatt (baserat på volym)
      let volymrabatt = 0;
      if (volym_m3 >= 100) {
          volymrabatt = delsumma * 0.15; // 15% rabatt vid volym ≥ 100 m³
      } else if (volym_m3 >= 75) {
          volymrabatt = delsumma * 0.1; // 10% rabatt vid volym ≥ 75 m³
      } else if (volym_m3 >= 50) {
          volymrabatt = delsumma * 0.05; // 5% rabatt vid volym ≥ 50 m³
      }
      
      // 14. Nyckelkundsrabatt (10% rabatt)
      const nyckelkundrabatt = details.nyckelkund ? delsumma * 0.1 : 0;
      
      // 15. Lågsäsongsrabatt (8% rabatt)
      const sasongrabatt = details.lagsasong ? delsumma * 0.08 : 0;
      
      // 16. Total efter alla rabatter
      const total_rabatt = volymrabatt + nyckelkundrabatt + sasongrabatt;
      const slutpris = delsumma - total_rabatt;
      
      // Returnera detaljerat resultat med uppdelning
      return {
          slutpris: Math.round(slutpris),
          antal_tillagg: antal_tillagg,
          komborabatt_procent: antal_tillagg * 5,
          delsummor: {
              grundpris: Math.round(grundpris),
              avstandsavgift: Math.round(avstandsavgift),
              barhjalp_A: Math.round(barhjalp_A),
              barhjalp_B: Math.round(barhjalp_B),
              packkostnad: Math.round(packkostnad),
              stadkostnad: Math.round(stadkostnad),
              tungtillagg: Math.round(tungtillagg),
              barvagstillagg: Math.round(barvagstillagg),
              // NYA FÄLT
              mobelmontering_kostnad: Math.round(mobelmontering_kostnad),
              upphangning_kostnad: Math.round(upphangning_kostnad),
              bortforsling_kostnad: Math.round(bortforsling_kostnad),
              kartongkostnad: Math.round(kartongkostnad)
          },
          rabatter: {
              komborabatt: Math.round(komborabatt),
              volymrabatt: Math.round(volymrabatt),
              nyckelkundrabatt: Math.round(nyckelkundrabatt),
              sasongrabatt: Math.round(sasongrabatt),
              total_rabatt: Math.round(total_rabatt + komborabatt) // Total inklusive komborabatt
          }
      };
  }
  
  // Hjälpfunktion för att formatera priser
  export function formatPrice(amount: number): string {
      return new Intl.NumberFormat('sv-SE', {
          style: 'currency',
          currency: 'SEK',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
      }).format(amount);
  }
  