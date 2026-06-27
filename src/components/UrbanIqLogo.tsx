import React from 'react';

interface UrbanIqLogoProps {
  className?: string;
  size?: number | string;
}

export default function UrbanIqLogo({ className = '', size = '2.5rem' }: UrbanIqLogoProps) {
  return (
    <svg
      viewBox="0 0 200 220"
      style={{ width: size, height: size }}
      className={`inline-block select-none ${className}`}
      id="urbanIqVectorLogo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Left half outer shield gradient */}
        <linearGradient id="leftOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" /> {/* Royal Blue */}
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Right half outer shield gradient */}
        <linearGradient id="rightOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" /> {/* Cyan */}
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>

        {/* Clip path of the inner white shield to crop the buildings */}
        <clipPath id="innerShieldClip">
          <path d="M 100,22 C 55,22 34,51 34,95 C 34,131 74,166 100,192 C 126,166 166,131 166,95 C 166,51 145,22 100,22 Z" />
        </clipPath>
      </defs>

      {/* 1. Outer Location Pin / Shield with Center Division */}
      {/* Left side outer shield */}
      <path
        d="M 100,10 C 45,10 20,45 20,95 C 20,140 70,180 100,210 L 100,10 Z"
        fill="url(#leftOuterGrad)"
      />
      {/* Right side outer shield */}
      <path
        d="M 100,10 C 155,10 180,45 180,95 C 180,140 130,180 100,210 L 100,10 Z"
        fill="url(#rightOuterGrad)"
      />

      {/* 2. Inner White Shield */}
      <path
        d="M 100,22 C 55,22 34,51 34,95 C 34,131 74,166 100,192 C 126,166 166,131 166,95 C 166,51 145,22 100,22 Z"
        fill="#FFFFFF"
      />

      {/* 3. Buildings Section (Clipped to the Inner Shield shape) */}
      <g clipPath="url(#innerShieldClip)">
        {/* Building 1 (Far Left) */}
        <rect x="42" y="105" width="18" height="60" fill="#1D4ED8" opacity="0.8" />
        
        {/* Building 2 (Mid Left) */}
        <rect x="64" y="82" width="22" height="85" fill="#2563EB" opacity="0.9" />
        
        {/* Building 3 (Center Tallest - Left Half) */}
        <path d="M 88,165 L 88,60 L 100,53 L 100,165 Z" fill="#1D4ED8" />
        
        {/* Building 4 (Center Tallest - Right Half) */}
        <path d="M 100,165 L 100,53 L 112,60 L 112,165 Z" fill="#2563EB" />
        
        {/* Building 5 (Mid Right) */}
        <rect x="114" y="88" width="22" height="80" fill="#0EA5E9" opacity="0.9" />
        
        {/* Building 6 (Far Right) */}
        <rect x="138" y="108" width="18" height="60" fill="#06B6D4" opacity="0.85" />
      </g>

      {/* 4. Circuit Traces & Nodes Overlay (Green) */}
      <g id="circuitOverlay">
        {/* Connections/Tracks */}
        <path
          d="M 55,135 L 80,122 L 100,115 L 120,122 L 145,135"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 100,115 L 100,185"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 100,132 L 80,152 L 80,175"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 100,132 L 120,152 L 120,175"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Nodes (Green with White Core) */}
        {/* Center Top */}
        <circle cx="100" cy="115" r="6" fill="#10B981" />
        <circle cx="100" cy="115" r="2.5" fill="#FFFFFF" />

        {/* Mid Left */}
        <circle cx="80" cy="122" r="6" fill="#10B981" />
        <circle cx="80" cy="122" r="2.5" fill="#FFFFFF" />

        {/* Mid Right */}
        <circle cx="120" cy="122" r="6" fill="#10B981" />
        <circle cx="120" cy="122" r="2.5" fill="#FFFFFF" />

        {/* Far Left */}
        <circle cx="55" cy="135" r="6" fill="#10B981" />
        <circle cx="55" cy="135" r="2.5" fill="#FFFFFF" />

        {/* Far Right */}
        <circle cx="145" cy="135" r="6" fill="#10B981" />
        <circle cx="145" cy="135" r="2.5" fill="#FFFFFF" />

        {/* Branch End Left */}
        <circle cx="80" cy="175" r="4.5" fill="#10B981" />
        <circle cx="80" cy="175" r="1.8" fill="#FFFFFF" />

        {/* Branch End Right */}
        <circle cx="120" cy="175" r="4.5" fill="#10B981" />
        <circle cx="120" cy="175" r="1.8" fill="#FFFFFF" />

        {/* Center Trunk End */}
        <circle cx="100" cy="185" r="4.5" fill="#10B981" />
        <circle cx="100" cy="185" r="1.8" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
