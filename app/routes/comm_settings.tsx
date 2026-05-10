import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Moderator_panel from "../components/admin_panel/Moderator_panel";
import Admin_panel from "../components/admin_panel/Admin_panel";
import type { CommunityData } from "../components/post_area/PostArea";

export default function Comm_settings() {
  const { communityId } = useParams();
  const [communityData, setCommunityData] = useState<CommunityData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommData = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `http://localhost:5000/api/communities-by-id/${communityId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setCommunityData(data);
        }
      } catch (err) {
        console.error("Błąd:", err);
      } finally {
        setLoading(false);
      }
    };
    if (communityId) fetchCommData();
  }, [communityId]);

  const role = communityData?.currentUserRole;
  const isOwner = role?.role === "owner";

  if (loading) return <div>Ładowanie ustawień...</div>;

  return (
    <main>
      {role ? (
        isOwner ? (
          <Admin_panel role={role} />
        ) : (
          <Moderator_panel role={role} />
        )
      ) : (
        <p>Nie masz uprawnień do wyświetlenia tej strony.</p>
      )}
    </main>
  );
}
