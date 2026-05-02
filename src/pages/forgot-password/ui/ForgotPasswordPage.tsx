import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../model/schema";
import { Button } from "@/shared/ui/Button";
import { FieldLabel } from "@/shared/ui/FieldLabel";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    await new Promise((r) => setTimeout(r, 200));
    setSentEmail(email);
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-warm-paper">
      <div className="h-[60px] shrink-0" />
      <div className="flex flex-1 flex-col px-6 pb-8 pt-5">
        <Link
          to="/sign-in"
          className="mb-6 inline-flex items-center gap-1 self-start py-1.5 pr-2 text-[15px] font-medium text-clinic-coral"
        >
          <Icon name="chevron-left" size={18} stroke={2} />
          Назад
        </Link>

        {sentEmail === null ? (
          <>
            <h1 className="text-[32px] font-medium leading-[1.1] tracking-tight text-graphite">
              Восстановление пароля.
            </h1>
            <p className="mt-2.5 mb-7 text-[15px] leading-relaxed text-distant-graphite">
              Введите email от вашего аккаунта — пришлём ссылку для восстановления пароля.
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                icon="mail"
                autoComplete="email"
                placeholder="you@email.com"
                invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email && (
                <p className="-mt-2 text-[12.5px] text-clinic-coral">{errors.email.message}</p>
              )}

              <Button type="submit" size="lg" full disabled={isSubmitting}>
                Отправить ссылку
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-start">
            <div
              className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-clinic-coral"
              style={{
                background: "color-mix(in oklab, var(--color-clinic-coral) 12%, transparent)",
              }}
            >
              <Icon name="mail" size={26} stroke={1.8} />
            </div>
            <h1 className="text-[28px] font-medium leading-[1.15] tracking-tight text-graphite">
              Проверьте почту.
            </h1>
            <p className="mt-2.5 mb-7 text-[15px] leading-relaxed text-distant-graphite">
              Мы отправили ссылку на <span className="font-medium text-graphite">{sentEmail}</span>.
              Она действительна 30 минут.
            </p>
            <Button size="lg" full onClick={() => void navigate({ to: "/sign-in" })}>
              Вернуться ко входу
            </Button>
            <button
              type="button"
              onClick={() => setSentEmail(null)}
              className="mt-3 self-center bg-transparent text-[13.5px] text-distant-graphite"
            >
              Использовать другой email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
