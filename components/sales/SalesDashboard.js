import OverviewCards from "@/components/kam/OverviewCards";
import Topbar from "@/components/kam/Topbar";
import SalesSidebar from "./SalesSidebar";
import SalesQueue from "./SalesQueue";

export default function SalesDashboard({ session }) {
  return (
    <main className="portal">
      <SalesSidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="dashboard-body">
          <div className="dashboard-title-row">
            <div>
              <h1>Overview</h1>
              <p>Key Account Performance &amp; Activity</p>
            </div>
          </div>
          <OverviewCards session={session} />
          <SalesQueue />
        </div>
      </section>
    </main>
  );
}
