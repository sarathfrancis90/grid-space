/**
 * GridSpace logo — green spreadsheet grid icon.
 */
interface GridSpaceLogoProps {
  size?: number;
}

export function GridSpaceLogo({ size = 24 }: GridSpaceLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      data-testid="gridspace-logo"
    >
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#0F9D58" />
      <line x1="2" y1="9" x2="22" y2="9" stroke="white" strokeWidth="1.5" />
      <line x1="2" y1="15" x2="22" y2="15" stroke="white" strokeWidth="1.5" />
      <line x1="9" y1="2" x2="9" y2="22" stroke="white" strokeWidth="1.5" />
      <line x1="15" y1="2" x2="15" y2="22" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}
