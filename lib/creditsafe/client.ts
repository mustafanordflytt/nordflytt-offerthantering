/**
 * Creditsafe CAS API Client
 * Handles credit checks and BankID authentication
 */

import { parseStringPromise, Builder } from 'xml2js';

// Configuration
const CREDITSAFE_CONFIG = {
  endpoint: process.env.CREDITSAFE_ENDPOINT || 'https://casapi.creditsafe.se/casapi/cas.asmx',
  username: process.env.CREDITSAFE_USERNAME || 'FLYTTSVETESTIN',
  password: process.env.CREDITSAFE_PASSWORD || 'Flyttsvetestin123!',
  templateId: process.env.CREDITSAFE_TEMPLATE_ID || '1', // Default template
};

// Types
export interface CreditCheckRequest {
  personalNumber: string;
  ipAddress?: string;
  templateId?: string;
}

export interface CreditCheckResponse {
  status: 'approved' | 'rejected' | 'error';
  riskScore?: number;
  creditLimit?: number;
  rejectCode?: string;
  rejectReason?: string;
  requiresDeposit?: boolean;
  depositAmount?: number;
  rawResponse?: any;
}

export interface BankIDAuthRequest {
  personalNumber?: string; // Valfritt för "samma enhet" autentisering
  ipAddress: string;
}

export interface BankIDAuthResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken?: string;
  qrStartSecret?: string;
}

export interface BankIDStatusResponse {
  status: 'pending' | 'complete' | 'failed';
  hintCode?: string;
  completionData?: {
    user: {
      personalNumber: string;
      name: string;
      givenName: string;
      surname: string;
    };
    device: {
      ipAddress: string;
    };
    signature: string;
    ocspResponse: string;
  };
}

// Reject code mappings
const REJECT_CODE_MAPPINGS: Record<string, string> = {
  'REJECT_1': 'Betalningsanmärkning registrerad',
  'REJECT_2': 'För hög skuldsättning',
  'REJECT_3': 'Tidigare betalningsproblem',
  'REJECT_4': 'Otillräcklig kredithistorik',
  'REJECT_5': 'Säkerhetsrisk identifierad',
};

/**
 * Creditsafe CAS API Client
 */
export class CreditsafeClient {
  private endpoint: string;
  private username: string;
  private password: string;
  private xmlBuilder: Builder;

  constructor(config?: Partial<typeof CREDITSAFE_CONFIG>) {
    this.endpoint = config?.endpoint || CREDITSAFE_CONFIG.endpoint;
    this.username = config?.username || CREDITSAFE_CONFIG.username;
    this.password = config?.password || CREDITSAFE_CONFIG.password;
    this.xmlBuilder = new Builder();
  }

