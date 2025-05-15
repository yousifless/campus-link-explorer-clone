import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate?: (date: Date | undefined) => void
  selected?: Date
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
}

export function DatePicker({ 
  date, 
  setDate,
  selected,
  onSelect,
  disabled
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date || selected)

  // Handle date change with either method
  const handleSelect = (selectedDate: Date | undefined) => {
    setSelectedDate(selectedDate);
    if (selectedDate) {
      if (setDate) setDate(selectedDate);
      if (onSelect) onSelect(selectedDate);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
} 