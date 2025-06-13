import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"
import GoogleLogin from "@modules/layout/templates/nav/google-login"
import { useTranslation } from "react-i18next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(login, null)
  const { t } = useTranslation()

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1
        className="
        relative
        text-3xl font-semibold uppercase mb-6
        after:content-['']
        after:absolute
        after:left-0 after:bottom-0
        after:w-full
        after:h-1
        after:bg-mysGreen-100
        "
      >
        {t("login.title")}
      </h1>
      {/* <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Sign in to access an enhanced shopping experience.
      </p> */}
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t("login.email")}
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label={t("login.password")}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            ¿Has olvidado tu contraseña?{" "}
            <LocalizedClientLink
              href="/reset-password"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Haz click aquí
            </LocalizedClientLink>
          </p>
        </div>
        <SubmitButton
          data-testid="sign-in-button"
          className="w-full mt-4 uppercase font-dmSans"
        >
          {t("login.login_button")}
        </SubmitButton>
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 text-sm font-medium">O</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        <GoogleLogin />
      </form>
      <span className="text-center  text-ui-fg-base text-small-regular mt-6">
        {t("login.register_link")}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          {t("login.register_button")}
        </button>
        .
      </span>
    </div>
  )
}

export default Login
