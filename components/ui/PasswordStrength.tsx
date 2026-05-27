"use client";

interface Props {
  password: string;
}

function score(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const LEVELS = [
  { label: "Too short", color: "bg-red-500" },
  { label: "Weak", color: "bg-red-400" },
  { label: "Fair", color: "bg-amber-400" },
  { label: "Good", color: "bg-emerald-400" },
  { label: "Strong", color: "bg-emerald-500" },
];

export default function PasswordStrength({ password }: Props) {
  if (!password) return null;
  const s = score(password);
  const { label, color } = LEVELS[s];

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= s ? color : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${s <= 1 ? "text-red-400" : s === 2 ? "text-amber-400" : "text-emerald-400"}`}>
        {label}
        {s <= 1 && password.length < 8 && " - at least 8 characters"}
        {s === 1 && password.length >= 8 && " - add uppercase, numbers or symbols"}
        {s === 2 && " - add more variety"}
      </p>
    </div>
  );
}
