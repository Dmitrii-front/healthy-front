import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { signInSchema, type SignInValues } from "../model/schema";
import { BrandMark } from "@/shared/ui/BrandMark";
import { Button } from "@/shared/ui/Button";
import { FieldLabel } from "@/shared/ui/FieldLabel";
import { Input } from "@/shared/ui/Input";
import { useSignIn } from "@/features/auth";
import { ApiError } from "@/shared/api/client";

export function SignInPage() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn.mutateAsync({ email, password });
      await navigate({ to: "/" });
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? "Неверный email или пароль"
          : "Не удалось войти. Попробуйте ещё раз.";
      setError("root", { message });
    }
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-warm-paper">
      <div className="h-[60px] shrink-0" />
      <div className="flex flex-1 flex-col px-6 pb-8 pt-8">
        <BrandMark className="mb-12" />

        <h1 className="text-[32px] font-medium leading-[1.1] tracking-tight text-graphite">
          Войти.
        </h1>
        <p className="mt-2.5 mb-7 text-[15px] leading-relaxed text-distant-graphite">
          Войдите, чтобы видеть визиты, находить врачей и пользоваться картой.
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

          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input
            id="password"
            type="password"
            icon="lock"
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="-mt-2 text-[12.5px] text-clinic-coral">{errors.password.message}</p>
          )}

          <div className="mt-1 mb-2 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-[13.5px] text-soft-graphite">
              <input type="checkbox" className="accent-clinic-coral" {...register("remember")} />
              Запомнить меня
            </label>
            <Link to="/forgot-password" className="text-[13.5px] font-medium text-clinic-coral">
              Забыли?
            </Link>
          </div>

          {errors.root && (
            <p className="-mt-1 text-[12.5px] text-clinic-coral">{errors.root.message}</p>
          )}

          <Button type="submit" size="lg" full disabled={isSubmitting}>
            {isSubmitting ? "Входим…" : "Войти"}
          </Button>

          <div className="my-2.5 flex items-center gap-3">
            <div className="h-px flex-1 bg-hairline" />
            <span className="text-[12px] text-distant-graphite">или</span>
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <Button type="button" variant="secondary" size="lg" full>
            Войти по полису
          </Button>
        </form>

        <p className="mt-auto pt-7 text-center text-[13.5px] text-distant-graphite">
          Впервые здесь?{" "}
          <Link to="/sign-up" className="font-medium text-graphite border-b border-mist-graphite">
            Создать аккаунт
          </Link>
        </p>
      </div>
    </div>
  );
}
