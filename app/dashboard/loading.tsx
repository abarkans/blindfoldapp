export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-dvh bg-black">
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <div className="max-w-sm mx-auto animate-pulse">
          <div className="rounded-3xl border border-white/16 bg-white/[0.03] p-6">
            <div className="h-4 w-28 bg-white/[0.075] rounded-full mb-5" />
            <div className="h-48 w-full bg-white/[0.075] rounded-2xl mb-5" />
            <div className="h-6 w-3/4 bg-white/[0.075] rounded-full mb-3" />
            <div className="h-4 w-full bg-white/[0.075] rounded-full mb-2" />
            <div className="h-4 w-2/3 bg-white/[0.075] rounded-full mb-7" />
            <div className="h-12 w-full bg-white/[0.075] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

