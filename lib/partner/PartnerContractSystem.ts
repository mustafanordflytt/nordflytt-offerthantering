// =============================================================================
// NORDFLYTT PARTNER CONTRACT SYSTEM
// Digital kontraktshantering för partners
// =============================================================================

import { supabase } from '../supabase';
import { Partner } from './PartnerOnboardingSystem';

export interface PartnerContract {
  id: number;
  partner_id: number;
  contract_type: 'service_agreement' | 'nda' | 'insurance' | 'certification';
  contract_title: string;
  start_date: string;
  end_date?: string;
  auto_renewal: boolean;
  renewal_period?: number;
  document_url?: string;
  signed_document_url?: string;
  digital_signature_id?: string;
  status: 'draft' | 'sent' | 'signed' | 'active' | 'expired' | 'terminated';
  signed_at?: string;
  signed_by_partner?: string;
  signed_by_nordflytt?: string;
  terms_and_conditions?: string;
  special_clauses?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface ContractTemplate {
  id: number;
  template_name: string;
  contract_type: string;
  template_content: string;
  variables: string[];
  version: string;
  is_active: boolean;
  requires_signature: boolean;
  auto_renewal_default: boolean;
  validity_period_months: number;
  created_at: string;
  updated_at: string;
}

export interface DigitalSignature {
  id: string;
  contract_id: number;
  signer_name: string;
  signer_email: string;
  signer_role: 'partner' | 'nordflytt_admin';
  ip_address: string;
  user_agent: string;
  signature_method: 'electronic' | 'biometric' | 'sms_verification';
  signature_timestamp: string;
  signature_data: string;
  verification_status: 'pending' | 'verified' | 'failed';
  legal_compliance: {
    eu_eidas_compliant: boolean;
    swedish_law_compliant: boolean;
    audit_trail: any[];
  };
}

export interface ContractGenerationRequest {
  partner_id: number;
  contract_type: string;
  template_id: number;
  custom_terms?: string;
  special_clauses?: string;
  validity_period_months?: number;
  auto_renewal?: boolean;
  variables?: { [key: string]: string };
}

export class PartnerContractSystem {
  private static instance: PartnerContractSystem;
  
  public static getInstance(): PartnerContractSystem {
    if (!PartnerContractSystem.instance) {
      PartnerContractSystem.instance = new PartnerContractSystem();
    }
    return PartnerContractSystem.instance;
  }

  // =============================================================================
  // KONTRAKTS-TEMPLATES
  // =============================================================================

