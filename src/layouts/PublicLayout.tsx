import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
