import { useState } from "react";
import Moderator_panel from "../components/admin_panel/Moderator_panel";
import Admin_panel from "../components/admin_panel/Admin_panel";
import type { CommunityData } from "../components/post_area/PostArea";

export default function Comm_settings() {
  const [communityData, setCommunityData] = useState<CommunityData | null>(
    null,
  );
  const [isOwner, setIsOwner] = useState(true);

  // Pobierz rolę z danych
  const role = communityData?.currentUserRole;

  return (
    <main>
      {/* Musisz przekazać role jako prop! */}
      {isOwner && <Admin_panel role={role} />}
      {!isOwner && <Moderator_panel role={role} />}
    </main>
  );
}
