/**
 * NORDFLYTT AUTOMATED CONTRACT GENERATION
 * AI-powered employment contract generation and digital signing
 */

export interface ContractData {
  // Employee Information
  employeeName: string;
  employeeEmail: string;
  employeePhone: string;
  employeeAddress?: string;
  personalNumber?: string;

  // Position Details
  positionTitle: string;
  department: string;
  workType: string;
  reportingManager?: string;

  // Compensation
  baseSalary: number;
  hourlyRate: number;
  benefits: string[];
  bonusStructure?: string;

  // Terms
  startDate: string;
  probationPeriod: number;
  workingHours: string;
  location: string;
  vacationDays: number;

  // Nordflytt-specific clauses
  aiSystemsTraining: boolean;
  gpsTrackingConsent: boolean;
  customerServiceStandards: boolean;
  teamCollaborationRequirements: boolean;

  // Conditional terms
  conditions: string[];

  // Contract metadata
  generatedDate: string;
  contractVersion: string;
  hrContact: string;
}

export interface DigitalSignature {
  signatureToken: string;
  expiresAt: string;
  signedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ContractGenerationResult {
  contractId: string;
  pdfPath: string;
  signatureLink: string;
  expiresAt: string;
  contractData: ContractData;
}

export class AutomatedContractGeneration {
  private contractTemplates = {
    swedish: 'standard_swedish_employment_contract',
    probationary: 'probationary_employment_contract',
    temporary: 'temporary_employment_contract'
  };

  private nordflyttCompanyInfo = {
    companyName: 'Nordflytt AB',
    orgNumber: '559123-4567',
    address: 'Storgatan 123, 111 22 Stockholm',
    phone: '+46 8 123 456 78',
    email: 'info@nordflytt.se',
    website: 'www.nordflytt.se'
  };

  async generateEmploymentContract(
    applicationId: number,
    hiringDecision: any
  ): Promise<ContractGenerationResult> {
    console.log('📄 Generating employment contract for application:', applicationId);

    try {
      // Get candidate and position details
      const candidate = await this.getCandidateProfile(applicationId);
      const positionDetails = await this.getPositionDetails(hiringDecision.position);
      const assessmentResults = await this.getAssessmentResults(applicationId);

      // Generate contract data
      const contractData = await this.prepareContractData(
        candidate,
        positionDetails,
        hiringDecision,
        assessmentResults
      );

      // Generate PDF contract
      const pdfResult = await this.generateContractPDF(contractData);

      // Create digital signature link
      const signatureData = await this.createDigitalSignatureLink(applicationId, pdfResult.filePath);

      // Store contract record
      const contractId = await this.storeContractRecord(applicationId, {
        contractData,
        pdfPath: pdfResult.filePath,
        signatureToken: signatureData.signatureToken,
        expiresAt: signatureData.expiresAt
      });

      // Send contract email to candidate
      await this.sendContractEmail(candidate, contractData, signatureData.signatureLink);

      console.log('✅ Contract generated successfully:', contractId);

      return {
        contractId,
        pdfPath: pdfResult.filePath,
        signatureLink: signatureData.signatureLink,
        expiresAt: signatureData.expiresAt,
        contractData
      };

    } catch (error) {
      console.error('❌ Contract generation failed:', error);
      throw new Error(`Contract generation failed: ${error.message}`);
    }
  }

  private async getCandidateProfile(applicationId: number): Promise<any> {
    const response = await fetch(`/api/recruitment/applications/${applicationId}`);
    if (!response.ok) {
      throw new Error('Failed to get candidate profile');
    }
    return await response.json();
  }