  async getContractTemplates(): Promise<ContractTemplate[]> {
    // I produktion: Hämta från Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 1,
        template_name: 'Standard Serviceavtal',
        contract_type: 'service_agreement',
        template_content: `
          SERVICEAVTAL FÖR NORDFLYTT PARTNER NETWORK
          
          Detta avtal träffas mellan Nordflytt AB, organisationsnummer 556789-0123, 
          ("Nordflytt") och {{partner_name}}, {{partner_org_number}}, ("Partner").
          
          1. TJÄNSTER OCH OMFATTNING
          Partner åtar sig att utföra flyttjänster enligt Nordflytt's kvalitetsstandarder.
          
          Specialiseringar: {{specializations}}
          Serviceområden: {{service_areas}}
          Kapacitetsnivå: {{capacity_level}}
          
          2. BETALNING OCH ERSÄTTNING
          - Basersättning: {{base_rate}} kr/timme
          - Provision: {{commission_rate}}%
          - Bonusberättigande: {{bonus_eligibility}}
          
          3. KVALITET OCH STANDARDER
          Partner förbinder sig att upprätthålla en kvalitetsrating på minst 4.0/5.0.
          
          4. FÖRSÄKRING OCH ANSVAR
          Partner ska ha gällande ansvarsförsäkring om minst 2 miljoner kronor.
          
          5. GILTIGHET
          Detta avtal gäller från {{start_date}} till {{end_date}}.
          
          {{#if auto_renewal}}
          Avtalet förnyas automatiskt med {{renewal_period}} månader.
          {{/if}}
          
          {{#if special_clauses}}
          SÄRSKILDA VILLKOR:
          {{special_clauses}}
          {{/if}}
          
          Undertecknat digitalt den {{signature_date}}
          
          NORDFLYTT AB                    {{partner_name}}
          {{nordflytt_signatory}}         {{partner_signatory}}
        `,
        variables: [
          'partner_name',
          'partner_org_number',
          'specializations',
          'service_areas',
          'capacity_level',
          'base_rate',
          'commission_rate',
          'bonus_eligibility',
          'start_date',
          'end_date',
          'auto_renewal',
          'renewal_period',
          'special_clauses',
          'signature_date',
          'nordflytt_signatory',
          'partner_signatory'
        ],
        version: '1.0',
        is_active: true,
        requires_signature: true,
        auto_renewal_default: true,
        validity_period_months: 12,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        template_name: 'Sekretessavtal (NDA)',
        contract_type: 'nda',
        template_content: `
          SEKRETESSAVTAL
          
          Detta sekretessavtal träffas mellan Nordflytt AB ("Nordflytt") och 
          {{partner_name}} ("Partner").
          
          1. SEKRETESS
          Partner förbinder sig att behandla all information om Nordflytt's kunder,
          priser, processer och affärsmetoder som strikt konfidentiell.
          
          2. KUNDINFORMATION
          Partner får endast använda kundinformation för att utföra tilldelade uppdrag.
          
          3. DATABEHANDLING
          Partner ska följa GDPR och svensk dataskyddslagstiftning.
          
          4. GILTIGHETSTID
          Detta avtal gäller från {{start_date}} och på obestämd tid.
          
          5. PÅFÖLJDER
          Brott mot sekretessen kan medföra skadestånd och omedelbar uppsägning.
          
          Undertecknat digitalt den {{signature_date}}
          
          NORDFLYTT AB                    {{partner_name}}
          {{nordflytt_signatory}}         {{partner_signatory}}
        `,
        variables: [
          'partner_name',
          'start_date',
          'signature_date',
          'nordflytt_signatory',
          'partner_signatory'
        ],
        version: '1.0',
        is_active: true,
        requires_signature: true,
        auto_renewal_default: false,
        validity_period_months: 0, // Obestämd tid
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        template_name: 'Försäkringsavtal',
        contract_type: 'insurance',
        template_content: `
          FÖRSÄKRINGSAVTAL
          
          Partner {{partner_name}} bekräftar att följande försäkringar är gällande:
          
          1. ANSVARSFÖRSÄKRING
          Försäkringsbolag: {{insurance_company}}
          Försäkringsnummer: {{insurance_number}}
          Täckningsbelopp: {{coverage_amount}} kr
          Giltighet: {{insurance_start_date}} - {{insurance_end_date}}
          
          2. VERKSAMHETSFÖRSÄKRING
          Täcker skador som kan uppstå under utförande av flyttjänster.
          
          3. FORDONSFORSÄKRING
          Alla fordon som används ska vara fullförsäkrade.
          
          4. FÖRNYELSE
          Partner förbinder sig att förnya försäkringen innan utgångsdatum.
          
          5. MEDDELANDE
          Ändringar i försäkringsskydd ska meddelas Nordflytt omedelbart.
          
          Undertecknat digitalt den {{signature_date}}
          
          NORDFLYTT AB                    {{partner_name}}
          {{nordflytt_signatory}}         {{partner_signatory}}
        `,
        variables: [
          'partner_name',
          'insurance_company',
          'insurance_number',
          'coverage_amount',
          'insurance_start_date',
          'insurance_end_date',
          'signature_date',
          'nordflytt_signatory',
          'partner_signatory'
        ],
        version: '1.0',
        is_active: true,
        requires_signature: true,
        auto_renewal_default: true,
        validity_period_months: 12,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];
  }

