import React from "react";

interface LogoutIconProps {
  className?: string;
  size?: number;
}

export const LogoutIcon: React.FC<LogoutIconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path strokeDasharray="34" d="M12 4h-7c-0.55 0 -1 0.45 -1 1v14c0 0.55 0.45 1 1 1h7">
          <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0"/>
        </path>
        <path strokeDasharray="14" strokeDashoffset="14" d="M9 12h11.5">
          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" to="0"/>
        </path>
        <path strokeDasharray="8" strokeDashoffset="8" d="M20.5 12l-3.5 -3.5M20.5 12l-3.5 3.5">
          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" to="0"/>
        </path>
      </g>
    </svg>
  );
};
