// LowisaAssistant - Professional AI Recruitment Assistant for Nordflytt

interface CandidateInfo {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  desired_position: string;
  application_date: string;
}

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface InformationCompleteness {
  isComplete: boolean;
  completedAreas: number;
  totalAreas: number;
  completionRate: number;
  missing: string[];
}

export const LowisaAssistant = {
  systemPrompt: `Du är Lowisa, rekryteringsassistent på Nordflytt (flytt och städ). Du är erfaren, vänlig och professionell. Din uppgift är att samla in saknad information från kandidater genom tydlig och hjälpsam kommunikation på enkel, korrekt svenska – anpassad även för de som inte har svenska som modersmål. Din ton är alltid varm, respektfull och positiv.

🎯 Uppdrag: Analysera jobbansökningar och ställ följdfrågor om information saknas eller är otydlig. Guida kandidaten lugnt genom processen utan stress.

📋 Information att samla in (om saknas):
1. Körkort: "Har du körkort? Vilken typ? (B, C, CE, annat)"
2. Arbetserfarenhet: "Berätta om tidigare jobb inom flytt, städ, lager/logistik, restaurang eller bygg"  
3. Tillgänglighet: "Vilka dagar och tider kan du jobba? Flexibel för extra pass?"
4. Svenska språkkunskaper: "Hur bra pratar och förstår du svenska?"

🗨️ Samtalsflöde: Max 1-2 frågor åt gången, vänta på svar, bekräfta positivt.

⚡ När alla 4 områden är besvarade tydligt, avsluta med: "Tack för dina svar! Nästa steg i vår rekryteringsprocess är att du fyller i vårt formulär här: https://syn7dh9e02w.typeform.com/to/pUeKubsb"`,

  welcomeMessages: {
    default: `Hej {name}! 👋

Välkommen till Nordflytt! Jag heter Lowisa och jag är här för att hjälpa dig med din ansökan.

Jag ser att du är intresserad av att jobba som {position}. Det låter spännande!

För att kunna gå vidare med din ansökan behöver jag ställa några korta frågor. Det tar bara några minuter.

Är det okej att vi börjar?`,

    missing_info: `Hej igen {name}! 

Tack för din ansökan! För att kunna matcha dig med rätt uppdrag behöver jag bara komplettera med lite information.

Låt oss ta det steg för steg. 😊`
  },

  async initializeConversation(applicationId: number): Promise<string> {
    const candidate = await this.getCandidateInfo(applicationId);
    const welcomeMessage = this.welcomeMessages.default
      .replace('{name}', candidate.first_name)
      .replace('{position}', this.getPositionLabel(candidate.desired_position));
    
    return welcomeMessage;
  },

  async handleCandidateMessage(applicationId: number, message: string): Promise<string> {
    const candidate = await this.getCandidateInfo(applicationId);
    const conversationHistory = await this.getConversationHistory(applicationId);
    
    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "system", content: `Kandidatinfo: ${JSON.stringify(candidate)}` },
            ...conversationHistory,
            { role: "user", content: message }
          ],
          temperature: 0.7,
          model: "gpt-4-turbo"
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const aiResponse = await response.json();
      const lowisaMessage = aiResponse.choices[0].message.content;

      // Save conversation to database
      await this.saveConversation(applicationId, message, 'candidate');
      await this.saveConversation(applicationId, lowisaMessage, 'lowisa');

      // Check if all required info is collected
      const infoStatus = await this.analyzeInformationCompleteness(applicationId);
      
      if (infoStatus.isComplete) {
        await this.updateCandidateStage(applicationId, 'typeform_sent');
      }

      return lowisaMessage;
    } catch (error) {
      console.error('Lowisa error:', error);
      return "Ursäkta, jag hade tekniska problem. Kan du upprepa ditt meddelande?";
    }
  },

  async analyzeInformationCompleteness(applicationId: number): Promise<InformationCompleteness> {
    const conversations = await this.getConversationHistory(applicationId);
    const candidateMessages = conversations
      .filter((c: ConversationMessage) => c.role === 'user')
      .map((c: ConversationMessage) => c.content)
      .join(' ');

    // Analyze for required information
    const infoChecks = {
      körkort: /körkort|b-körkort|c-körkort|ce-körkort|licens|körkortet|b\s*körkort|ja.*körkort|har.*körkort/i.test(candidateMessages),
      arbetserfarenhet: /arbete|jobb|erfarenhet|arbetat|jobbat|år|månader|flytt|städ|lager|logistik|restaurang|bygg/i.test(candidateMessages),
      tillgänglighet: /tid|dagar|vecka|måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag|flexibel|tillgänglig|kan.*jobba|pass/i.test(candidateMessages),
      svenska: /svenska|språk|pratar|förstår|flyt|bra|utmärkt|modersmål|flytande/i.test(candidateMessages)
    };

    const completedAreas = Object.values(infoChecks).filter(Boolean).length;
    const isComplete = completedAreas >= 4;

    return {
      isComplete,
      completedAreas,
      totalAreas: 4,
      completionRate: Math.round((completedAreas / 4) * 100),
      missing: Object.keys(infoChecks).filter(key => !infoChecks[key as keyof typeof infoChecks])
    };
  },

  async getCandidateInfo(applicationId: number): Promise<CandidateInfo> {
    // In production, fetch from Supabase
    const response = await fetch(`/api/recruitment/applications/${applicationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch candidate info');
    }
    return await response.json();
  },

  async getConversationHistory(applicationId: number): Promise<ConversationMessage[]> {
    // In production, fetch from Supabase
    const response = await fetch(`/api/recruitment/conversations/${applicationId}`);
    if (!response.ok) {
      return [];
    }
    
    const conversations = await response.json();
    return conversations.map((conv: any) => ({
      role: conv.sender === 'candidate' ? 'user' : 'assistant',
      content: conv.message
    }));
  },

  async saveConversation(applicationId: number, message: string, sender: 'candidate' | 'lowisa'): Promise<void> {
    await fetch('/api/recruitment/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: applicationId,
        message,
        sender,
        timestamp: new Date().toISOString()
      })
    });
  },

  async updateCandidateStage(applicationId: number, stage: string): Promise<void> {
    await fetch(`/api/recruitment/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_stage: stage,
        updated_at: new Date().toISOString()
      })
    });
  },

  getPositionLabel(position: string): string {
    const labels: Record<string, string> = {
      flyttpersonal: 'flyttpersonal',
      team_leader: 'teamledare',
      kundservice: 'kundservice',
      chauffor: 'chaufför',
      koordinator: 'koordinator',
      kvalitetskontroll: 'kvalitetskontrollant'
    };
    return labels[position] || position;
  },

  // Generate smart follow-up questions based on missing info
  generateFollowUpQuestion(missing: string[]): string {
    const questions: Record<string, string> = {
      körkort: "Förresten, har du körkort? Det är bra att veta för vissa uppdrag. 🚗",
      arbetserfarenhet: "Kan du berätta lite om din arbetserfarenhet? Har du jobbat med flytt, städ, lager eller liknande tidigare?",
      tillgänglighet: "Vilka dagar och tider passar det för dig att jobba? Är du flexibel för extra pass?",
      svenska: "Hur bedömer du dina svenskkunskaper? Vi vill vara säkra på att kommunikationen fungerar bra med både kollegor och kunder. 😊"
    };

    // Pick the first missing item
    const nextQuestion = missing[0];
    return questions[nextQuestion] || "Finns det något mer du vill berätta om dig själv?";
  }
};