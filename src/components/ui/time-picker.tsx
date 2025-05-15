import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function TimePicker({ 
  value = "", 
  onChange,
  disabled = false,
  placeholder = "Select time"
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState(value)

  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  )
  
  const minutes = ['00', '15', '30', '45']

  const handleTimeSelect = (hour: string, minute: string) => {
    const newTime = `${hour}:${minute}`
    setTimeValue(newTime)
    if (onChange) onChange(newTime)
    setIsOpen(false)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setTimeValue(newValue)
    if (onChange) onChange(newValue)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex">
        <Input
          type="time"
          value={timeValue}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            "flex-1 rounded-r-none",
            !timeValue && "text-muted-foreground"
          )}
        />
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="rounded-l-none border-l-0"
            disabled={disabled}
          >
            <Clock className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-3" align="end">
        <div className="space-y-2">
          <div className="text-sm font-medium">Select time</div>
          <div className="grid grid-cols-4 gap-2 h-[200px] overflow-auto p-1">
            {hours.map((hour) => (
              <div key={hour} className="space-y-1">
                <div className="text-xs text-muted-foreground text-center">
                  {parseInt(hour) % 12 === 0 ? '12' : (parseInt(hour) % 12).toString()}
                  {parseInt(hour) >= 12 ? ' PM' : ' AM'}
                </div>
                {minutes.map((minute) => (
                  <Button
                    key={`${hour}:${minute}`}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full text-xs",
                      timeValue === `${hour}:${minute}` && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleTimeSelect(hour, minute)}
                  >
                    {hour}:{minute}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 