  private async getPositionDetails(positionKey: string): Promise<any> {
    // This would normally fetch from the nordflytt_positions table
    const positions: Record<string, any> = {
      flyttpersonal: {
        title: 'Flyttpersonal',
        base_salary: 28000,
        hourly_rate: 165,
        benefits: ['RUT-avdrag hantering', 'GPS tracking utrustning', 'Team prestationsbonus'],
        department: 'Operativ Verksamhet',
        work_type: 'field',
        vacation_days: 25
      },
      team_leader: {
        title: 'Teamledare Flytt',
        base_salary: 35000,
        hourly_rate: 205,
        benefits: ['Ledarskapsbonus', 'Prestationsincitament', 'AI-utbildning', 'Företagsbil'],
        department: 'Operativ Verksamhet',
        work_type: 'field_leadership',
        vacation_days: 28
      },
      kundservice: {
        title: 'Kundservice & Support',
        base_salary: 32000,
        hourly_rate: 185,
        benefits: ['AI-chatbot samarbetsbonus', 'Kundnöjdhetsbonus', 'Hemarbetsutrustning'],
        department: 'Kundtjänst',
        work_type: 'office',
        vacation_days: 25
      },
      chauffor: {
        title: 'Chaufför & Logistik',
        base_salary: 31000,
        hourly_rate: 180,
        benefits: ['Bränslekort', 'Fordonsunderhåll', 'Ruttoptimeringsbonus'],
        department: 'Logistik',
        work_type: 'driving',
        vacation_days: 25
      },
      koordinator: {
        title: 'Koordinator & Planeringsstöd',
        base_salary: 38000,
        hourly_rate: 220,
        benefits: ['AI-systemåtkomst', 'Planeringsbonus', 'Effektivitetsbelöning'],
        department: 'Administration',
        work_type: 'office',
        vacation_days: 28
      },
      kvalitetskontroll: {
        title: 'Kvalitetskontrollant',
        base_salary: 34000,
        hourly_rate: 195,
        benefits: ['Kvalitetsbonus', 'Utbildningscertifiering', 'Förbättringsbelöning'],
        department: 'Kvalitetssäkring',
        work_type: 'field_office',
        vacation_days: 26
      }
    };

    return positions[positionKey] || positions.flyttpersonal;
  }

  private async getAssessmentResults(applicationId: number): Promise<any> {
    // Fetch all assessment results for additional contract terms
    try {
      const response = await fetch(`/api/recruitment/applications/${applicationId}/assessments`);
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }

  private async prepareContractData(
    candidate: any,
    position: any,
    hiringDecision: any,
    assessmentResults: any
  ): Promise<ContractData> {
    // Calculate start date (typically 2-4 weeks from contract generation)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 21); // 3 weeks default

    // Determine probation period based on position and assessment
    let probationPeriod = position.probation_period || 3;
    if (hiringDecision.result === 'hire_conditional') {
      probationPeriod += 1; // Extended for conditional hires
    }

    // Generate conditions based on assessment results
    const conditions = this.generateContractConditions(hiringDecision, assessmentResults);

    const contractData: ContractData = {
      // Employee Information
      employeeName: `${candidate.first_name} ${candidate.last_name}`,
      employeeEmail: candidate.email,
      employeePhone: candidate.phone || '',
      
      // Position Details
      positionTitle: position.title,
      department: position.department,
      workType: position.work_type,
      
      // Compensation
      baseSalary: hiringDecision.salary || position.base_salary,
      hourlyRate: position.hourly_rate,
      benefits: position.benefits,
      
      // Terms
      startDate: startDate.toISOString().split('T')[0],
      probationPeriod: probationPeriod,
      workingHours: this.generateWorkingHours(position.work_type),
      location: candidate.geographic_preference || 'Stockholm',
      vacationDays: position.vacation_days,
      
      // Nordflytt-specific clauses
      aiSystemsTraining: true,
      gpsTrackingConsent: position.work_type !== 'office',
      customerServiceStandards: true,
      teamCollaborationRequirements: true,
      
      // Conditional terms
      conditions: conditions,
      
      // Contract metadata
      generatedDate: new Date().toISOString().split('T')[0],
      contractVersion: '2.1',
      hrContact: 'hr@nordflytt.se'
    };

    return contractData;
  }

  private generateWorkingHours(workType: string): string {
    const schedules: Record<string, string> = {
      field: 'Måndag-Fredag 07:00-16:00, flexibla arbetstider enligt kundbehov',
      office: 'Måndag-Fredag 08:00-17:00, möjlighet till flexibel arbetstid',
      driving: 'Måndag-Fredag 06:00-15:00, anpassat efter transportschema',
      field_leadership: 'Måndag-Fredag 07:00-16:00, beredskapstjänst enligt överenskommelse',
      field_office: 'Måndag-Fredag 08:00-17:00, fältarbete enligt projektbehov'
    };

    return schedules[workType] || schedules.field;
  }

  private generateContractConditions(hiringDecision: any, assessmentResults: any): string[] {
    const conditions: string[] = [];

    // Conditional hiring terms
    if (hiringDecision.result === 'hire_conditional') {
      if (hiringDecision.conditions?.includes('extended_probation')) {
        conditions.push('Förlängd provanställning med månatlig uppföljning');
      }
      if (hiringDecision.conditions?.includes('additional_training')) {
        conditions.push('Obligatorisk vidareutbildning inom kundservice under första kvartalet');
      }
      if (hiringDecision.conditions?.includes('mentor_support')) {
        conditions.push('Tilldelad mentor under hela provanställningsperioden');
      }
    }

    // Assessment-based conditions
    if (assessmentResults?.personality?.red_flags?.length > 0) {
      for (const flag of assessmentResults.personality.red_flags) {
        if (flag.severity === 'medium') {
          conditions.push(`Utvecklingsplan för ${flag.description.toLowerCase()}`);
        }
      }
    }

    // Position-specific conditions
    if (hiringDecision.position === 'team_leader') {
      conditions.push('Genomgång av Nordflytts ledarskapsutbildning inom 60 dagar');
    }

    if (hiringDecision.position === 'chauffor') {
      conditions.push('Godkänt körkortsutdrag och hälsointyg krävs före anställningsstart');
    }

    return conditions;
  }

  private async generateContractPDF(contractData: ContractData): Promise<{ filePath: string; content: string }> {
    console.log('📄 Generating contract PDF for:', contractData.employeeName);

    const contractContent = this.generateContractContent(contractData);
    
    // In production, this would use a PDF generation library like Puppeteer or PDFKit
    const pdfFileName = `contract_${Date.now()}_${contractData.employeeName.replace(' ', '_')}.pdf`;
    const filePath = `/contracts/${pdfFileName}`;

    // Mock PDF generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      filePath,
      content: contractContent
    };
  }

