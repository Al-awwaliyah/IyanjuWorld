import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Activity, Bike, LayoutDashboard, MessageSquare, Settings, WalletCards } from "lucide-react";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import MobileNavigation from "../components/layout/MobileNavigation";
import BackButton from "../components/layout/BackButton";
import { useAuth } from "../hooks/useAuth";
const items=[
{label:"Dashboard",to:"/rider/dashboard",icon:<LayoutDashboard className="h-5 w-5"/>},
{label:"Requests",to:"/rider/requests",icon:<Activity className="h-5 w-5"/>},
{label:"Deliveries",to:"/rider/deliveries",icon:<Bike className="h-5 w-5"/>},
{label:"Earnings",to:"/rider/earnings",icon:<WalletCards className="h-5 w-5"/>},
{label:"Messages",to:"/rider/messages",icon:<MessageSquare className="h-5 w-5"/>},
{label:"Profile",to:"/rider/profile",icon:<Settings className="h-5 w-5"/>},
];
export default function RiderLayout(){const [mobileOpen,setMobileOpen]=useState(false);const location=useLocation();const {profile}=useAuth();const title=items.find(i=>location.pathname.startsWith(i.to))?.label??"Rider";return <div className="iyw-role-shell min-h-screen bg-slate-50 text-ink-900"><DashboardSidebar brand="IyanjuWorld" items={items} mobileOpen={mobileOpen} onMobileClose={()=>setMobileOpen(false)} footerItems={[{label:"Back to marketplace",to:"/",icon:<Bike className="h-5 w-5"/>}]}/><div className="flex min-h-screen flex-col lg:pl-72"><DashboardHeader title={title} description="Delivery management" userName={profile?.full_name} onMenuClick={()=>setMobileOpen(true)} notificationPath="/rider/messages" profilePath="/rider/profile"/><main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6"><BackButton className="px-0 pt-0"/><Outlet/></main></div><MobileNavigation isAuthenticated/></div>}
