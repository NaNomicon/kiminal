import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Timesheet } from '../data/schema'

type TimesheetsDialogType = 'add' | 'edit' | 'delete'

type TimesheetsContextType = {
  open: TimesheetsDialogType | null
  setOpen: (str: TimesheetsDialogType | null) => void
  currentRow: Timesheet | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Timesheet | null>>
}

const TimesheetsContext = React.createContext<TimesheetsContextType | null>(
  null
)

export function TimesheetsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<TimesheetsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Timesheet | null>(null)

  return (
    <TimesheetsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </TimesheetsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTimesheets = () => {
  const timesheetsContext = React.useContext(TimesheetsContext)

  if (!timesheetsContext) {
    throw new Error('useTimesheets has to be used within <TimesheetsContext>')
  }

  return timesheetsContext
}
