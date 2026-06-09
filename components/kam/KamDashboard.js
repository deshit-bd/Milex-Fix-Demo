import { FiPlusCircle } from "react-icons/fi";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import OverviewCards from "./OverviewCards";
import ActionQueue from "./ActionQueue";

export default function KamDashboard({ session }) {
  return (
    <main className="portal">
      <Sidebar />
      <section className="portal-content">
        <Topbar session={session} />
        <div className="dashboard-body">
          <div className="dashboard-title-row">
            <div>
              <h1>Overview</h1>
              <p>Key Account Performance &amp; Activity</p>
            </div>
            <Link className="recommendation-button" href="/kam/recommendations"><FiPlusCircle /> Create New Recommendation</Link>
          </div>
          <OverviewCards session={session} />
          <ActionQueue />
        </div>
      </section>
    </main>
  );
}
