import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  get,
  ref,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

function waitForAuth() {
  return new Promise((resolve, reject) => {
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js")
      .then(({ onAuthStateChanged }) => {
        let unsubscribe;

        unsubscribe = onAuthStateChanged(
          auth,
          user => {
            unsubscribe();
            resolve(user);
          },
          error => {
            unsubscribe();
            reject(error);
          }
        );
      })
      .catch(reject);
  });
}

export async function registerAccount({
  name,
  username,
  email,
  password,
  profileImage = "",
  coverImage = "",
  bio = ""
}) {
  const cleanUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9._]{3,24}$/.test(cleanUsername)) {
    throw new Error("اسم المستخدم يجب أن يكون 3–24 حرفًا إنجليزيًا أو رقمًا.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  const uid = credential.user.uid;
  const usernameRef = ref(db, `usernames/${cleanUsername}`);

  try {
    const result = await runTransaction(usernameRef, current =>
      current === null ? uid : undefined
    );

    if (!result.committed) {
      throw new Error("اسم المستخدم مستخدم بالفعل.");
    }

    await set(ref(db, `users/${uid}`), {
      uid,
      name: name.trim(),
      username: cleanUsername,
      email: email.trim(),
      profileImage,
      coverImage,
      bio: bio.trim(),
      verified: false,
      blocked: false,
      createdAt: Date.now()
    });

    return credential.user;
  } catch (error) {
    await deleteUser(credential.user).catch(() => {});
    throw error;
  }
}

export async function loginAccount(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  const snapshot = await get(ref(db, `users/${credential.user.uid}`));
  const profile = snapshot.exists() ? snapshot.val() : null;

  if (profile?.blocked === true) {
    window.location.replace("/block");
    return null;
  }

  return credential.user;
}

export async function requireActiveUser() {
  const user = await waitForAuth();

  if (!user) {
    window.location.replace("/login");
    return null;
  }

  const snapshot = await get(ref(db, `users/${user.uid}`));
  const profile = snapshot.exists() ? snapshot.val() : null;

  if (profile?.blocked === true) {
    window.location.replace("/block");
    return null;
  }

  if (!profile) {
    await signOut(auth);
    window.location.replace("/registration");
    return null;
  }

  return { user, profile };
}

export async function logout() {
  await signOut(auth);
  window.location.replace("/login");
}

export function authErrorMessage(error) {
  const code = error?.code || "";

  const messages = {
    "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحة.",
    "auth/email-already-in-use": "هذا البريد مسجل مسبقًا.",
    "auth/weak-password": "كلمة المرور ضعيفة؛ استخدم 6 أحرف على الأقل.",
    "auth/too-many-requests": "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.",
    "auth/network-request-failed": "تعذر الاتصال. تحقق من الإنترنت."
  };

  return messages[code] || error?.message || "حدث خطأ، حاول مرة أخرى.";
}
