import { useMemo, useSyncExternalStore } from "react";

// The master's own session. Deliberately NOT the app's user/accessToken keys,
// so signing in here never touches (or is touched by) a club-admin session.
//   { email, envs: { prod: {status:'pending'|'ok'|'failed'|'expired', token?, error?}, ... } }
const KEY = "masterSession";
const EVENT = "master-session-changed";

const readRaw = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const parse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const write = (session) => {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
};

export const getMasterSession = () => parse(readRaw());

export const startMasterSession = (email, envKeys) =>
  write({ email, envs: Object.fromEntries(envKeys.map((k) => [k, { status: "pending" }])) });

export const setEnvResult = (envKey, result) => {
  const s = getMasterSession();
  if (!s) return; // signed out meanwhile
  s.envs[envKey] = result;
  write(s);
};

export const getEnvToken = (envKey) => {
  const e = getMasterSession()?.envs?.[envKey];
  return e?.status === "ok" ? e.token : null;
};

export const clearMasterSession = () => write(null);

const subscribe = (cb) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

export const useMasterSession = () => {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => parse(raw), [raw]);
};
