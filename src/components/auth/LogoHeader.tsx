import { FC } from "react";
import Image from "next/image";
import Link from "next/link";

// Small logo + title/description header used on auth screens
export const LogoHeader: FC<{ title: string; subtitle: string }>= ({ title, subtitle }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-20 h-20">
        <Link href="/">
          <Image src="/QuizzViz-logo.png" alt="QuizzViz Logo" fill className="object-contain drop-shadow" priority />
        </Link>
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
};
