import { cn } from "@/lib/utils";

export default function PublicPageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-dvh overflow-hidden bg-black text-white", className)}>
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.018]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_28%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

