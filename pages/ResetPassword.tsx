// pages/ResetPassword.tsx
import { useMemo, useState, type FormEvent, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { account } from "../src/lib/appwrite";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const userId = useMemo(() => params.get("userId") ?? "", [params]);
  const secret = useMemo(() => params.get("secret") ?? "", [params]);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (p1 !== p2) return setErr("Passwords do not match.");
    try {
      // Appwrite SDK expects 3 args: userId, secret, newPassword
      await account.updateRecovery(userId, secret, p1);
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Unable to reset password.");
    }
  }

  // redirect after success (avoid putting setTimeout in JSX)
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate("/login"), 1200);
    return () => clearTimeout(t);
  }, [done, navigate]);

  if (!userId || !secret) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p className="text-red-600">Invalid or expired link.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">Set a new password</h2>
      {done ? (
        <p className="text-green-600">Password updated. Redirecting…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            placeholder="New password"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            minLength={8}
            required
          />
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            placeholder="Confirm password"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            minLength={8}
            required
          />
          {!!err && <p className="text-red-600 text-sm">{err}</p>}
          <button className="w-full rounded-xl px-4 py-2 bg-black text-white">
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
