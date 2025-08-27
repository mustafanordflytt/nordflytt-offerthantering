import { z } from 'zod'
import { toast } from './toast-service'

// Svenska felmeddelanden
const swedishErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'string') {
        return { message: 'Detta fält måste vara text' }
      }
      if (issue.expected === 'number') {
        return { message: 'Detta fält måste vara ett nummer' }
      }
      if (issue.expected === 'boolean') {
        return { message: 'Detta fält måste vara sant eller falskt' }
      }
      break
    case z.ZodIssueCode.invalid_literal:
      return { message: 'Ogiltigt värde' }
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Okända fält: ${issue.keys.join(', ')}` }
    case z.ZodIssueCode.invalid_union:
      return { message: 'Ogiltigt värde' }
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Måste vara ett av: ${issue.options.join(', ')}` }
    case z.ZodIssueCode.invalid_arguments:
      return { message: 'Ogiltiga argument' }
    case z.ZodIssueCode.invalid_return_type:
      return { message: 'Ogiltig returtyp' }
    case z.ZodIssueCode.invalid_date:
      return { message: 'Ogiltigt datum' }
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Ogiltig e-postadress' }
      }
      if (issue.validation === 'url') {
        return { message: 'Ogiltig URL' }
      }
      if (issue.validation === 'uuid') {
        return { message: 'Ogiltigt ID' }
      }
      if (issue.validation === 'cuid') {
        return { message: 'Ogiltigt ID' }
      }
      if (issue.validation === 'regex') {
        return { message: 'Ogiltigt format' }
      }
      if (issue.validation === 'datetime') {
        return { message: 'Ogiltigt datum/tid' }
      }
      if (issue.validation && typeof issue.validation === 'object') {
        if ('startsWith' in issue.validation) {
          return { message: `Måste börja med "${issue.validation.startsWith}"` }
        }
        if ('endsWith' in issue.validation) {
          return { message: `Måste sluta med "${issue.validation.endsWith}"` }
        }
      }
      break
    case z.ZodIssueCode.too_small:
      if (issue.type === 'array') {
        return { message: `Måste innehålla minst ${issue.minimum} ${issue.minimum === 1 ? 'värde' : 'värden'}` }
      }
      if (issue.type === 'string') {
        return { message: `Måste vara minst ${issue.minimum} ${issue.minimum === 1 ? 'tecken' : 'tecken'} långt` }
      }
      if (issue.type === 'number') {
        return { message: `Måste vara minst ${issue.minimum}` }
      }
      if (issue.type === 'date') {
        return { message: `Datum måste vara senare än ${new Date(issue.minimum as number).toLocaleDateString('sv-SE')}` }
      }
      break
    case z.ZodIssueCode.too_big:
      if (issue.type === 'array') {
        return { message: `Får innehålla max ${issue.maximum} ${issue.maximum === 1 ? 'värde' : 'värden'}` }
      }
      if (issue.type === 'string') {
        return { message: `Får vara max ${issue.maximum} ${issue.maximum === 1 ? 'tecken' : 'tecken'} långt` }
      }
      if (issue.type === 'number') {
        return { message: `Får vara max ${issue.maximum}` }
      }
      if (issue.type === 'date') {
        return { message: `Datum måste vara tidigare än ${new Date(issue.maximum as number).toLocaleDateString('sv-SE')}` }
      }
      break
    case z.ZodIssueCode.custom:
      return { message: issue.message || 'Ogiltigt värde' }
    case z.ZodIssueCode.invalid_intersection_types:
      return { message: 'Värdena matchar inte' }
    case z.ZodIssueCode.not_multiple_of:
      return { message: `Måste vara en multipel av ${issue.multipleOf}` }
    case z.ZodIssueCode.not_finite:
      return { message: 'Måste vara ett ändligt tal' }
  }
  return { message: ctx.defaultError }
}

z.setErrorMap(swedishErrorMap)

