
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

interface SearchableSelectProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Seçiniz...",
    emptyMessage = "Sonuç bulunamadı.",
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    // Filter options based on search
    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    disabled={disabled}
                    aria-expanded={open}
                    className={cn("w-full justify-between px-3 text-left font-normal", !value && "text-muted-foreground", className)}
                >
                    {value ? value : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-0" align="start">
                <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        placeholder={placeholder + " ara..."}
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none ring-0 focus-visible:ring-0 px-0"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        // Prevent auto-focus stealing issues
                        autoFocus={true}
                    />
                </div>
                <div className="max-h-[200px] overflow-y-auto overflow-x-hidden p-1">
                    {filteredOptions.length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            {emptyMessage}
                        </div>
                    )}
                    {filteredOptions.map((option) => (
                        <DropdownMenuItem
                            key={option}
                            onSelect={() => {
                                // Toggle value: if clicked same, keep it (or clear? User wants selection, usually keep)
                                // For standardized inputs, usually we just set it.
                                onChange(option)
                                setOpen(false)
                                setSearch("") // Reset search on select
                            }}
                            className="cursor-pointer"
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === option ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {option}
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
