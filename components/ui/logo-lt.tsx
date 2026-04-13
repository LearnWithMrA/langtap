// ------------------------------------------------------------
// File: components/ui/logo-lt.tsx
// Purpose: Compact "LT" key logo as an inline React SVG component.
//          Rounded key border with L and T letterforms inside.
//          All fills default to currentColor for easy colour control.
// Depends on: nothing
// ------------------------------------------------------------

import type { SVGProps, ReactElement } from 'react'

// -- Types --------------------------------------------------

type LogoLtProps = SVGProps<SVGSVGElement>

// -- Component ----------------------------------------------

export function LogoLt(props: LogoLtProps): ReactElement {
  return (
    <svg
      viewBox="0 0 756 756"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="LangTap logo"
      role="img"
      {...props}
    >
      {/* Key border */}
      <mask id="lt-mask0" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="756" height="756">
        <path d="M0 0H756V756H0V0Z" fill="white" />
      </mask>
      <g mask="url(#lt-mask0)">
        <mask id="lt-mask1" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="756" height="756">
          <path d="M76 0H680C700.156 0 719.485 8.005 733.74 22.261C747.99 36.516 756 55.844 756 76V680C756 700.156 747.99 719.49 733.74 733.74C719.485 747.995 700.156 756 680 756H76C55.844 756 36.511 747.995 22.261 733.74C8.00499 719.49 0 700.156 0 680V76C0 55.844 8.00499 36.516 22.261 22.261C36.511 8.005 55.844 0 76 0Z" fill="white" />
        </mask>
        <g mask="url(#lt-mask1)">
          <path
            d="M76 0H680C700.157 0 719.485 8.005 733.74 22.261C747.99 36.516 756 55.844 756 76V680C756 700.157 747.99 719.49 733.74 733.74C719.485 747.995 700.157 756 680 756H76C55.844 756 36.511 747.995 22.261 733.74C8.00499 719.49 0 700.157 0 680V76C0 55.844 8.00499 36.516 22.261 22.261C36.511 8.005 55.844 0 76 0Z"
            stroke="currentColor"
            strokeWidth="98"
          />
        </g>
      </g>

      {/* L letterform */}
      <path
        d="M341.313 274.299V578.299C341.313 591.455 344.865 601.674 351.98 608.966C359.089 616.257 368.865 619.903 381.313 619.903H468.25V663.632H381.313C353.938 663.632 332.422 656.08 316.771 640.966C301.131 625.856 293.313 604.966 293.313 578.299V318.028H196.25V274.299H341.313Z"
        fill="currentColor"
      />

      {/* T letterform */}
      <path
        d="M293.079 187.828H378.413V97.162H426.413V187.828H541.079V231.558H426.413V405.433C426.413 415.391 429.522 423.219 435.746 428.912C441.965 434.594 450.413 437.433 461.079 437.433H535.746V481.162H461.079C435.829 481.162 415.736 474.235 400.809 460.37C385.876 446.495 378.413 428.183 378.413 405.433V231.558H293.079V187.828Z"
        fill="currentColor"
      />
    </svg>
  )
}
