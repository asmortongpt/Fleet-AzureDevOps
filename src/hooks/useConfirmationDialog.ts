import { useState, useCallback } from 'react'

interface ConfirmationConfig {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => Promise<void> | void
    onCancel?: () => void
}

export function useConfirmationDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [config, setConfig] = useState<ConfirmationConfig | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const confirm = useCallback((newConfig: ConfirmationConfig) => {
        setConfig(newConfig)
        setIsOpen(true)
    }, [])

    const handleConfirm = useCallback(async () => {
        if (!config) return
        try {
            setIsLoading(true)
            await config.onConfirm()
            setIsOpen(false)
        } finally {
            setIsLoading(false)
        }
    }, [config])

    const handleCancel = useCallback(() => {
        if (config?.onCancel) {
            config.onCancel()
        }
        setIsOpen(false)
    }, [config])

    return {
        isOpen,
        isLoading,
        confirm,
        handleConfirm,
        handleCancel,
        config
    }
}

export function useDeleteConfirmation(
    onConfirm: () => Promise<void> | void,
    itemName: string = 'item'
) {
    const { confirm, ...rest } = useConfirmationDialog()

    const confirmDelete = useCallback(() => {
        confirm({
            title: `Delete ${itemName}?`,
            description: `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'destructive',
            onConfirm
        })
    }, [confirm, itemName, onConfirm])

    return { confirmDelete, ...rest }
}

export function useSaveConfirmation(onConfirm: () => Promise<void> | void) {
    const { confirm, ...rest } = useConfirmationDialog()

    const confirmSave = useCallback(() => {
        confirm({
            title: 'Save Changes?',
            description: 'Are you sure you want to save your changes?',
            confirmText: 'Save',
            variant: 'default',
            onConfirm
        })
    }, [confirm, onConfirm])

    return { confirmSave, ...rest }
}

export function useDiscardConfirmation(onConfirm: () => Promise<void> | void) {
    const { confirm, ...rest } = useConfirmationDialog()

    const confirmDiscard = useCallback(() => {
        confirm({
            title: 'Discard Changes?',
            description: 'Are you sure you want to discard your changes? Unsaved progress will be lost.',
            confirmText: 'Discard',
            variant: 'destructive',
            onConfirm
        })
    }, [confirm, onConfirm])

    return { confirmDiscard, ...rest }
}

export type { ConfirmationConfig }
