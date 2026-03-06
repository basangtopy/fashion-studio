# Adding Images to the Hero Section

This document explains how to replace the placeholder `div`s and `span`s in the `page.js` hero section with actual images using the Next.js `<Image>` component.

## 1. Mobile Full-Screen Background

Find this code (around line 47):
```javascript
{/* Simulated Fashion Image for Mobile Background */}
<div className="absolute inset-0 flex items-center justify-center opacity-40">
    <span className="text-white/20 text-sm tracking-widest uppercase">Fashion Image</span>
</div>
```

**Replace it with:**
```javascript
<div className="absolute inset-0 opacity-60 mix-blend-overlay">
    <Image 
        src="/images/your-mobile-hero-image.jpg" 
        alt="Fashion Studio Hero" 
        fill 
        priority
        className="object-cover object-center" 
    />
</div>
```

* **Why these classes?** 
  * `absolute inset-0`: stretches the container to fill the screen.
  * `opacity-60 mix-blend-overlay`: blends your image beautifully into the dark background colors so the text stays perfectly readable.
  * `object-cover object-center`: ensures the image scales without stretching and stays centered.
  * `priority`: tells Next.js to load this instantly since it's above the fold.

---

## 2. Desktop/Tablet Geometric Frame 1 (Taller Portrait)

Find this code (around line 144):
```javascript
<div className="w-full h-full bg-gradient-to-br from-[#C2185B]/30 via-[#1A1A2E] to-[#F8E8F0]/20" style={{ transform: 'rotate(-2deg) scale(1.05)' }}>
    <div className="w-full h-full flex items-center justify-center">
        <span className="text-white/20 text-xs">Fashion Image</span>
    </div>
</div>
```

**Replace it with:**
```javascript
<div className="w-full h-full" style={{ transform: 'rotate(-2deg) scale(1.05)' }}>
    <Image 
        src="/images/your-desktop-image-1.jpg" 
        alt="Fashion Studio Craftsmanship" 
        fill 
        priority
        className="object-cover" 
    />
    {/* Optional: Add this overlay back if the image needs to be darker */}
    <div className="absolute inset-0 bg-[#1A1A2E]/20" />
</div>
```

---

## 3. Desktop/Tablet Geometric Frame 2 (Wider/Shorter)

Find this code (around line 155):
```javascript
<div className="w-full h-full bg-gradient-to-tl from-[#F8E8F0]/15 via-[#1A1A2E] to-[#C2185B]/25" style={{ transform: 'rotate(3deg) scale(1.05)' }}>
    <div className="w-full h-full flex items-center justify-center">
        <span className="text-white/20 text-xs">Fashion Image</span>
    </div>
</div>
```

**Replace it with:**
```javascript
<div className="w-full h-full" style={{ transform: 'rotate(3deg) scale(1.05)' }}>
    <Image 
        src="/images/your-desktop-image-2.jpg" 
        alt="Fashion Studio Style" 
        fill 
        priority
        className="object-cover" 
    />
    {/* Optional: Add this overlay back if the image needs to be darker */}
    <div className="absolute inset-0 bg-[#1A1A2E]/20" />
</div>
```

**Note:** Ensure your image files are saved in the `frontend/public/images/` directory (or wherever you prefer within the `public` folder) so Next.js can resolve them correctly.
