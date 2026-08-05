"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { expireCurrentDateIfDue } from "@/app/actions/expire-date";

function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const unit = (n: number, label: string) => `${n} ${label}${n === 1 ? "" : "s"}`;
  if (days === 0 && hours === 0) return "less than an hour";
  if (days === 0) return unit(hours, "hour");
  return `${unit(days, "day")} and ${unit(hours, "hour")}`;
}

export default function CheckInCountdown({
  deadlineMs,
  className,
}: {
  deadlineMs: number;
  className?: string;
}) {
  const router = useRouter();
  // null until mounted — avoids a server/client Date.now() hydration mismatch,
  // same pattern as useCountdown() above.
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    function update() {
      const left = deadlineMs - Date.now();
      setTimeLeft(left);

      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        expireCurrentDateIfDue().then((result) => {
          if (result.expired) router.refresh();
        });
      }
    }
    update();
    // Hour-level display doesn't need per-second ticks. Dev builds poll faster
    // to make expiry easier to test without waiting a full minute per tick.
    const tickMs = process.env.NODE_ENV === "development" ? 5_000 : 60_000;
    const id = setInterval(update, tickMs);
    return () => clearInterval(id);
  }, [deadlineMs, router]);

  return (
    <p className={className ?? "text-lg text-center text-[rgb(var(--fg)/0.7)] mt-4"}>
      {timeLeft === null ? (
        " "
      ) : timeLeft > 0 ? (
        <>
          Tick tock —{" "}
          <span className="font-semibold text-[rgb(var(--fg))]">{formatTimeLeft(timeLeft)}</span>{" "}
          to make this date happen
        </>
      ) : (
        "Wrapping up..."
      )}
    </p>
  );
}