  /**
   * Build SOAP envelope for requests
   */
  private buildSoapEnvelope(body: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthenticationHeader xmlns="http://tempuri.org/">
      <Username>${this.username}</Username>
      <Password>${this.password}</Password>
    </AuthenticationHeader>
  </soap:Header>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Make SOAP request
   */
  private async makeSoapRequest(action: string, body: string): Promise<any> {
    const envelope = this.buildSoapEnvelope(body);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `"http://tempuri.org/${action}"`,
        },
        body: envelope,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const result = await parseStringPromise(xmlText, {
        explicitArray: false,
        ignoreAttrs: true,
      });

      return result['soap:Envelope']['soap:Body'];
    } catch (error) {
      console.error('SOAP request error:', error);
      throw error;
    }
  }

  /**
   * Perform credit check
   */
  async performCreditCheck(request: CreditCheckRequest): Promise<CreditCheckResponse> {
    const body = `
      <CreditCheck xmlns="http://tempuri.org/">
        <personalNumber>${request.personalNumber}</personalNumber>
        <templateId>${request.templateId || CREDITSAFE_CONFIG.templateId}</templateId>
        <ipAddress>${request.ipAddress || ''}</ipAddress>
      </CreditCheck>
    `;

    try {
      const result = await this.makeSoapRequest('CreditCheck', body);
      const creditCheckResult = result.CreditCheckResponse?.CreditCheckResult;

      if (!creditCheckResult) {
        return {
          status: 'error',
          rawResponse: result,
        };
      }

      // Parse the response
      const status = creditCheckResult.Status?.toLowerCase() || 'error';
      const rejectCode = creditCheckResult.RejectCode;
      const riskScore = parseInt(creditCheckResult.RiskScore) || 0;
      const creditLimit = parseFloat(creditCheckResult.CreditLimit) || 0;

      // Determine if deposit is required based on reject code
      let requiresDeposit = false;
      let depositAmount = 0;

      if (status === 'rejected' && rejectCode) {
        // Business rules for deposits
        if (['REJECT_1', 'REJECT_2', 'REJECT_3'].includes(rejectCode)) {
          requiresDeposit = true;
          depositAmount = 5000; // Standard deposit amount
        }
      }

      return {
        status: status as 'approved' | 'rejected' | 'error',
        riskScore,
        creditLimit,
        rejectCode,
        rejectReason: rejectCode ? REJECT_CODE_MAPPINGS[rejectCode] || 'Kreditprövning ej godkänd' : undefined,
        requiresDeposit,
        depositAmount,
        rawResponse: creditCheckResult,
      };
    } catch (error) {
      console.error('Credit check error:', error);
      return {
        status: 'error',
        rawResponse: error,
      };
    }
  }

  /**
   * Initiate BankID authentication
   */
  async initiateBankIDAuth(request: BankIDAuthRequest): Promise<BankIDAuthResponse> {
    // För "samma enhet" autentisering, utelämna personalNumber elementet
    const personalNumberElement = request.personalNumber 
      ? `<personalNumber>${request.personalNumber}</personalNumber>`
      : '';
      
    const body = `
      <BankIDAuth xmlns="http://tempuri.org/">
        ${personalNumberElement}
        <endUserIp>${request.ipAddress}</endUserIp>
      </BankIDAuth>
    `;

    try {
      const result = await this.makeSoapRequest('BankIDAuth', body);
      const authResult = result.BankIDAuthResponse?.BankIDAuthResult;

      if (!authResult) {
        throw new Error('Invalid BankID response');
      }

      return {
        orderRef: authResult.OrderRef,
        autoStartToken: authResult.AutoStartToken,
        qrStartToken: authResult.QrStartToken,
        qrStartSecret: authResult.QrStartSecret,
      };
    } catch (error) {
      console.error('BankID auth error:', error);
      throw error;
    }
  }

  /**
   * Check BankID authentication status
   */
  async checkBankIDStatus(orderRef: string): Promise<BankIDStatusResponse> {
    const body = `
      <BankIDCollect xmlns="http://tempuri.org/">
        <orderRef>${orderRef}</orderRef>
      </BankIDCollect>
    `;

    try {
      const result = await this.makeSoapRequest('BankIDCollect', body);
      const collectResult = result.BankIDCollectResponse?.BankIDCollectResult;

      if (!collectResult) {
        throw new Error('Invalid BankID collect response');
      }

      const status = collectResult.Status?.toLowerCase() || 'pending';
      const hintCode = collectResult.HintCode;

      if (status === 'complete') {
        return {
          status: 'complete',
          completionData: {
            user: {
              personalNumber: collectResult.User?.PersonalNumber,
              name: collectResult.User?.Name,
              givenName: collectResult.User?.GivenName,
              surname: collectResult.User?.Surname,
            },
            device: {
              ipAddress: collectResult.Device?.IpAddress,
            },
            signature: collectResult.Signature,
            ocspResponse: collectResult.OcspResponse,
          },
        };
      }

      return {
        status: status as 'pending' | 'complete' | 'failed',
        hintCode,
      };
    } catch (error) {
      console.error('BankID status check error:', error);
      throw error;
    }
  }

  /**
   * Cancel BankID authentication
   */
  async cancelBankIDAuth(orderRef: string): Promise<void> {
    const body = `
      <BankIDCancel xmlns="http://tempuri.org/">
        <orderRef>${orderRef}</orderRef>
      </BankIDCancel>
    `;

    try {
      await this.makeSoapRequest('BankIDCancel', body);
    } catch (error) {
      console.error('BankID cancel error:', error);
      // Don't throw - cancellation errors are not critical
    }
  }

  /**
   * Format personal number for API
   */
  static formatPersonalNumber(personalNumber: string): string {
    // Remove any non-digits
    const cleaned = personalNumber.replace(/\D/g, '');
    
    // Ensure 12 digits (YYYYMMDDXXXX)
    if (cleaned.length === 10) {
      // Add century prefix
      const year = parseInt(cleaned.substring(0, 2));
      const century = year > new Date().getFullYear() % 100 ? '19' : '20';
      return century + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate personal number format
   */
  static validatePersonalNumber(personalNumber: string): boolean {
    const cleaned = personalNumber.replace(/\D/g, '');
    
    // Must be 10 or 12 digits
    if (cleaned.length !== 10 && cleaned.length !== 12) {
      return false;
    }

    // Basic Luhn algorithm check could be added here
    return true;
  }
}

// Export singleton instance
export const creditsafeClient = new CreditsafeClient();