import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface RoleComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    id?: string;
}

const RoleCombobox = ({ value, onChange, options, id }: RoleComboboxProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search/value
    // If the dropdown is open, we filter by the current input value (which acts as search)
    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(value.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <Input
                    id={id}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Select or type a role..."
                    className="pr-10"
                />
                <div 
                    className="absolute right-0 top-0 h-full px-3 py-2 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>
            
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-60 overflow-y-auto">
                    {filteredOptions.map((option) => (
                        <div
                            key={option}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoleCombobox;
