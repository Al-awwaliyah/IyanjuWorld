import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
