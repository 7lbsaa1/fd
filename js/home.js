import { requireActiveUser, logout } from "./auth.js";
import { createPost, listenToPosts } from "./database.js";
import { compressImage } from "./imageCompression.js";

const $ = selector => document.querySelector(selector);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function initials(name = "") {
  return escapeHTML(name.trim().charAt(0) || "S");
}

function renderPosts(posts) {
  const feed = $("#feed");

  if (!posts.length) {
    feed.innerHTML = '<div class="glass-card empty-state">لا توجد صور بعد — كن أول من يشارك صورة!</div>';
    return;
  }

  feed.innerHTML = posts.map(post => `
    <article class="glass-card post-card">
      <header class="post-header">
        ${
          post.profileImage
            ? `<img class="avatar" src="${escapeHTML(post.profileImage)}" alt="">`
            : `<div class="avatar">${initials(post.name)}</div>`
        }
        <div class="post-author">
          <strong>
            ${escapeHTML(post.name || "مستخدم sky7")}
            ${post.verified ? '<span class="verified" title="حساب موثق">✓</span>' : ""}
          </strong>
          <span class="muted">@${escapeHTML(post.username || "sky7")}</span>
        </div>
        <time class="muted">${post.createdAt ? new Date(post.createdAt).toLocaleString("ar") : "الآن"}</time>
      </header>

      ${post.caption ? `<p class="post-caption">${escapeHTML(post.caption)}</p>` : ""}
      <img class="post-image" src="${escapeHTML(post.imageBase64)}" alt="صورة منشورة">

      <footer class="post-footer">
        <span>♡ ${Number(post.likesCount || 0)} إعجاب</span>
        <span>تعليقات ${Number(post.commentsCount || 0)}</span>
        <button class="quiet-button" type="button"
                data-download="${escapeHTML(post.imageBase64)}">حفظ الصورة</button>
      </footer>
    </article>
  `).join("");
}

$("#feed").addEventListener("click", event => {
  const button = event.target.closest("[data-download]");
  if (!button) return;

  const link = document.createElement("a");
  link.href = button.dataset.download;
  link.download = `sky7-${Date.now()}.jpg`;
  link.click();
});

$("#postImage").addEventListener("change", event => {
  const file = event.target.files[0];
  const preview = $("#imagePreview");

  if (!file) {
    preview.innerHTML = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    $("#uploadStatus").textContent = "الملف المختار ليس صورة.";
    event.target.value = "";
    return;
  }

  const url = URL.createObjectURL(file);
  preview.innerHTML = `<img src="${url}" alt="معاينة الصورة">`;
  $("#uploadStatus").textContent = "جاهزة للضغط والنشر";
});

$("#postForm").addEventListener("submit", async event => {
  event.preventDefault();

  const file = $("#postImage").files[0];
  const button = $("#postButton");

  if (!file) {
    $("#uploadStatus").textContent = "اختر صورة أولًا.";
    return;
  }

  button.disabled = true;
  button.textContent = "جارٍ تجهيز الصورة…";

  try {
    const imageBase64 = await compressImage(file);
    await createPost(
      window.sky7User,
      $("#caption").value,
      imageBase64
    );

    $("#caption").value = "";
    $("#postImage").value = "";
    $("#imagePreview").innerHTML = "";
    $("#uploadStatus").textContent = "تم نشر الصورة بنجاح.";
  } catch (error) {
    $("#uploadStatus").textContent = error.message || "تعذر نشر الصورة.";
  } finally {
    button.disabled = false;
    button.textContent = "نشر الصورة";
  }
});

$("#logoutButton").addEventListener("click", logout);

const session = await requireActiveUser();

if (session) {
  window.sky7User = session.user;

  $("#welcomeName").textContent = session.profile.name || "مستخدم sky7";
  $("#welcomeAvatar").textContent = initials(session.profile.name);
  $("#composerAvatar").textContent = initials(session.profile.name);

  if (session.profile.profileImage) {
    $("#welcomeAvatar").innerHTML =
      `<img src="${escapeHTML(session.profile.profileImage)}" alt="">`;
    $("#composerAvatar").innerHTML =
      `<img src="${escapeHTML(session.profile.profileImage)}" alt="">`;
  }

  listenToPosts(renderPosts, error => {
    console.error(error);
    $("#feed").innerHTML =
      '<div class="glass-card empty-state">تعذر تحميل المنشورات. تحقق من إعدادات Firebase.</div>';
  });
}
