import React from 'react';
import { getJobFamily, getJobInnerSymbolSVG } from '@/constants/jobs';

interface JobEmblemProps {
  job?: string;
  jobName?: string;
  size?: number;
  className?: string;
}

export const JobEmblem: React.FC<JobEmblemProps> = ({ job, jobName, size = 32, className = '' }) => {
  const resolvedJob = job || jobName || '';
  const fam = getJobFamily(resolvedJob);
  const innerSvg = getJobInnerSymbolSVG(fam.familyKey);

  return (
    <svg
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px` }}
      viewBox="0 0 64 64"
      className={`shrink-0 drop-shadow select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="11"
        y="11"
        width="42"
        height="42"
        rx="6"
        transform="rotate(22.5 32 32)"
        fill={fam.hexDark}
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="2"
      />
      <rect
        x="11"
        y="11"
        width="42"
        height="42"
        rx="6"
        transform="rotate(67.5 32 32)"
        fill={fam.hexMain}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="2"
      />
      <polygon
        points="24,9 40,9 55,24 55,40 40,55 24,55 9,40 9,24"
        fill={fam.hexMain}
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <polygon
        points="26,14 38,14 50,26 50,38 38,50 26,50 14,38 14,26"
        fill={fam.hexDark}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <g dangerouslySetInnerHTML={{ __html: innerSvg }} />
    </svg>
  );
};

export default JobEmblem;

