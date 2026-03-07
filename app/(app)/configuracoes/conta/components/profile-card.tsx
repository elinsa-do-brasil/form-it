import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRound } from "lucide-react";
import { ProfileForm } from "./profile-form";

type ProfileCardUser = {
  name?: string | null;
  username?: string | null;
  image?: string | null;
};

export function ProfileCard({ user }: { user: ProfileCardUser }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4" />
          Perfil
        </CardTitle>
        <CardDescription>
          Atualize suas informações principais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm user={user} />
      </CardContent>
    </Card>
  );
}
