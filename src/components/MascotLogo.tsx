import React from 'react'

export const MascotLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <rect x="25" y="55" width="50" height="45" rx="15" fill="#1E293B" />
    <path d="M 40 55 L 50 70 L 60 55 Z" fill="#E2E8F0" />
    <path d="M 48 70 L 52 70 L 52 100 L 48 100 Z" fill="#F8FAFC" />
    <path d="M 46 72 L 54 72 L 50 82 Z" fill="#F97316" /> {/* Tie */}
    
    {/* Head */}
    <circle cx="50" cy="45" r="22" fill="#FDCBA4" />
    
    {/* Cheeks */}
    <circle cx="38" cy="50" r="4" fill="#FB923C" opacity="0.6" />
    <circle cx="62" cy="50" r="4" fill="#FB923C" opacity="0.6" />
    
    {/* Smile */}
    <path d="M 43 54 Q 50 59 57 54" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    
    {/* Eyes */}
    <circle cx="41" cy="43" r="3.5" fill="#1E293B" />
    <circle cx="59" cy="43" r="3.5" fill="#1E293B" />
    
    {/* Glasses */}
    <rect x="34" y="38" width="14" height="10" rx="3" fill="none" stroke="#1E293B" strokeWidth="1.5" />
    <rect x="52" y="38" width="14" height="10" rx="3" fill="none" stroke="#1E293B" strokeWidth="1.5" />
    <path d="M 48 43 L 52 43" fill="none" stroke="#1E293B" strokeWidth="1.5" />
    
    {/* Authentic Hard Hat - Repositioned to sit ON the head instead of over the eyes */}
    <g transform="translate(25, -8) scale(2.1)" fill="#F97316" stroke="#C2410C" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" fill="#FB923C"/>
      <path d="M14 6a6 6 0 0 1 6 6v3" />
      <path d="M4 15v-3a6 6 0 0 1 6-6" />
      <rect x="2" y="15" width="20" height="4" rx="1" fill="#EA580C" stroke="#9A3412"/>
    </g>
    
    {/* Left Arm holding Report */}
    <path d="M 28 65 Q 15 75 35 85" fill="none" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
    
    {/* Report / Clipboard */}
    <rect x="25" y="65" width="22" height="28" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" transform="rotate(-15 36 79)" />
    <rect x="30" y="62" width="12" height="4" rx="1" fill="#94A3B8" transform="rotate(-15 36 79)" />
    <path d="M 32 75 L 40 75 M 32 80 L 42 80 M 32 85 L 38 85" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-15 36 79)" />
    <circle cx="36" cy="79" r="4.5" fill="#FDCBA4" /> {/* Thumb */}
    
    {/* Right Arm holding Orange Pen */}
    <path d="M 72 65 Q 85 75 55 82" fill="none" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
    <circle cx="55" cy="82" r="4.5" fill="#FDCBA4" /> {/* Right Thumb */}
    <rect x="42" y="80" width="18" height="3" rx="1" fill="#EA580C" transform="rotate(-20 42 80)" /> {/* Pen */}
  </svg>
)
