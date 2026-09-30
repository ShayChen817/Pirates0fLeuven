'use client';

import { useEffect, useState, type ReactNode } from 'react';

const DEVICE_W = 417;
const DEVICE_H = 876;

/** Scale the device down to fit the viewport; 1 on large screens. */
function useFit(reserveW: number) {
  const [state, setState] = useState<{ scale: number; bare: boolean }>({ scale: 1, bare: false });
  useEffect(() => {
    const update = () => {
      const bare = window.innerWidth < 640;
      const scale = Math.min(1, (window.innerHeight - 32) / DEVICE_H, (window.innerWidth - (window.innerWidth >= 1100 ? 484 : 48) - reserveW) / DEVICE_W);
      setState({ scale: Math.max(0.2, scale), bare });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [reserveW]);
  return state;
}

function StatusBar({ dark }: { dark: boolean }) {
  return (
    <div className={`relative z-30 flex h-[54px] shrink-0 items-end justify-between px-8 pb-2.5 ${dark ? 'bg-kbc-navy text-white' : 'bg-canvas text-ink'}`} aria-hidden="true">
      <span className="w-14 text-center text-[16px] font-semibold tracking-tight">9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.3A6.8 6.8 0 0 0 8 4a6.8 6.8 0 0 0-4.7 1.8l1.3 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.5c.5 0 1 .2 1.3.5L8 11.2 6.7 9.8c.3-.3.8-.5 1.3-.5Z"/></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity=".45"/></svg>
      </span>
    </div>
  );
}

/**
 * Realistic iPhone (Pro-style titanium frame, Dynamic Island, status bar, home indicator).
 * Screen content is supplied as `children` and fills between status bar and bottom.
 */
export function IPhone({ children, reserveWidth = 0, dark = false }: { children: ReactNode; reserveWidth?: number; dark?: boolean }) {
  const { scale, bare } = useFit(reserveWidth);

  if (bare) {
    // On a real phone the app is the screen.
    return (
      <div id="phone-screen" className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas">
        <div className={`h-[max(env(safe-area-inset-top),14px)] shrink-0 ${dark ? 'bg-kbc-navy' : 'bg-canvas'}`} />
        {children}
      </div>
    );
  }

  return (
    <div style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }} className="shrink-0">
      <div style={{ width: DEVICE_W, height: DEVICE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="relative">
        {/* Side buttons */}
        <span className="absolute -left-[3px] top-[150px] h-[34px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#8f8d88] to-[#cfcdc8]" />
        <span className="absolute -left-[3px] top-[210px] h-[64px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#8f8d88] to-[#cfcdc8]" />
        <span className="absolute -left-[3px] top-[288px] h-[64px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#8f8d88] to-[#cfcdc8]" />
        <span className="absolute -right-[3px] top-[236px] h-[100px] w-[4px] rounded-r-sm bg-gradient-to-l from-[#8f8d88] to-[#cfcdc8]" />
        {/* Titanium band */}
        <div className="absolute inset-0 rounded-[61px] bg-[linear-gradient(145deg,#d9d7d2_0%,#9d9b96_30%,#e4e2dd_52%,#8e8c87_78%,#c9c7c2_100%)] p-[3px] shadow-[0_32px_70px_-22px_#172f4140,0_8px_18px_-8px_#172f4130]">
          {/* Black bezel */}
          <div className="h-full w-full rounded-[58px] bg-[#0b0b0c] p-[10px]">
            {/* Screen */}
            <div id="phone-screen" className="relative flex h-full w-full flex-col overflow-hidden rounded-[47px] bg-canvas">
              <StatusBar dark={dark} />
              {/* Dynamic Island */}
              <div className="absolute left-1/2 top-[10px] z-50 h-[31px] w-[112px] -translate-x-1/2 rounded-full bg-[#08090b] shadow-[inset_0_0_0_1px_#ffffff12]" aria-hidden="true"><span className="absolute right-[13px] top-[9px] h-[12px] w-[12px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#17324a,#06090e_65%)] ring-1 ring-white/5" /></div>
              {children}
              {/* Home indicator */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink/85" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
