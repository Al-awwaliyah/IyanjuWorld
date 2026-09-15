import { Outlet } from "react-router-dom";
import BackButton from "../components/layout/BackButton";

export default function BusinessLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-ink-900">
      <BackButton />
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
