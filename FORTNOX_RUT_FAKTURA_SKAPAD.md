# ✅ Fortnox RUT-faktura Framgångsrikt Skapad!

## 📋 Kundinformation
- **Namn**: Maria Johansson  
- **E-post**: maria.johansson@outlook.com
- **Telefon**: 0736543210
- **Kundnummer**: 7

## 🏠 Flyttinformation
- **Från**: Birger Jarlsgatan 58, 11429 Stockholm
- **Till**: Grevgatan 25, 11453 Stockholm
- **Datum**: 2025-07-24

## 💼 RUT-berättigade tjänster
| Tjänst | Pris ex moms | Moms 25% | Pris ink moms | RUT-status |
|--------|--------------|----------|---------------|------------|
| Flytthjälp | 2,720 kr | 680 kr | 3,400 kr | ✅ RUT-berättigad |
| Packtjänst | 2,720 kr | 680 kr | 3,400 kr | ✅ RUT-berättigad |
| Flyttstädning | 2,720 kr | 680 kr | 3,400 kr | ✅ RUT-berättigad |
| **Summa arbete** | **8,160 kr** | **2,040 kr** | **10,200 kr** | |

## 📦 Material (ej RUT-berättigat)
| Material | Pris ex moms | Moms 25% | Pris ink moms | RUT-status |
|----------|--------------|----------|---------------|------------|
| Packmaterial | 1,440 kr | 360 kr | 1,800 kr | ❌ Ej RUT |

## 💰 RUT-avdrag
- **Total arbetskostnad**: 8,160 kr (ex moms)
- **RUT-avdrag (50%)**: 4,080 kr
- **Skatteverket betalar**: 4,080 kr direkt till Nordflytt

## 📄 Faktura #2
- **Fakturanummer**: 2
- **Fakturadatum**: 2025-07-24
- **Förfallodatum**: 2025-08-23
- **Total exkl moms**: 9,600 kr
- **Total inkl moms**: 12,000 kr
- **Efter RUT-avdrag**: 7,920 kr

## 🔑 Viktiga lärdomar
1. **HouseWork-fältet är skrivskyddat på fakturanivå** - kan endast läsas, inte sättas
2. **RUT aktiveras genom att sätta HouseWork: true på radnivå** för varje RUT-berättigad tjänst
3. **Material och andra icke-arbetsrelaterade kostnader** ska ha HouseWork: false
4. **RUT-avdraget hanteras automatiskt av Fortnox** när tjänster är korrekt markerade

## ✓ Sammanfattning
- ✅ Kund skapad i Fortnox (nr 7)
- ✅ Faktura skapad (nr 2) 
- ✅ Alla arbetstjänster markerade som RUT-berättigade
- ✅ Material korrekt exkluderat från RUT
- ✅ Total efter RUT: 10,300 kr (8,500 kr tjänster efter RUT + 1,800 kr material)
- ✅ Kund betalar endast: **7,920 kr**

**Integration med RUT-sektion fungerar perfekt!** 🎉

## 📝 Kod-exempel för framtida användning
```javascript
InvoiceRows: [
  {
    Description: "Flytthjälp Stockholm",
    DeliveredQuantity: 1,
    Price: 2720,  // ex moms
    VAT: 25,
    Unit: "st",
    HouseWork: true  // ✅ Markera som RUT-berättigad
  },
  {
    Description: "Packmaterial",
    DeliveredQuantity: 1,
    Price: 1440,  // ex moms
    VAT: 25,
    Unit: "st",
    HouseWork: false  // ❌ INTE RUT-berättigat
  }
]
```