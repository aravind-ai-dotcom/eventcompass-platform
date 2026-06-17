import { redirect } from "next/navigation";

export default function SkoLoginRedirect() {
  redirect("/login");
}
