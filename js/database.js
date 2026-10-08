import { db } from "./firebase.js";

import {
  get,
  onValue,
  push,
  ref,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

export async function getUserProfile(uid) {
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function createPost(user, caption, imageBase64) {
  const profile = await getUserProfile(user.uid);

  if (!profile) {
    throw new Error("لم يتم العثور على ملفك الشخصي.");
  }

  const postRef = push(ref(db, "posts"));

  const post = {
    id: postRef.key,
    userId: user.uid,
    name: profile.name || "مستخدم sky7",
    username: profile.username || "",
    profileImage: profile.profileImage || "",
    verified: profile.verified === true,
    caption: caption.trim(),
    imageBase64,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: serverTimestamp()
  };

  await push(ref(db, "posts"), post);
}

export function listenToPosts(callback, onError = console.error) {
  return onValue(
    ref(db, "posts"),
    snapshot => {
      const posts = [];

      snapshot.forEach(child => {
        posts.push({ key: child.key, ...child.val() });
      });

      posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(posts);
    },
    onError
  );
}
