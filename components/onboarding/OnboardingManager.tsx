'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, 
  Smartphone, 
  Award, 
  CheckCircle2,
  Clock,
  User
} from 'lucide-react'
import ProvisionMasterclassStep from './ProvisionMasterclassStep'
import StaffAppMasterclassStep from './StaffAppMasterclassStep'
import OnboardingCompletion from './OnboardingCompletion'

interface OnboardingManagerProps {
  employee: any
  onComplete: (totalProvision: number) => void
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: string
  completed: boolean
  provisionLearned?: number
}

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ employee, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [totalProvisionLearned, setTotalProvisionLearned] = useState(0)
  const [stepProvisions, setStepProvisions] = useState<Record<string, number>>({})

  const steps: OnboardingStep[] = [
    {
      id: 'säkerhetsutbildning',
      title: 'Provision Masterclass',
      description: 'Lär dig tjäna 50-100kr extra per försäljning',
      icon: <GraduationCap className="h-5 w-5" />,
      component: 'ProvisionMasterclass',
      completed: completedSteps.includes('säkerhetsutbildning'),
      provisionLearned: stepProvisions['säkerhetsutbildning'] || 0
    },
    {
      id: 'systemtillgång',
      title: 'Staff App Masterclass', 
      description: 'Behärska appen för max provision och skydd',
      icon: <Smartphone className="h-5 w-5" />,
      component: 'StaffAppMasterclass',
      completed: completedSteps.includes('systemtillgång'),
      provisionLearned: stepProvisions['systemtillgång'] || 0
    }
  ]

  const handleStepComplete = (stepId: string, provisionAmount?: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId])
      
      if (provisionAmount) {
        setStepProvisions(prev => ({ ...prev, [stepId]: provisionAmount }))
        setTotalProvisionLearned(prev => prev + provisionAmount)
      }
    }
    
    // Move to next step or completion
    const currentStepIndex = steps.findIndex(step => step.id === stepId)
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(currentStepIndex + 1)
    } else {
      // All steps completed
      setCurrentStep(steps.length) // Show completion
    }
  }

  const progress = (completedSteps.length / steps.length) * 100
  const isComplete = completedSteps.length === steps.length

  const renderCurrentStep = () => {
    if (currentStep >= steps.length) {
      return (
        <OnboardingCompletion
          employee={employee}
          totalProvisionLearned={totalProvisionLearned}
          completedSteps={completedSteps}
          onComplete={() => onComplete(totalProvisionLearned)}
        />
      )
    }

    const step = steps[currentStep]
    
    switch (step.component) {
      case 'ProvisionMasterclass':
        return (
          <ProvisionMasterclassStep
            employee={employee}
            onComplete={(stepId) => handleStepComplete(stepId, 175)} // Example provision from scenarios
          />
        )
      case 'StaffAppMasterclass':
        return (
          <StaffAppMasterclassStep
            employee={employee}
            onComplete={(stepId) => handleStepComplete(stepId, 100)} // App mastery bonus
          />
        )
      default:
        return <div>Okänt steg</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-blue-800">
                  Onboarding för {employee.name}
                </CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  {employee.role === 'flyttpersonal_utan_korkort' ? 'Flyttpersonal utan körkort' : employee.role}
                </p>
              </div>
            </div>
            <Badge 
              variant={isComplete ? "default" : "secondary"}
              className={isComplete ? "bg-green-600" : ""}
            >
              {completedSteps.length}/{steps.length} steg
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Framsteg</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            
            {totalProvisionLearned > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Lärt sig tjäna:</span>
                  <span className="font-bold text-green-800">{totalProvisionLearned}kr provision</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <Card 
            key={step.id}
            className={`transition-all ${
              index === currentStep 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : step.completed 
                  ? 'bg-green-50 border-green-200'
                  : index < currentStep 
                    ? 'bg-gray-50' 
                    : 'opacity-60'
            }`}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-600 text-white' 
                    : index === currentStep 
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : index === currentStep ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-600">{step.description}</p>
                  {step.completed && step.provisionLearned && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      +{step.provisionLearned}kr provision lärd
                    </div>
                  )}
                </div>
                {index === currentStep && (
                  <Badge className="bg-blue-600">Aktiv</Badge>
                )}
                {step.completed && (
                  <Badge className="bg-green-600">Klar</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Step Content */}
      <div>
        {renderCurrentStep()}
      </div>
    </div>
  )
}

export default OnboardingManager