'use client'

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewApplicationModal({
  isOpen,
  onClose,
  onSuccess
}: NewApplicationModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    desired_position: '',
    geographic_preference: 'Stockholm',
    availability_date: '',
    salary_expectation: '',
    cover_letter: ''
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, we'll use the mock API since Supabase isn't connected
      // In production, replace with Supabase call
      const response = await fetch('/api/recruitment/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary_expectation: formData.salary_expectation ? parseInt(formData.salary_expectation) : null,
          application_date: new Date().toISOString(),
          current_stage: 'cv_screening',
          overall_score: 0, // Will be calculated by AI
          status: 'active'
        })
      });

      if (response.ok) {
        toast({
          title: 'Ansökan mottagen!',
          description: `${formData.first_name} ${formData.last_name} har lagts till i systemet.`,
        });
        
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          desired_position: '',
          geographic_preference: 'Stockholm',
          availability_date: '',
          salary_expectation: '',
          cover_letter: ''
        });
        setCvFile(null);
        
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Fel vid skapande',
        description: 'Kunde inte skapa ansökan. Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ny Ansökan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Förnamn *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Efternamn *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                placeholder="+46701234567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="desired_position">Önskad position *</Label>
            <Select 
              value={formData.desired_position}
              onValueChange={(value) => setFormData({...formData, desired_position: value})}
              required
            >
              <SelectTrigger id="desired_position">
                <SelectValue placeholder="Välj position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flyttpersonal">Flyttpersonal</SelectItem>
                <SelectItem value="team_leader">Teamledare</SelectItem>
                <SelectItem value="kundservice">Kundservice & Support</SelectItem>
                <SelectItem value="chauffor">Chaufför & Logistik</SelectItem>
                <SelectItem value="koordinator">Koordinator & Planeringsstöd</SelectItem>
                <SelectItem value="kvalitetskontroll">Kvalitetskontrollant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="geographic_preference">Geografisk preferens</Label>
              <Select 
                value={formData.geographic_preference}
                onValueChange={(value) => setFormData({...formData, geographic_preference: value})}
              >
                <SelectTrigger id="geographic_preference">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stockholm">Stockholm</SelectItem>
                  <SelectItem value="Göteborg">Göteborg</SelectItem>
                  <SelectItem value="Malmö">Malmö</SelectItem>
                  <SelectItem value="Uppsala">Uppsala</SelectItem>
                  <SelectItem value="Flexibel">Flexibel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="availability_date">Tillgänglig från</Label>
              <Input
                id="availability_date"
                type="date"
                value={formData.availability_date}
                onChange={(e) => setFormData({...formData, availability_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="salary_expectation">Löneanspråk (SEK/månad)</Label>
            <Input
              id="salary_expectation"
              type="number"
              placeholder="28000"
              value={formData.salary_expectation}
              onChange={(e) => setFormData({...formData, salary_expectation: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="cover_letter">Personligt brev</Label>
            <Textarea
              id="cover_letter"
              placeholder="Berätta kort om dig själv och varför du vill arbeta hos Nordflytt..."
              value={formData.cover_letter}
              onChange={(e) => setFormData({...formData, cover_letter: e.target.value})}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="cv_file">CV (PDF eller Word)</Label>
            <div className="mt-1">
              <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {cvFile ? cvFile.name : 'Klicka för att ladda upp CV'}
                  </span>
                </div>
                <input
                  id="cv_file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Avbryt
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Skicka Ansökan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}