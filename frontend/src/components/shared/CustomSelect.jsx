"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * CustomSelect — Styled dropdown replacement for <select>.
 *
 * Props:
 *  - options: [{ value, label, icon? }]
 *  - value: string | string[]
 *  - onChange: (value) => void
 *  - placeholder: string
 *  - multiple: bool
 *  - searchable: bool
 *  - className: string
 *  - label: string
 */
export default function CustomSelect({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    multiple = false,
    searchable = false,
    className = "",
    label,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);
    const inputRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (open && searchable && inputRef.current) inputRef.current.focus();
    }, [open, searchable]);

    const filtered = searchable && search
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    const selectedLabels = multiple
        ? options.filter((o) => Array.isArray(value) && value.includes(o.value)).map((o) => o.label)
        : [];

    const selectedLabel = !multiple
        ? options.find((o) => o.value === value)?.label || ""
        : "";

    const handleSelect = (optVal) => {
        if (multiple) {
            const arr = Array.isArray(value) ? [...value] : [];
            if (arr.includes(optVal)) {
                onChange(arr.filter((v) => v !== optVal));
            } else {
                onChange([...arr, optVal]);
            }
        } else {
            onChange(optVal);
            setOpen(false);
            setSearch("");
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(multiple ? [] : "");
    };

    const hasValue = multiple ? Array.isArray(value) && value.length > 0 : !!value;

    return (
        <div ref={ref} className={`relative ${className}`}>
            {label && (
                <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">{label}</label>
            )}
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`w-full h-9 px-3 flex items-center justify-between gap-2 rounded-lg border text-sm transition-all duration-150
                    ${open ? "border-[#C2185B] ring-2 ring-[#C2185B]/10" : "border-[#E0E0E0] hover:border-[#C2185B]/40"}
                    ${disabled ? "opacity-50 cursor-not-allowed bg-[#FAFAFA]" : "bg-white cursor-pointer"}
                `}
            >
                <span className={`truncate text-left flex-1 ${hasValue ? "text-[#0D0D0D]" : "text-[#999]"}`}>
                    {multiple && selectedLabels.length > 0
                        ? selectedLabels.length <= 2 ? selectedLabels.join(", ") : `${selectedLabels.length} selected`
                        : selectedLabel || placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {hasValue && !disabled && (
                        <span onClick={handleClear} className="p-0.5 rounded hover:bg-[#F4F0F8] text-[#999] hover:text-[#C2185B]">
                            <X size={12} />
                        </span>
                    )}
                    <ChevronDown size={14} className={`text-[#999] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl shadow-lg overflow-hidden"
                    >
                        {searchable && (
                            <div className="px-3 pt-2 pb-1">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full h-7 px-2 text-xs border border-[#E0E0E0] rounded-md focus:border-[#C2185B] outline-none"
                                />
                            </div>
                        )}
                        <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                            {filtered.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-[#999]">No options</div>
                            ) : (
                                filtered.map((opt) => {
                                    const isSelected = multiple
                                        ? Array.isArray(value) && value.includes(opt.value)
                                        : value === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelect(opt.value)}
                                            className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors
                                                ${isSelected ? "bg-[#C2185B]/5 text-[#C2185B] font-medium" : "text-[#0D0D0D] hover:bg-[#F4F0F8]"}`}
                                        >
                                            {opt.icon && <opt.icon size={14} className="shrink-0" />}
                                            <span className="flex-1 truncate">{opt.label}</span>
                                            {isSelected && <Check size={14} className="shrink-0 text-[#C2185B]" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
