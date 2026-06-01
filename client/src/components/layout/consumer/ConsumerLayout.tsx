import { Outlet } from "react-router-dom";
import ConsumerNavbar from "./ConsumerNavbar";
import ConsumerFooter from "./ConsumerFooter";

export default function ConsumerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ConsumerNavbar />
      <main className="pt-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <Outlet />
        </div>
      </main>
      <ConsumerFooter />
    </div>
  );
}
