import { redirect } from "next/navigation";

// Journey maps merged into Explore — keep route for bookmarks.
export default function JourneyMapsRedirect() {
  redirect("/explore");
}
