import { authErrorMessage, loginAccount } from "./auth.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("formMessage");
const submit = document.getElementById("submitButton");
const password = document.getElementById("password");

document.getElementById("togglePassword").addEventListener("click", event => {
  const hidden = password.type === "password";
  password.type = hidden ? "text" : "password";
  event.currentTarget.textContent = hidden ? "إخفاء" : "إظهار";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "";
  submit.disabled = true;
  submit.textContent = "جارٍ تسجيل الدخول…";

  try {
    const user = await loginAccount(
      document.getElementById("email").value,
      password.value
    );

    if (user) window.location.replace("/home");
  } catch (error) {
    message.textContent = authErrorMessage(error);
  } finally {
    submit.disabled = false;
    submit.textContent = "تسجيل الدخول";
  }
});
