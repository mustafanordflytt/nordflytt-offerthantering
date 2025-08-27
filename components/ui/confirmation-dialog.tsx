import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ButtonLoadingSpinner } from "@/components/ui/loading-spinner"
import { ReactNode } from "react"

interface ConfirmationDialogProps {
  trigger: ReactNode
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmText = "Bekräfta",
  cancelText = "Avbryt",
  onConfirm,
  isDestructive = false,
  isLoading = false,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault()
              await onConfirm()
            }}
            className={isDestructive ? "bg-red-600 hover:bg-red-700" : ""}
            disabled={isLoading}
          >
            <ButtonLoadingSpinner loading={isLoading} loadingText="Vänta...">
              {confirmText}
            </ButtonLoadingSpinner>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for programmatic confirmation
import { useState } from "react"

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
    onConfirm: () => void | Promise<void>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const confirm = (options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
  }) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...options,
        onConfirm: async () => {
          setIsLoading(true)
          try {
            resolve(true)
          } finally {
            setIsLoading(false)
            setIsOpen(false)
          }
        },
      })
      setIsOpen(true)
    })
  }

  const ConfirmationDialogComponent = () => {
    if (!config) return null

    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
            <AlertDialogDescription>{config.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              {config.cancelText || "Avbryt"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                await config.onConfirm()
              }}
              className={config.isDestructive ? "bg-red-600 hover:bg-red-700" : ""}
              disabled={isLoading}
            >
              <ButtonLoadingSpinner loading={isLoading} loadingText="Vänta...">
                {config.confirmText || "Bekräfta"}
              </ButtonLoadingSpinner>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  }
}