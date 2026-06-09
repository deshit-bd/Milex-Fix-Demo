import OverviewCards from "@/components/kam/OverviewCards";
import Topbar from "@/components/kam/Topbar";
import LineManagerSidebar from "./LineManagerSidebar";
import LineManagerQueue from "./LineManagerQueue";

export default function LineManagerDashboard({ session }) {
  return (
    <main className="portal">
      <LineManagerSidebar />
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
          <LineManagerQueue />
        </div>
      </section>
    </main>
  );
}