  // =============================================================================
  // KONTRAKTS-GENERERING
  // =============================================================================

  async generateContract(
    request: ContractGenerationRequest
  ): Promise<{ success: boolean; contract?: PartnerContract; error?: string }> {
    try {
      console.log('📄 Genererar kontrakt för partner:', request.partner_id);

      // Hämta partner-information
      const partner = await this.getPartner(request.partner_id);
      if (!partner) {
        return { success: false, error: 'Partner inte hittad' };
      }

      // Hämta kontraktsmall
      const template = await this.getContractTemplate(request.template_id);
      if (!template) {
        return { success: false, error: 'Kontraktsmall inte hittad' };
      }

      // Bygg kontraktsvariabler
      const variables = await this.buildContractVariables(partner, request);

      // Generera kontraktsinnehåll
      const contractContent = this.populateTemplate(template.template_content, variables);

      // Skapa kontraktspost
      const contract = await this.createContract(partner, template, request, contractContent);

      // Generera PDF
      const documentUrl = await this.generateContractPDF(contract, contractContent);
      
      // Uppdatera kontrakt med dokument-URL
      await this.updateContract(contract.id, { document_url: documentUrl });

      console.log('✅ Kontrakt genererat:', contract.id);
      
      return {
        success: true,
        contract: { ...contract, document_url: documentUrl }
      };
      
    } catch (error) {
      console.error('❌ Fel vid generering av kontrakt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async buildContractVariables(
    partner: Partner,
    request: ContractGenerationRequest
  ): Promise<{ [key: string]: string }> {
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dagar från nu
    const endDate = new Date(startDate.getTime() + (request.validity_period_months || 12) * 30 * 24 * 60 * 60 * 1000);

    return {
      partner_name: partner.name,
      partner_org_number: partner.organization_number || 'N/A',
      specializations: partner.specializations.join(', '),
      service_areas: partner.service_areas.join(', '),
      capacity_level: partner.capacity_level,
      base_rate: '500', // Standard basersättning
      commission_rate: '15', // Standard provision
      bonus_eligibility: 'Ja',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      auto_renewal: request.auto_renewal ? 'Ja' : 'Nej',
      renewal_period: '12',
      special_clauses: request.special_clauses || '',
      signature_date: now.toISOString().split('T')[0],
      nordflytt_signatory: 'Magnus Andersson, VD',
      partner_signatory: partner.name,
      insurance_company: 'Trygg-Hansa',
      insurance_number: 'TH-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      coverage_amount: '2000000',
      insurance_start_date: startDate.toISOString().split('T')[0],
      insurance_end_date: endDate.toISOString().split('T')[0],
      ...request.variables
    };
  }

  private populateTemplate(template: string, variables: { [key: string]: string }): string {
    let content = template;
    
    // Ersätt variabler
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }

    // Hantera conditionals (förenklade)
    content = content.replace(/{{#if auto_renewal}}(.*?){{\/if}}/gs, (match, content) => {
      return variables.auto_renewal === 'Ja' ? content : '';
    });

    content = content.replace(/{{#if special_clauses}}(.*?){{\/if}}/gs, (match, content) => {
      return variables.special_clauses ? content : '';
    });

    return content;
  }

  private async createContract(
    partner: Partner,
    template: ContractTemplate,
    request: ContractGenerationRequest,
    content: string
  ): Promise<PartnerContract> {
    const now = new Date();
    const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = template.validity_period_months > 0 ? 
      new Date(startDate.getTime() + template.validity_period_months * 30 * 24 * 60 * 60 * 1000) :
      undefined;

    const contractData = {
      partner_id: partner.id,
      contract_type: request.contract_type,
      contract_title: template.template_name,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate?.toISOString().split('T')[0],
      auto_renewal: request.auto_renewal ?? template.auto_renewal_default,
      renewal_period: template.validity_period_months,
      status: 'draft',
      terms_and_conditions: content,
      special_clauses: request.special_clauses,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_contracts')
        .insert([contractData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return {
      id: Date.now(),
      ...contractData
    } as PartnerContract;
  }

  private async generateContractPDF(
    contract: PartnerContract,
    content: string
  ): Promise<string> {
    // I produktion: Använd PDF-generator
    const mockUrl = `https://contracts.nordflytt.se/contract-${contract.id}.pdf`;
    
    console.log('📄 Genererar kontrakts-PDF:', contract.id);
    
    return mockUrl;
  }

  // =============================================================================
  // DIGITAL SIGNERING
  // =============================================================================

  async sendContractForSignature(
    contractId: number,
    signerEmail: string,
    signerName: string
  ): Promise<{ success: boolean; signature_url?: string; error?: string }> {
    try {
      console.log('✍️ Skickar kontrakt för signering:', contractId);

      // Hämta kontrakt
      const contract = await this.getContract(contractId);
      if (!contract) {
        return { success: false, error: 'Kontrakt inte hittat' };
      }

      // Uppdatera status
      await this.updateContract(contractId, { 
        status: 'sent',
        updated_at: new Date().toISOString()
      });

      // Skapa signerings-URL
      const signatureUrl = await this.createSignatureUrl(contract, signerEmail, signerName);

      // Skicka e-post
      await this.sendSignatureEmail(contract, signerEmail, signerName, signatureUrl);

      return {
        success: true,
        signature_url: signatureUrl
      };
      
    } catch (error) {
      console.error('❌ Fel vid skickning av kontrakt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async createSignatureUrl(
    contract: PartnerContract,
    signerEmail: string,
    signerName: string
  ): Promise<string> {
    // I produktion: Integrera med digital signering (ex. DocuSign, Adobe Sign)
    const mockUrl = `https://sign.nordflytt.se/contract/${contract.id}?email=${encodeURIComponent(signerEmail)}`;
    
    return mockUrl;
  }

  private async sendSignatureEmail(
    contract: PartnerContract,
    signerEmail: string,
    signerName: string,
    signatureUrl: string
  ): Promise<void> {
    const emailContent = `
      Hej ${signerName}!
      
      Du har ett kontrakt från Nordflytt som väntar på din digitala signering.
      
      Kontraktstyp: ${contract.contract_title}
      Giltighet: ${contract.start_date} - ${contract.end_date || 'Obestämd tid'}
      
      Klicka här för att granska och signera kontraktet:
      ${signatureUrl}
      
      Kontraktet är juridiskt bindande när det signerats digitalt.
      
      Vid frågor, kontakta oss på partner@nordflytt.se
      
      Med vänliga hälsningar,
      Nordflytt Partner Team
    `;

    console.log('📧 Skickar signeringsmail till:', signerEmail);
    // I produktion: Integrera med e-posttjänst
  }

  async processDigitalSignature(
    contractId: number,
    signatureData: {
      signer_name: string;
      signer_email: string;
      signer_role: 'partner' | 'nordflytt_admin';
      signature_method: 'electronic' | 'biometric' | 'sms_verification';
      signature_data: string;
      ip_address: string;
      user_agent: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('✅ Processerar digital signering:', contractId);

      // Skapa digital signering
      const digitalSignature: DigitalSignature = {
        id: `sig-${Date.now()}`,
        contract_id: contractId,
        signer_name: signatureData.signer_name,
        signer_email: signatureData.signer_email,
        signer_role: signatureData.signer_role,
        ip_address: signatureData.ip_address,
        user_agent: signatureData.user_agent,
        signature_method: signatureData.signature_method,
        signature_timestamp: new Date().toISOString(),
        signature_data: signatureData.signature_data,
        verification_status: 'verified',
        legal_compliance: {
          eu_eidas_compliant: true,
          swedish_law_compliant: true,
          audit_trail: [
            {
              timestamp: new Date().toISOString(),
              action: 'signature_created',
              details: {
                method: signatureData.signature_method,
                ip: signatureData.ip_address
              }
            }
          ]
        }
      };

      // Spara digital signering
      await this.saveDigitalSignature(digitalSignature);

      // Uppdatera kontrakt
      await this.updateContract(contractId, {
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_partner: signatureData.signer_role === 'partner' ? signatureData.signer_name : undefined,
        signed_by_nordflytt: signatureData.signer_role === 'nordflytt_admin' ? signatureData.signer_name : undefined,
        digital_signature_id: digitalSignature.id,
        updated_at: new Date().toISOString()
      });

      // Generera signerat dokument
      const signedDocumentUrl = await this.generateSignedDocument(contractId, digitalSignature);
      
      // Uppdatera med signerat dokument
      await this.updateContract(contractId, { 
        signed_document_url: signedDocumentUrl 
      });

      // Skicka bekräftelse
      await this.sendSignatureConfirmation(contractId, signatureData.signer_email);

      return { success: true };
      
    } catch (error) {
      console.error('❌ Fel vid processering av signering:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async generateSignedDocument(
    contractId: number,
    digitalSignature: DigitalSignature
  ): Promise<string> {
    // I produktion: Generera PDF med signering
    const mockUrl = `https://contracts.nordflytt.se/signed-contract-${contractId}.pdf`;
    
    console.log('📄 Genererar signerat dokument:', contractId);
    
    return mockUrl;
  }

  private async sendSignatureConfirmation(
    contractId: number,
    signerEmail: string
  ): Promise<void> {
    console.log('✅ Skickar signeringsbekräftelse till:', signerEmail);
    // I produktion: Skicka bekräftelse-mail
  }

  // =============================================================================
  // KONTRAKTS-HANTERING
  // =============================================================================

  async getPartnerContracts(partnerId: number): Promise<PartnerContract[]> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_contracts')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }

    // Mock för utveckling
    return [
      {
        id: 1,
        partner_id: partnerId,
        contract_type: 'service_agreement',
        contract_title: 'Standard Serviceavtal',
        start_date: '2024-12-01',
        end_date: '2025-11-30',
        auto_renewal: true,
        renewal_period: 12,
        document_url: 'https://contracts.nordflytt.se/contract-1.pdf',
        signed_document_url: 'https://contracts.nordflytt.se/signed-contract-1.pdf',
        digital_signature_id: 'sig-1704067200000',
        status: 'active',
        signed_at: '2024-11-28T10:00:00Z',
        signed_by_partner: 'Johan Andersson',
        signed_by_nordflytt: 'Magnus Andersson',
        terms_and_conditions: 'Standard serviceavtal...',
        created_at: '2024-11-20T10:00:00Z',
        updated_at: '2024-11-28T10:00:00Z'
      }
    ];
  }

  async renewContract(
    contractId: number,
    renewalPeriodMonths: number
  ): Promise<{ success: boolean; renewed_contract?: PartnerContract; error?: string }> {
    try {
      console.log('🔄 Förnyar kontrakt:', contractId);

      const contract = await this.getContract(contractId);
      if (!contract) {
        return { success: false, error: 'Kontrakt inte hittat' };
      }

      // Beräkna nytt slutdatum
      const currentEndDate = new Date(contract.end_date || contract.start_date);
      const newEndDate = new Date(currentEndDate.getTime() + renewalPeriodMonths * 30 * 24 * 60 * 60 * 1000);

      // Uppdatera kontrakt
      await this.updateContract(contractId, {
        end_date: newEndDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      });

      const renewedContract = await this.getContract(contractId);
      
      // Skicka förnyelse-bekräftelse
      await this.sendRenewalConfirmation(contractId);

      return {
        success: true,
        renewed_contract: renewedContract || undefined
      };
      
    } catch (error) {
      console.error('❌ Fel vid förnyelse av kontrakt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Okänt fel'
      };
    }
  }

  private async sendRenewalConfirmation(contractId: number): Promise<void> {
    console.log('📧 Skickar förnyelse-bekräftelse för kontrakt:', contractId);
    // I produktion: Skicka bekräftelse-mail
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getPartner(partnerId: number): Promise<Partner | null> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error) return null;
      return data;
    }

    // Mock för utveckling
    return {
      id: partnerId,
      name: 'Johan Andersson',
      company_name: 'Andersons Flytthjälp AB',
      organization_number: '556789-1234',
      partner_type: 'company',
      phone: '+46701234567',
      email: 'johan@anderssonsflyttjalp.se',
      address: 'Storgatan 123',
      city: 'Stockholm',
      postal_code: '11122',
      specializations: ['moving', 'packing'],
      service_areas: ['stockholm'],
      capacity_level: 'medium',
      status: 'active',
      onboarding_step: 'completed',
      onboarding_progress: 100,
      quality_rating: 4.5,
      completed_jobs: 25,
      total_revenue: 125000,
      certifications: ['ISO9001'],
      insurance_valid_until: '2025-12-31',
      created_at: '2024-12-01T10:00:00Z',
      updated_at: '2025-01-05T10:00:00Z'
    };
  }

  private async getContractTemplate(templateId: number): Promise<ContractTemplate | null> {
    const templates = await this.getContractTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  private async getContract(contractId: number): Promise<PartnerContract | null> {
    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { data, error } = await supabase
        .from('partner_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) return null;
      return data;
    }

    // Mock för utveckling
    return {
      id: contractId,
      partner_id: 1,
      contract_type: 'service_agreement',
      contract_title: 'Standard Serviceavtal',
      start_date: '2024-12-01',
      end_date: '2025-11-30',
      auto_renewal: true,
      renewal_period: 12,
      document_url: 'https://contracts.nordflytt.se/contract-1.pdf',
      signed_document_url: 'https://contracts.nordflytt.se/signed-contract-1.pdf',
      digital_signature_id: 'sig-1704067200000',
      status: 'active',
      signed_at: '2024-11-28T10:00:00Z',
      signed_by_partner: 'Johan Andersson',
      signed_by_nordflytt: 'Magnus Andersson',
      terms_and_conditions: 'Standard serviceavtal...',
      created_at: '2024-11-20T10:00:00Z',
      updated_at: '2024-11-28T10:00:00Z'
    };
  }

  private async updateContract(
    contractId: number,
    updates: Partial<PartnerContract>
  ): Promise<void> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // I produktion: Använd Supabase
    if (process.env.NODE_ENV === 'production') {
      const { error } = await supabase
        .from('partner_contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;
    }
  }

  private async saveDigitalSignature(signature: DigitalSignature): Promise<void> {
    // I produktion: Spara till säker databas
    console.log('💾 Sparar digital signering:', signature.id);
  }

  // =============================================================================
  // RAPPORTER OCH ANALYS
  // =============================================================================

  async getContractStatistics(): Promise<{
    total_contracts: number;
    active_contracts: number;
    pending_signatures: number;
    expired_contracts: number;
    renewal_rate: number;
    average_contract_duration: number;
    contract_types: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  }> {
    // I produktion: Kör SQL-aggregation
    // Mock för utveckling
    return {
      total_contracts: 85,
      active_contracts: 72,
      pending_signatures: 8,
      expired_contracts: 5,
      renewal_rate: 89.5,
      average_contract_duration: 12.3,
      contract_types: [
        { type: 'service_agreement', count: 72, percentage: 84.7 },
        { type: 'nda', count: 85, percentage: 100 },
        { type: 'insurance', count: 72, percentage: 84.7 },
        { type: 'certification', count: 15, percentage: 17.6 }
      ]
    };
  }
}