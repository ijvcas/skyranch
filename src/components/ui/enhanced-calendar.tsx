import * as React from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker> & {
  showNavigationHeader?: boolean;
};

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  showNavigationHeader = true,
  ...props
}: EnhancedCalendarProps) {
  const [month, setMonth] = useState<Date>(props.month || new Date());
  const [isMonthYearOpen, setIsMonthYearOpen] = useState(false);
  const [yearInput, setYearInput] = useState("");
  
  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();
  
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const goToPreviousYear = () => {
    const newDate = new Date(currentYear - 1, currentMonth);
    setMonth(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(currentYear + 1, currentMonth);
    setMonth(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1);
    setMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1);
    setMonth(newDate);
  };

  const goToToday = () => {
    setMonth(new Date());
    setIsMonthYearOpen(false);
  };

  const handleMonthChange = (monthStr: string) => {
    const monthIndex = parseInt(monthStr, 10);
    const newDate = new Date(currentYear, monthIndex);
    setMonth(newDate);
  };

  const handleYearChange = (yearStr: string) => {
    const newYear = parseInt(yearStr, 10);
    if (newYear >= 1900 && newYear <= 2100) {
      const newDate = new Date(newYear, currentMonth);
      setMonth(newDate);
    }
  };

  const handleYearInputSubmit = () => {
    const year = parseInt(yearInput, 10);
    if (year >= 1900 && year <= 2100) {
      handleYearChange(yearInput);
      setYearInput("");
      setIsMonthYearOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleYearInputSubmit();
    }
  };

  // Custom header component
  const CustomHeader = () => (
    <div className="flex justify-between items-center relative w-full mb-4">
      {/* Year Navigation - Previous */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousYear}
        className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
      >
        <ChevronLeft className="h-3 w-3" />
        <ChevronLeft className="h-3 w-3 -ml-2" />
      </Button>

      {/* Month Navigation - Previous */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousMonth}
        className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Clickable Month/Year Header */}
      <Popover open={isMonthYearOpen} onOpenChange={setIsMonthYearOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-1 font-medium text-sm hover:bg-accent"
          >
            {format(month, "MMMM yyyy", { locale: es })}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="center">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Seleccionar fecha</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Hoy
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Mes</label>
                <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((monthName, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground">Año</label>
                <div className="space-y-2">
                  <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Array.from({ length: 201 }, (_, i) => {
                        const year = 1900 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      }).reverse()}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="Año"
                      value={yearInput}
                      onChange={(e) => setYearInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="text-xs"
                      min={1900}
                      max={2100}
                    />
                    <Button
                      size="sm"
                      onClick={handleYearInputSubmit}
                      disabled={!yearInput}
                      className="px-2"
                    >
                      Ir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Month Navigation - Next */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextMonth}
        className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Year Navigation - Next */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextYear}
        className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
      >
        <ChevronRight className="h-3 w-3" />
        <ChevronRight className="h-3 w-3 -ml-2" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {showNavigationHeader && <CustomHeader />}
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={month}
        onMonthChange={setMonth}
        className={cn("p-3 pointer-events-auto", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "hidden", // Hide default caption since we use custom header
          caption_label: "text-sm font-medium",
          nav: "hidden", // Hide default nav since we use custom header
          nav_button: "hidden",
          nav_button_previous: "hidden",
          nav_button_next: "hidden",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-xs sm:text-sm",
          row: "flex w-full mt-2",
          cell: "h-8 w-8 sm:h-9 sm:w-9 text-center text-xs sm:text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 text-xs sm:text-sm"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-gradient-blue-green text-white",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}

EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar };