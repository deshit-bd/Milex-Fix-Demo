"use client";

import RoleGuard from "@/components/shared/RoleGuard";
import RecommendationPage from "@/components/kam/recommendations/RecommendationPage";

export default function KamRecommendationsPage() {
  return (
    <RoleGuard allowedRole="KAM">
      {(session) => <RecommendationPage session={session} />}
    </RoleGuard>
  );
}
