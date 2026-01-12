// pages/ForgotPassword.tsx
import { useState, type FormEvent } from "react";
import { account } from "../src/lib/appwrite";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const redirectUrl = `${window.location.origin}/reset-password`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await account.createRecovery(email, redirectUrl);
      setOk(true);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">Forgot password</h2>
      {ok ? (
        <p className="text-green-600">
          If the email exists, a reset link has been sent. Check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!!err && <p className="text-red-600 text-sm">{err}</p>}
          <button className="w-full rounded-xl px-4 py-2 bg-black text-white">
            Request reset link
          </button>
        </form>
      )}
    </div>
  );
}