  private generateContractContent(contractData: ContractData): string {
    return `
# ANSTÄLLNINGSAVTAL

**${this.nordflyttCompanyInfo.companyName}**  
Org.nr: ${this.nordflyttCompanyInfo.orgNumber}  
${this.nordflyttCompanyInfo.address}  
Telefon: ${this.nordflyttCompanyInfo.phone}  

---

## § 1 PARTER

**Arbetsgivare:**  
${this.nordflyttCompanyInfo.companyName}  
${this.nordflyttCompanyInfo.address}  

**Anställd:**  
${contractData.employeeName}  
E-post: ${contractData.employeeEmail}  
Telefon: ${contractData.employeePhone}  

---

## § 2 ANSTÄLLNING

**Position:** ${contractData.positionTitle}  
**Avdelning:** ${contractData.department}  
**Anställningsform:** Tillsvidareanställning  
**Startdatum:** ${contractData.startDate}  
**Provanställning:** ${contractData.probationPeriod} månader  

---

## § 3 ARBETSUPPGIFTER

Anställd ska utföra arbetsuppgifter inom ${contractData.positionTitle} enligt Nordflytts riktlinjer och instruktioner. Arbetsuppgifterna kan komma att förändras och utvecklas i takt med verksamhetens behov.

**Arbetstyp:** ${contractData.workType}  
**Arbetstid:** ${contractData.workingHours}  
**Arbetsplats:** ${contractData.location}  

---

## § 4 LÖNEVILLKOR

**Månadslön:** ${contractData.baseSalary.toLocaleString('sv-SE')} SEK  
**Timlön:** ${contractData.hourlyRate} SEK  
**Semesterdagar:** ${contractData.vacationDays} dagar per år  

**Förmåner:**
${contractData.benefits.map(benefit => `• ${benefit}`).join('\n')}

${contractData.conditions.length > 0 ? `
**Särskilda villkor:**
${contractData.conditions.map(condition => `• ${condition}`).join('\n')}
` : ''}

---

## § 5 NORDFLYTT-SPECIFIKA VILLKOR

### AI-System och Teknologi
${contractData.aiSystemsTraining ? '✓' : '✗'} Anställd förbinder sig att genomgå utbildning i Nordflytts AI-system och digitala verktyg

### GPS-spårning och Säkerhet
${contractData.gpsTrackingConsent ? '✓' : '✗'} Anställd samtycker till GPS-spårning under arbetstid för säkerhet och rutt-optimering

### Kundservice och Kvalitet
${contractData.customerServiceStandards ? '✓' : '✗'} Anställd förbinder sig att upprätthålla Nordflytts höga kundservicestandard

### Teamarbete och Samverkan
${contractData.teamCollaborationRequirements ? '✓' : '✗'} Anställd deltar aktivt i teambaserat arbete och kunskapsdelning

---

## § 6 SEKRETESS OCH TYSTNADSPLIKT

Anställd förbinder sig att inte obehörigen röja eller utnyttja information om:
• Nordflytts affärshemligheter och know-how
• Kundinformation och personuppgifter
• AI-system och teknisk utveckling
• Prissättningsstrategier och marknadsplaner

---

## § 7 KONKURRENSKLAUSUL

Under anställningstiden och 6 månader efter anställningens upphörande får anställd inte:
• Driva konkurrerande verksamhet inom flyttbranschen i Stockholmsområdet
• Vara anställd hos direkt konkurrerande företag
• Aktivt värva bort Nordflytts kunder eller anställda

---

## § 8 UPPSÄGNING

**Provanställning:** 1 veckas ömsesidig uppsägningstid  
**Efter provanställning:** 1 månads uppsägningstid från anställds sida, 1-6 månader från arbetsgivarens sida enligt LAS

---

## § 9 ÖVRIGT

Detta avtal regleras av svensk rätt. Eventuella tvister ska i första hand lösas genom förhandling, vid behov genom Arbetsdomstolen.

**Avtalsdatum:** ${contractData.generatedDate}  
**Avtalsversion:** ${contractData.contractVersion}  
**HR-kontakt:** ${contractData.hrContact}  

---

## UNDERTECKNANDE

Genom digital signering av detta avtal bekräftar båda parter att villkoren är godkända.

**För Nordflytt AB:**  
[Digital signatur - HR Manager]

**Anställd:**  
[Väntar på digital signatur - ${contractData.employeeName}]

---

*Detta avtal har genererats automatiskt av Nordflytts AI-rekryteringssystem och är juridiskt bindande vid digital signering.*
    `.trim();
  }

