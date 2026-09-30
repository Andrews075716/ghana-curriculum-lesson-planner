import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getTeacherProfileForUser } from "@/server/services/auth.service";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.teacherProfileId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Your account doesn&apos;t have a teacher profile to edit.
      </div>
    );
  }

  const profile = await getTeacherProfileForUser(user.teacherProfileId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Keep your teacher profile up to date.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Teacher Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm initialProfile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