// Common Swedish validation schemas
export const validationSchemas = {
  // Personuppgifter
  personalNumber: z.string()
    .regex(/^\d{6}-?\d{4}$/, 'Ogiltigt personnummer (ÅÅMMDD-XXXX)'),
  
  organizationNumber: z.string()
    .regex(/^\d{6}-?\d{4}$/, 'Ogiltigt organisationsnummer'),
  
  phoneNumber: z.string()
    .regex(/^(\+46|0)[0-9]{2,3}[-\s]?[0-9]{6,8}$/, 'Ogiltigt telefonnummer'),
  
  postalCode: z.string()
    .regex(/^\d{3}\s?\d{2}$/, 'Ogiltigt postnummer (XXX XX)'),
  
  // Kund schema
  customer: z.object({
    name: z.string().min(2, 'Namnet måste vara minst 2 tecken'),
    email: z.string().email('Ogiltig e-postadress'),
    phone: validationSchemas.phoneNumber,
    type: z.enum(['private', 'business'], {
      errorMap: () => ({ message: 'Välj kundtyp' })
    }),
    organizationNumber: z.string().optional(),
    address: z.object({
      street: z.string().min(3, 'Gatuadress krävs'),
      postalCode: validationSchemas.postalCode,
      city: z.string().min(2, 'Stad krävs'),
    }),
  }),
  
  // Jobb schema
  job: z.object({
    customerId: z.string().uuid('Välj en kund'),
    moveDate: z.string().min(1, 'Välj flyttdatum'),
    moveTime: z.string().min(1, 'Välj flytttid'),
    fromAddress: z.object({
      street: z.string().min(3, 'Från-adress krävs'),
      postalCode: validationSchemas.postalCode,
      city: z.string().min(2, 'Stad krävs'),
    }),
    toAddress: z.object({
      street: z.string().min(3, 'Till-adress krävs'),
      postalCode: validationSchemas.postalCode,
      city: z.string().min(2, 'Stad krävs'),
    }),
    services: z.array(z.string()).min(1, 'Välj minst en tjänst'),
    estimatedHours: z.number().min(1, 'Uppskattad tid måste vara minst 1 timme'),
    numberOfWorkers: z.number().min(1, 'Minst 1 arbetare krävs'),
  }),
  
  // Lead schema
  lead: z.object({
    name: z.string().min(2, 'Namnet måste vara minst 2 tecken'),
    email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
    phone: validationSchemas.phoneNumber,
    source: z.enum(['website', 'phone', 'email', 'referral', 'other']),
    message: z.string().optional(),
    estimatedValue: z.number().positive('Värdet måste vara positivt').optional(),
  }),
}

// Form validation hook
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  options?: {
    mode?: 'onSubmit' | 'onBlur' | 'onChange'
    showToast?: boolean
  }
) {
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isValidating, setIsValidating] = useState(false)
  
  const validate = useCallback(async (data: z.infer<T>): Promise<boolean> => {
    setIsValidating(true)
    try {
      await schema.parseAsync(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {}
        
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          if (!fieldErrors[path]) {
            fieldErrors[path] = []
          }
          fieldErrors[path].push(err.message)
        })
        
        setErrors(fieldErrors)
        
        if (options?.showToast !== false) {
          toast.showValidationErrors(fieldErrors)
        }
      }
      return false
    } finally {
      setIsValidating(false)
    }
  }, [schema, options?.showToast])
  
  const validateField = useCallback(async (
    fieldName: string,
    value: any
  ): Promise<boolean> => {
    try {
      // Extract the field schema if possible
      const fieldPath = fieldName.split('.')
      let fieldSchema = schema
      
      // Try to get the specific field schema
      if (schema instanceof z.ZodObject) {
        const shape = schema.shape
        fieldSchema = fieldPath.reduce((acc, key) => {
          if (acc instanceof z.ZodObject) {
            return acc.shape[key]
          }
          return acc
        }, schema as any)
      }
      
      await fieldSchema.parseAsync(value)
      
      setErrors(prev => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
      
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: error.errors.map(e => e.message)
        }))
      }
      return false
    }
  }, [schema])
  
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])
  
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }, [])
  
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return errors[fieldName]?.[0]
  }, [errors])
  
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!errors[fieldName]?.length
  }, [errors])
  
  return {
    validate,
    validateField,
    errors,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError,
    isValidating,
    isValid: Object.keys(errors).length === 0,
  }
}

// Form field wrapper component for automatic validation
export interface FormFieldProps {
  name: string
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  error,
  required,
  children,
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}

// Export everything
export { z } from 'zod'
export type { ZodSchema } from 'zod'