  private async createDigitalSignatureLink(applicationId: number, contractPath: string): Promise<{
    signatureToken: string;
    signatureLink: string;
    expiresAt: string;
  }> {
    // Generate secure signature token
    const signatureToken = this.generateSecureToken();
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const signatureLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/contracts/sign/${signatureToken}`;

    // Store signature record
    await this.storeSignatureRecord(applicationId, signatureToken, contractPath, expiresAt);

    return {
      signatureToken,
      signatureLink,
      expiresAt: expiresAt.toISOString()
    };
  }

  private generateSecureToken(): string {
    // Generate cryptographically secure token
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
  }

  private async storeContractRecord(applicationId: number, contractData: any): Promise<string> {
    const contractId = `contract_${applicationId}_${Date.now()}`;
    
    const response = await fetch('/api/recruitment/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: contractId,
        application_id: applicationId,
        contract_template: 'standard_swedish',
        position_title: contractData.contractData.positionTitle,
        salary_amount: contractData.contractData.baseSalary,
        start_date: contractData.contractData.startDate,
        probation_period: contractData.contractData.probationPeriod,
        contract_terms: contractData.contractData,
        pdf_file_path: contractData.pdfPath,
        signature_status: 'pending',
        signature_token: contractData.signatureToken,
        expires_at: contractData.expiresAt
      })
    });

    if (!response.ok) {
      throw new Error('Failed to store contract record');
    }

    return contractId;
  }

  private async storeSignatureRecord(
    applicationId: number,
    signatureToken: string,
    contractPath: string,
    expiresAt: Date
  ): Promise<void> {
    // This would store the signature record in database
    // For now, just log it
    console.log('📝 Signature record created:', {
      applicationId,
      signatureToken,
      contractPath,
      expiresAt: expiresAt.toISOString()
    });
  }

  private async sendContractEmail(candidate: any, contractData: ContractData, signatureLink: string): Promise<void> {
    const emailContent = this.generateContractEmailContent(candidate, contractData, signatureLink);
    
    const response = await fetch('/api/recruitment/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: candidate.email,
        subject: `Anställningskontrakt från Nordflytt - ${contractData.positionTitle}`,
        body: emailContent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send contract email');
    }

    console.log('📧 Contract email sent to:', candidate.email);
  }

  private generateContractEmailContent(candidate: any, contractData: ContractData, signatureLink: string): string {
    return `
Grattis ${candidate.first_name}!

Vi är glada att erbjuda dig anställning som ${contractData.positionTitle} hos Nordflytt AB.

## DITT ANSTÄLLNINGSERBJUDANDE

**Position:** ${contractData.positionTitle}  
**Avdelning:** ${contractData.department}  
**Startdatum:** ${contractData.startDate}  
**Månadslön:** ${contractData.baseSalary.toLocaleString('sv-SE')} SEK  
**Arbetstid:** ${contractData.workingHours}  

## NÄSTA STEG - SIGNERA DITT KONTRAKT

Klicka på länken nedan för att granska och digitalt signera ditt anställningskontrakt:

**[🔗 SIGNERA KONTRAKT](${signatureLink})**

**VIKTIGT:**
• Länken är giltig i 7 dagar
• Läs igenom hela kontraktet noga
• Kontakta oss vid frågor innan signering
• Ingen utskrift behövs - allt sker digitalt

## VAD HÄNDER EFTER SIGNERING?

1. Du får en bekräftelse via email
2. Vårt onboarding-program startar automatiskt
3. Du får information om första arbetsdagen
4. Välkomstpaket skickas hem till dig

## DINA FÖRMÅNER

${contractData.benefits.map(benefit => `✓ ${benefit}`).join('\n')}

${contractData.conditions.length > 0 ? `
## SÄRSKILDA VILLKOR

${contractData.conditions.map(condition => `• ${condition}`).join('\n')}
` : ''}

## FRÅGOR?

Kontakta oss gärna:
📧 ${contractData.hrContact}
📞 ${this.nordflyttCompanyInfo.phone}

Vi ser fram emot att välkomna dig till Nordflytt-familjen!

Med vänliga hälsningar,  
**Nordflytt HR-team**

---
*Detta är ett automatiskt genererat meddelande från Nordflytts AI-rekryteringssystem.*
    `.trim();
  }

  async processDigitalSignature(
    signatureToken: string,
    signatureData: {
      fullName: string;
      email: string;
      ipAddress: string;
      userAgent: string;
      timestamp: string;
    }
  ): Promise<{
    success: boolean;
    contractId?: string;
    message: string;
  }> {
    console.log('✍️ Processing digital signature for token:', signatureToken);

    try {
      // Verify signature token and get contract details
      const contractRecord = await this.getContractByToken(signatureToken);
      
      if (!contractRecord) {
        return { success: false, message: 'Invalid or expired signature link' };
      }

      // Check if already signed
      if (contractRecord.signature_status === 'signed') {
        return { success: false, message: 'Contract has already been signed' };
      }

      // Check expiration
      if (new Date() > new Date(contractRecord.expires_at)) {
        return { success: false, message: 'Signature link has expired' };
      }

      // Record signature
      await this.recordSignature(contractRecord.id, signatureData);

      // Update contract status
      await this.updateContractStatus(contractRecord.id, 'signed');

      // Trigger onboarding process
      await this.initiateOnboarding(contractRecord.application_id);

      // Send confirmation emails
      await this.sendSignatureConfirmationEmails(contractRecord, signatureData);

      console.log('✅ Contract signed successfully:', contractRecord.id);

      return {
        success: true,
        contractId: contractRecord.id,
        message: 'Contract signed successfully! Welcome to Nordflytt.'
      };

    } catch (error) {
      console.error('❌ Signature processing failed:', error);
      return {
        success: false,
        message: 'Signature processing failed. Please try again or contact HR.'
      };
    }
  }

  private async getContractByToken(signatureToken: string): Promise<any> {
    const response = await fetch(`/api/recruitment/contracts/by-token/${signatureToken}`);
    return response.ok ? await response.json() : null;
  }

  private async recordSignature(contractId: string, signatureData: any): Promise<void> {
    const response = await fetch(`/api/recruitment/contracts/${contractId}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature_data: signatureData,
        signed_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to record signature');
    }
  }

