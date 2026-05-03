"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef } from "react";

type Props = {
  onToken: (token: string) => void;
  onClear?: () => void;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const CaptchaWidget = forwardRef<TurnstileInstance | null, Props>(
  function CaptchaWidget({ onToken, onClear }, ref) {
    if (!SITE_KEY) {
      if (process.env.NODE_ENV !== "production") {
        return (
          <div className="text-xs text-amber-400/70 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
            NEXT_PUBLIC_TURNSTILE_SITE_KEY missing — captcha disabled in dev
          </div>
        );
      }
      return null;
    }
    return (
      <div className="flex justify-center">
        <Turnstile
          ref={ref}
          siteKey={SITE_KEY}
          onSuccess={onToken}
          onError={() => onClear?.()}
          onExpire={() => onClear?.()}
          options={{ theme: "dark", size: "flexible" }}
        />
      </div>
    );
  }
);

export default CaptchaWidget;
export type { TurnstileInstance };
