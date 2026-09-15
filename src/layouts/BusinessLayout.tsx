import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BarChart3, LayoutDashboard, MessageSquare, Package, Settings, ShoppingBag, Store, Users, WalletCards } from "lucide-react";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import MobileNavigation from "../components/layout/MobileNavigation";
import BackButton from "../components/layout/BackButton";
import { useAuth } from "../hooks/useAuth";
const items=[
{label:"Dashboard",to:"/business/dashboard",icon:<LayoutDashboard className="h-5 w-5"/>},
{label:"Products",to:"/business/products",icon:<Package className="h-5 w-5"/>},
{label:"Orders",to:"/business/orders",icon:<ShoppingBag className="h-5 w-5"/>},
{label:"Customers",to:"/business/customers",icon:<Users className="h-5 w-5"/>},
{label:"Earnings",to:"/business/earnings",icon:<BarChart3 className="h-5 w-5"/>},
{label:"Payouts",to:"/business/payouts",icon:<WalletCards className="h-5 w-5"/>},
{label:"Messages",to:"/business/messages",icon:<MessageSquare className="h-5 w-5"/>},
{label:"Settings",to:"/business/settings",icon:<Settings className="h-5 w-5"/>},
];
export default function BusinessLayout(){const [mobileOpen,setMobileOpen]=useState(false);const location=useLocation();const {profile}=useAuth();const title=items.find(i=>location.pathname.startsWith(i.to))?.label??"Business";return <div className="iyw-role-shell min-h-screen bg-slate-50 text-ink-900"><DashboardSidebar brand="IyanjuWorld" items={items} mobileOpen={mobileOpen} onMobileClose={()=>setMobileOpen(false)} footerItems={[{label:"Back to marketplace",to:"/",icon:<Store className="h-5 w-5"/>}]}/><div className="flex min-h-screen flex-col lg:pl-72"><DashboardHeader title={title} description="Business management" userName={profile?.full_name} onMenuClick={()=>setMobileOpen(true)} notificationPath="/business/messages" profilePath="/business/settings"/><main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6"><BackButton className="px-0 pt-0"/><Outlet/></main></div><MobileNavigation isAuthenticated/></div>}
