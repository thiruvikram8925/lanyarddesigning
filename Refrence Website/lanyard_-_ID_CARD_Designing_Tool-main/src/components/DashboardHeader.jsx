import { User, Bell, Search } from 'lucide-react';

export default function DashboardHeader({ user, breadcrumb = 'Home > Dashboard > Overview' }) {
  return (
    <header className="mb-6 flex w-full flex-col gap-2 px-1">
      <div className="flex min-h-[52px] items-center justify-between gap-4 rounded-2xl border border-[#eef2f6] bg-white/50 px-4 py-2 backdrop-blur-md">
        <div className="min-w-0 flex-1" aria-hidden="true" />

        <div className="flex items-center gap-4">
          <div className="relative hidden w-[300px] shrink-0 md:block mr-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#919191]">
              <Search size={16} />
            </div>
            <input
              type="search"
              placeholder="Search orders, designs..."
              className="w-[300px] rounded-xl border border-[#eef2f6] bg-[#f8faff] py-2 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#007bff]/20"
              aria-label="Global search"
            />
          </div>

          <button
            type="button"
            className="relative rounded-xl p-2 text-[#919191] transition-all hover:bg-[#5d5fef]/5 hover:text-[#5d5fef]"
          >
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          <div className="mx-1 h-8 w-px bg-[#eef2f6]" />

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-[#1a1a1a]">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#919191]">
                {user?.isAdmin ? 'gotek' : 'Customer'}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                user?.isAdmin
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-[#5d5fef] text-white shadow-lg shadow-[#5d5fef]/20'
              }`}
            >
              <User size={20} />
            </div>
          </div>
        </div>
      </div>

    </header>
  );
}
