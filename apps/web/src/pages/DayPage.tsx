import { useNavigate, useParams } from "react-router-dom";
import { DayPanel } from "@/components/entries/DayPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { todayIso } from "@/lib/utils";

export default function DayPage() {
  const { date = todayIso() } = useParams();
  const navigate = useNavigate();
  return (
    <div className="main-content h-[calc(100vh-56px)] md:h-screen">
      <PageContainer className="flex h-full min-h-0 flex-col px-0 py-0 md:px-10 md:py-8">
        <DayPanel
          date={date}
          variant="page"
          isMobile
          onClose={() => navigate("/app/calendar")}
        />
      </PageContainer>
    </div>
  );
}
