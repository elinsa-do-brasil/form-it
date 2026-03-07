import { CardContent as CardContentComponent } from "@/components/ui/card";

export function CardContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return(
    <CardContentComponent className="flex flex-col gap-2">
      {children}
    </CardContentComponent>
  )
}
