import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationForm } from "../forms/invitation";
import { Separator } from "../ui/separator";

interface InfosCardProps {
    organization: {
      name: string;
      slug: string;
      members: {
        user: {
          name: string;
          email: string;
        };
      }[];
    };
}
export function InfosCard({organization}: InfosCardProps){
  return(
    <Card>
      <CardHeader>
        
        <CardTitle className="text-2xl font-bold">{organization.name}</CardTitle>
        <CardDescription>@{organization.slug}</CardDescription>
      </CardHeader>
      <CardContent>
        Total de membros: {organization.members.length}
        <Separator className="my-4" />
        <InvitationForm />
      </CardContent>
    </Card>
  )
}