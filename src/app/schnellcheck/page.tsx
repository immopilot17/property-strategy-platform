import { redirect } from "next/navigation";

export default function Page() {
  // Leite zu Analyse mit Standard-Parametern um
  redirect("/analyse?goal=analyse");
}
