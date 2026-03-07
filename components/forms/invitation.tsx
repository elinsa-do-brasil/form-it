"use client";

// dependências:
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// componentes:
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

// esquema do formulário
const formSchema = z.object({
  email: z.string().email({
    message: "Email inválido.",
  }),
})

export function InvitationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center w-full">
                  <Input 
                  {...field} 
                  className="rounded-r-none w-full"
                  placeholder="email@exemplo.com" 
                  autoComplete="off" 
                />
                <Button 
                  type="submit"
                  className="rounded-l-none"
                >Enviar convite</Button> 
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </form>
    </Form>
    )
}
