'use client'

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, FileText } from 'lucide-react';

interface EmailComposeModalProps {
  candidate: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const emailTemplates = {
  screening: {
    name: 'Screening Email',
    subject: 'Tack för din ansökan till {{position}} - Nordflytt',
    message: `Hej {{first_name}},

Tack för din ansökan till positionen som {{position}} hos Nordflytt, Sveriges första AI-autonoma flyttföretag!

Vi är imponerade av din bakgrund och skulle vilja lära känna dig bättre. Som en del av vår AI-drivna rekryteringsprocess skulle vi vilja ställa några frågor:

1. Berätta om en situation där du hjälpte en kund eller kollega som var frustrerad eller stressad. Hur hanterade du situationen?

2. Vad attraherar dig mest med att arbeta för ett innovativt företag som använder AI för att förbättra flyttjänster?

3. Hur ser du på teamarbete och vad är din roll i ett team?

Svara gärna inom 2-3 arbetsdagar. Det finns inga "rätta" eller "fel" svar - vi vill bara lära känna dig bättre!

Med vänliga hälsningar,
Nordflytt Rekryteringsteam
hr@nordflytt.se`
  },
  interview: {
    name: 'Intervjuinbjudan',
    subject: 'Intervjuinbjudan - {{position}} hos Nordflytt',
    message: `Hej {{first_name}},

Grattis! Vi skulle gärna träffa dig för en intervju för positionen som {{position}} hos Nordflytt.

Vi har följande tider tillgängliga:
- Måndag 15/2 kl. 10:00
- Tisdag 16/2 kl. 14:00
- Onsdag 17/2 kl. 09:00

Intervjun kommer att hållas på vårt kontor på Vasagatan 16, Stockholm, och beräknas ta cirka 45 minuter.

Vänligen svara på detta email med vilken tid som passar dig bäst.

Vi ser fram emot att träffa dig!

Med vänliga hälsningar,
Nordflytt Rekryteringsteam`
  },
  rejection: {
    name: 'Avslag',
    subject: 'Tack för din ansökan till Nordflytt',
    message: `Hej {{first_name}},

Tack för ditt intresse för positionen som {{position}} hos Nordflytt och för tiden du investerat i vår rekryteringsprocess.

Efter noggrann övervägning har vi beslutat att gå vidare med andra kandidater vars profiler bättre matchar våra nuvarande behov.

Vi uppskattar verkligen ditt intresse för Nordflytt och uppmuntrar dig att hålla utkik efter framtida möjligheter hos oss. Din profil var imponerande och vi skulle gärna se din ansökan igen när vi har roller som bättre matchar din bakgrund.

Vi önskar dig lycka till i ditt fortsatta jobbsökande!

Med vänliga hälsningar,
Nordflytt Rekryteringsteam`
  },
  offer: {
    name: 'Jobberbjudande',
    subject: 'Jobberbjudande - {{position}} hos Nordflytt',
    message: `Hej {{first_name}},

Vi är glada att kunna erbjuda dig positionen som {{position}} hos Nordflytt!

Efter våra intervjuer och bedömningar är vi övertygade om att du kommer att vara en värdefull tillgång för vårt team.

Erbjudandet inkluderar:
- Position: {{position}}
- Lön: Enligt överenskommelse
- Startdatum: Enligt överenskommelse
- Provanställning: 6 månader

Vänligen läs igenom det bifogade anställningsavtalet och återkom till oss inom 5 arbetsdagar.

Välkommen till Nordflytt-familjen!

Med vänliga hälsningar,
Nordflytt HR-team`
  }
};

const POSITION_LABELS: Record<string, string> = {
  flyttpersonal: 'Flyttpersonal',
  team_leader: 'Teamledare',
  kundservice: 'Kundservice',
  chauffor: 'Chaufför',
  koordinator: 'Koordinator',
  kvalitetskontroll: 'Kvalitetskontrollant'
};

export default function EmailComposeModal({
  candidate,
  isOpen,
  onClose,
  onSuccess
}: EmailComposeModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    template: ''
  });

  const applyTemplate = (templateKey: string) => {
    if (emailTemplates[templateKey as keyof typeof emailTemplates] && candidate) {
      const template = emailTemplates[templateKey as keyof typeof emailTemplates];
      let subject = template.subject;
      let message = template.message;

      // Replace placeholders
      subject = subject.replace('{{position}}', POSITION_LABELS[candidate.desired_position] || candidate.desired_position);
      message = message.replace(/{{first_name}}/g, candidate.first_name);
      message = message.replace(/{{position}}/g, POSITION_LABELS[candidate.desired_position] || candidate.desired_position);

      setEmailData({
        subject,
        message,
        template: templateKey
      });
    }
  };

  const sendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      toast({
        title: 'Fel',
        description: 'Ämne och meddelande krävs.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/recruitment/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: candidate.email,
          subject: emailData.subject,
          message: emailData.message,
          candidateId: candidate.id,
          candidateName: `${candidate.first_name} ${candidate.last_name}`
        })
      });

      if (response.ok) {
        toast({
          title: 'Email skickat!',
          description: `Email har skickats till ${candidate.first_name} ${candidate.last_name}.`,
        });
        
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Fel vid sändning',
        description: 'Kunde inte skicka email. Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Skicka Email till {candidate.first_name} {candidate.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="template">Email Mall</Label>
            <Select 
              value={emailData.template}
              onValueChange={(value) => {
                setEmailData({...emailData, template: value});
                applyTemplate(value);
              }}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Välj en mall (valfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screening">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Screening Email
                  </div>
                </SelectItem>
                <SelectItem value="interview">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Intervjuinbjudan
                  </div>
                </SelectItem>
                <SelectItem value="rejection">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Avslag
                  </div>
                </SelectItem>
                <SelectItem value="offer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Jobberbjudande
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="to">Till</Label>
            <Input
              id="to"
              value={candidate.email}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="subject">Ämne *</Label>
            <Input
              id="subject"
              placeholder="Ange ämne..."
              value={emailData.subject}
              onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Meddelande *</Label>
            <Textarea
              id="message"
              placeholder="Skriv ditt meddelande här..."
              value={emailData.message}
              onChange={(e) => setEmailData({...emailData, message: e.target.value})}
              rows={12}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tips: Använd en mall ovan för att snabbt komma igång
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Avbryt
            </Button>
            <Button 
              onClick={sendEmail} 
              disabled={loading || !emailData.subject || !emailData.message}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Skicka Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}