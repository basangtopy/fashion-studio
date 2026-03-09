"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/**
 * StarRatingInput — Interactive 5-star rating selector.
 *
 * Props:
 *  - value: number (1-5)
 *  - onChange: (rating: number) => void
 *  - size: number (icon size, default 20)
 */
export default function StarRatingInput({
    value = 0,
    onChange,
    size = 20,
}) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hovered || value);
                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        className="transition-transform duration-150 hover:scale-110 active:scale-95"
                    >
                        <Star
                            size={size}
                            className={`transition-colors duration-150 ${isActive ? "text-[#F9A825] fill-[#F9A825]" : "text-[#E0E0E0]"}`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
