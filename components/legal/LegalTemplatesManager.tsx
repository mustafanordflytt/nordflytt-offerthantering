'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit3, 
  Copy, 
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface LegalTemplate {
  id: number;
  name: string;
  category: string;
  language: 'sv' | 'en';
  content: string;
  variables: string[];
  usage_count: number;
  success_rate: number;
  last_used: string;
  created_by: string;
  status: 'active' | 'draft' | 'archived';
}

export function LegalTemplatesManager() {
  const [templates, setTemplates] = useState<LegalTemplate[]>([
    {
      id: 1,
      name: 'Standardsvar - Skadeanmälan',
      category: 'damage_claim',
      language: 'sv',
      content: 'Hej {{customer_name}},\n\nTack för din skadeanmälan daterad {{claim_date}}. Vi har mottagit informationen och påbörjat vår granskning av ärendet.\n\nEnligt Konsumenttjänstlagen § 24-25 har vi rätt att först undersöka skadan för att fastställa ansvar. Vi kommer att återkomma inom {{response_days}} arbetsdagar med vår bedömning.\n\nVänligen notera att följande dokumentation krävs:\n- Foton på skadan\n- Kvitto på det skadade föremålet\n- Beskrivning av händelseförloppet\n\nMed vänlig hälsning,\n{{agent_name}}\nNordflytt AB',
      variables: ['customer_name', 'claim_date', 'response_days', 'agent_name'],
      usage_count: 234,
      success_rate: 89,
      last_used: '2024-06-15',
      created_by: 'AI System',
      status: 'active'
    },
    {
      id: 2,
      name: 'Avvisande av ersättningskrav',
      category: 'claim_rejection',
      language: 'sv',
      content: 'Hej {{customer_name}},\n\nVi har granskat ert ersättningskrav gällande {{claim_description}}.\n\nEfter noggrann genomgång av ärendet och tillgänglig dokumentation måste vi tyvärr avvisa ert krav. Beslutet grundar sig på följande:\n\n{{rejection_reasons}}\n\nEnligt våra avtalsvillkor och gällande lagstiftning ({{legal_reference}}) är vi inte ersättningsskyldiga i detta fall.\n\nOm ni har ytterligare frågor eller dokumentation som kan påverka bedömningen, vänligen kontakta oss inom 10 arbetsdagar.\n\nMed vänlig hälsning,\n{{agent_name}}\nNordflytt AB',
      variables: ['customer_name', 'claim_description', 'rejection_reasons', 'legal_reference', 'agent_name'],
      usage_count: 89,
      success_rate: 76,
      last_used: '2024-06-14',
      created_by: 'Legal Team',
      status: 'active'
    },
    {
      id: 3,
      name: 'Delvis godkännande av krav',
      category: 'partial_acceptance',
      language: 'sv',
      content: 'Hej {{customer_name}},\n\nVi har granskat ert ersättningskrav på totalt {{total_amount}} kr.\n\nEfter utvärdering kan vi erbjuda ersättning för följande:\n{{accepted_items}}\n\nTotal ersättning: {{approved_amount}} kr\n\nFöljande poster kan vi tyvärr inte ersätta:\n{{rejected_items}}\n\nVi baserar vår bedömning på {{legal_basis}}. Ersättningen kommer att betalas ut inom 10 arbetsdagar efter att ni accepterat detta förslag.\n\nVänligen meddela oss inom 5 arbetsdagar om ni accepterar vårt förslag.\n\nMed vänlig hälsning,\n{{agent_name}}\nNordflytt AB',
      variables: ['customer_name', 'total_amount', 'accepted_items', 'approved_amount', 'rejected_items', 'legal_basis', 'agent_name'],
      usage_count: 156,
      success_rate: 92,
      last_used: '2024-06-13',
      created_by: 'AI System',
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LegalTemplate | null>(null);

  const categories = [
    { id: 'all', name: 'Alla kategorier', count: templates.length },
    { id: 'damage_claim', name: 'Skadeanmälan', count: 5 },
    { id: 'claim_rejection', name: 'Avvisande', count: 3 },
    { id: 'partial_acceptance', name: 'Delvis godkännande', count: 4 },
    { id: 'delay_compensation', name: 'Förseningsersättning', count: 2 },
    { id: 'contract_dispute', name: 'Avtalstvist', count: 3 }
  ];

  const templateStats = {
    totalTemplates: 17,
    activeTemplates: 14,
    averageSuccessRate: 85,
    totalUsage: 1245,
    timeSaved: '312 timmar'
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'success',
      draft: 'warning',
      archived: 'secondary'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Juridiska Mallar
        </h2>
        <p className="text-muted-foreground">Hantera och optimera AI-drivna svarsmallar</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt antal mallar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">{templateStats.activeTemplates} aktiva</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Genomsnittlig framgång</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.averageSuccessRate}%</div>
            <Progress value={templateStats.averageSuccessRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total användning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">Denna månad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tid besparat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats.timeSaved}</div>
            <p className="text-xs text-muted-foreground">Genom automatisering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI-optimering</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-lg font-bold">+12%</span>
            </div>
            <p className="text-xs text-muted-foreground">Förbättrad framgång</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Sök mallar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ny mall
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name} ({category.count})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      <Badge variant={getStatusColor(template.status)}>
                        {template.status === 'active' && 'Aktiv'}
                        {template.status === 'draft' && 'Utkast'}
                        {template.status === 'archived' && 'Arkiverad'}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{getCategoryName(template.category)}</span>
                      <span>•</span>
                      <span>Språk: {template.language.toUpperCase()}</span>
                      <span>•</span>
                      <span>Skapad av: {template.created_by}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{template.success_rate}%</div>
                    <p className="text-xs text-muted-foreground">Framgångsgrad</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-mono whitespace-pre-wrap line-clamp-3">
                      {template.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span>{template.usage_count} användningar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Senast: {new Date(template.last_used).toLocaleDateString('sv-SE')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Kopiera
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowEditor(true);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Redigera
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Statistik
                    </Button>
                    {template.status === 'active' && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Arkivera
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Inga mallar hittades</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            AI-Optimeringsförslag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Förbättra "Avvisande av ersättningskrav"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lägg till mer empati i början av mallen. Kunder som får avslag reagerar 23% bättre på empatisk kommunikation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Skapa mall för "Förseningsersättning"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  12% av dina ärenden saknar lämplig mall. En ny mall kan spara 5 timmar per månad.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}