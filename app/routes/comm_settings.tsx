import { useState } from "react";
import Moderator_panel from "../components/admin_panel/Moderator_panel";
import Admin_panel from "../components/admin_panel/Admin_panel";

export default function Comm_settings() {
  const [isOwner, setIsOwner] = useState(true);

  return (
    <main>
      {isOwner && <Admin_panel />}
      {!isOwner && <Moderator_panel></Moderator_panel>}
    </main>
  );
}
