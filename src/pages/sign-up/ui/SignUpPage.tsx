import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { signUpSchema, type SignUpValues } from "../model/schema";
import { Button } from "@/shared/ui/Button";
import { FieldLabel } from "@/shared/ui/FieldLabel";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";
import { useSignUp } from "@/features/auth";
import { ApiError } from "@/shared/api/client";

export function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", agree: true },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signUp.mutateAsync({ email, password });
      await navigate({ to: "/" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("email", { message: "Пользователь с таким email уже существует" });
        return;
      }
      const message = "Не удалось создать аккаунт. Попробуйте ещё раз.";
      setError("root", { message });
    }
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

        <h1 className="text-[32px] font-medium leading-[1.1] tracking-tight text-graphite">
          Создайте аккаунт.
        </h1>
        <p className="mt-2.5 mb-7 text-[15px] leading-relaxed text-distant-graphite">
          Это займёт минуту. Медкарту заполните позже.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
          <FieldLabel htmlFor="name">Имя и фамилия</FieldLabel>
          <Input
            id="name"
            icon="user"
            autoComplete="name"
            placeholder="Елена Марш"
            invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && (
            <p className="-mt-2 text-[12.5px] text-clinic-coral">{errors.name.message}</p>
          )}

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
            autoComplete="new-password"
            placeholder="Минимум 8 символов"
            invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && (
            <p className="-mt-2 text-[12.5px] text-clinic-coral">{errors.password.message}</p>
          )}

          <label className="mt-1 mb-1 flex items-start gap-2.5 text-[13px] leading-snug text-soft-graphite">
            <input type="checkbox" className="mt-0.5 accent-clinic-coral" {...register("agree")} />
            <span>
              Я принимаю{" "}
              <a href="#" className="font-medium text-graphite border-b border-mist-graphite">
                Условия использования
              </a>{" "}
              и{" "}
              <a href="#" className="font-medium text-graphite border-b border-mist-graphite">
                Политику конфиденциальности
              </a>
              , включая согласие на обработку персональных данных.
            </span>
          </label>
          {errors.agree && (
            <p className="-mt-1 text-[12.5px] text-clinic-coral">{errors.agree.message}</p>
          )}

          {errors.root && (
            <p className="-mt-1 text-[12.5px] text-clinic-coral">{errors.root.message}</p>
          )}

          <Button type="submit" size="lg" full disabled={isSubmitting}>
            {isSubmitting ? "Создаём…" : "Зарегистрироваться"}
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
          Уже есть аккаунт?{" "}
          <Link to="/sign-in" className="font-medium text-graphite border-b border-mist-graphite">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