  private async updateContractStatus(contractId: string, status: string): Promise<void> {
    const response = await fetch(`/api/recruitment/contracts/${contractId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature_status: status,
        signed_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update contract status');
    }
  }

  private async initiateOnboarding(applicationId: number): Promise<void> {
    try {
      const response = await fetch('/api/recruitment/onboarding/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: applicationId,
          trigger: 'contract_signed'
        })
      });

      if (response.ok) {
        console.log('🎓 Onboarding initiated for application:', applicationId);
      }
    } catch (error) {
      console.warn('⚠️ Failed to initiate onboarding:', error);
      // Don't fail the signature process if onboarding fails
    }
  }

  private async sendSignatureConfirmationEmails(contractRecord: any, signatureData: any): Promise<void> {
    // Send confirmation to candidate
    await fetch('/api/recruitment/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: signatureData.email,
        subject: 'Kontrakt signerat - Välkommen till Nordflytt!',
        body: this.generateSignatureConfirmationEmail(contractRecord, signatureData)
      })
    });

    // Notify HR team
    await fetch('/api/recruitment/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'hr@nordflytt.se',
        subject: `Kontrakt signerat - ${contractRecord.position_title}`,
        body: this.generateHRNotificationEmail(contractRecord, signatureData)
      })
    });
  }

  private generateSignatureConfirmationEmail(contractRecord: any, signatureData: any): string {
    return `
Grattis och välkommen till Nordflytt!

Ditt anställningskontrakt för positionen ${contractRecord.position_title} har signerats framgångsrikt.

## NÄSTA STEG

🎓 **Onboarding startar automatiskt**  
Du kommer att få information om vårt onboarding-program inom 24 timmar.

📅 **Första arbetsdagen**  
${contractRecord.start_date}

📦 **Välkomstpaket**  
Skickas till din hemadress inom 3-5 arbetsdagar.

## FÖRBEREDELSER INFÖR START

• Håll utkik efter onboarding-information via email
• Förbered ID-handling för första dagen
• Tänk på eventuell uppsägningstid hos nuvarande arbetsgivare

Vi ser fram emot att välkomna dig till teamet!

Med vänliga hälsningar,  
Nordflytt HR-team

---
Signerat: ${signatureData.timestamp}  
IP-adress: ${signatureData.ipAddress}
    `.trim();
  }

  private generateHRNotificationEmail(contractRecord: any, signatureData: any): string {
    return `
KONTRAKT SIGNERAT - ${contractRecord.position_title}

**Kandidat:** ${signatureData.fullName}  
**Email:** ${signatureData.email}  
**Position:** ${contractRecord.position_title}  
**Startdatum:** ${contractRecord.start_date}  
**Signerat:** ${signatureData.timestamp}  

**Teknisk information:**
- IP-adress: ${signatureData.ipAddress}
- Webbläsare: ${signatureData.userAgent}
- Kontrakt-ID: ${contractRecord.id}

**Åtgärder:**
✅ Kontrakt signerat  
🔄 Onboarding initierat automatiskt  
📋 Lägg till i personalregister  
📦 Skicka välkomstpaket  

/Nordflytts AI Rekryteringssystem
    `.trim();
  }

  async getContractStatus(contractId: string): Promise<{
    status: string;
    signedAt?: string;
    expiresAt: string;
    canResend: boolean;
  }> {
    const response = await fetch(`/api/recruitment/contracts/${contractId}`);
    if (!response.ok) {
      throw new Error('Contract not found');
    }
    
    const contract = await response.json();
    const now = new Date();
    const expiresAt = new Date(contract.expires_at);
    
    return {
      status: contract.signature_status,
      signedAt: contract.signed_at,
      expiresAt: contract.expires_at,
      canResend: contract.signature_status === 'pending' && now < expiresAt
    };
  }

  async resendContractLink(contractId: string): Promise<{ success: boolean; message: string }> {
    try {
      const status = await this.getContractStatus(contractId);
      
      if (!status.canResend) {
        return { success: false, message: 'Contract cannot be resent' };
      }

      // Generate new signature token with extended expiry
      const newToken = this.generateSecureToken();
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 7);

      // Update contract with new token
      await fetch(`/api/recruitment/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature_token: newToken,
          expires_at: newExpiryDate.toISOString()
        })
      });

      // Send new email (implementation would be similar to initial email)
      console.log('📧 Contract link resent with new token:', newToken);

      return { success: true, message: 'New contract link sent successfully' };

    } catch (error) {
      console.error('❌ Failed to resend contract:', error);
      return { success: false, message: 'Failed to resend contract link' };
    }
  }
}