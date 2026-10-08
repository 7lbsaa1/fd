import { registerAccount, authErrorMessage } from "./auth.js";
import { compressImage } from "./imageCompression.js";

const form = document.getElementById("registrationForm");
const message = document.getElementById("formMessage");
const submit = document.getElementById("submitButton");

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "";

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    message.textContent = "كلمتا المرور غير متطابقتين.";
    return;
  }

  submit.disabled = true;
  submit.textContent = "جارٍ إنشاء الحساب…";

  try {
    const imageFile = document.getElementById("profileImage").files[0];
    const profileImage = imageFile ? await compressImage(imageFile) : "";

    await registerAccount({
      name: document.getElementById("name").value,
      username: document.getElementById("username").value,
      email: document.getElementById("email").value,
      password,
      profileImage,
      bio: document.getElementById("bio").value
    });

    window.location.replace("/profile");
  } catch (error) {
    message.textContent = authErrorMessage(error);
    submit.disabled = false;
    submit.textContent = "إنشاء الحساب";
  }
});
