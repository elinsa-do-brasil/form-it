import { CreateOrganizationForm } from "@/components/organizations/create-organization-form";

export const metadata = {
  title: "Criar Organização | Raauth",
  description: "Crie uma nova organização ou workspace no Raauth",
};

export default function CreateOrganizationPage() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Criar Organização
          </h1>
          <p className="text-muted-foreground">
            Configure seu novo workspace para convidar membros e colaborar.
          </p>
        </div>
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
