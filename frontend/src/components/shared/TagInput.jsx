"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";

/**
 * TagInput — Tag/chip style multi-input.
 *
 * Props:
 *  - value: string[] (current tags)
 *  - onChange: (tags: string[]) => void
 *  - placeholder: string
 *  - className: string
 */
export default function TagInput({
    value = [],
    onChange,
    placeholder = "Type and press Enter…",
    className = "",
}) {
    const [input, setInput] = useState("");
    const inputRef = useRef(null);

    const addTag = (tag) => {
        const trimmed = tag.trim().toUpperCase();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInput("");
    };

    const removeTag = (tag) => {
        onChange(value.filter((t) => t !== tag));
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && !input && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    return (
        <div
            className={`flex flex-wrap gap-1.5 p-2 min-h-[44px] rounded-lg border border-input bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/10 transition-all cursor-text ${className}`}
            onClick={() => inputRef.current?.focus()}
        >
            {value.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                        className="p-0.5 rounded hover:bg-primary/10 text-text-light hover:text-primary transition-colors"
                    >
                        <X size={10} />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if (input.trim()) addTag(input); }}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[80px] text-sm bg-transparent outline-none placeholder:text-text-light"
            />
        </div>
    );
}
