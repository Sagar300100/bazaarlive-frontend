import React, { useEffect, useState } from "react";

type VerifyEmailGateProps = {
  email: string;
  emailVerified?: boolean;
  onSignOut: () => void;
  onResent: () => void | Promise<void>;
  children: React.ReactNode;
};

const VerifyEmailGate: React.FC<VerifyEmailGateProps> = ({
  email,
  emailVerified,
  onSignOut,
  onResent,
  children,
}) => {
  const [isVerified, setIsVerified] = useState<boolean>(!!emailVerified);

  useEffect(() => {
    setIsVerified(!!emailVerified);
  }, [emailVerified]);

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-6 shadow-lg text-center space-y-4">
        <h1 className="text-2xl font-bold">Verify your email to continue</h1>
        <p className="text-gray-300 text-sm">
          We’ve sent a verification link to{" "}
          <span className="font-semibold">{email || "your email address"}</span>.
          <br />
          Please click the link in that email, then sign in again.
        </p>

        <div className="flex flex-col gap-3 mt-4">
          <button
            className="w-full rounded-md bg-orange-500 py-2 font-semibold hover:bg-orange-600 transition"
            onClick={onResent}
          >
            Resend verification email
          </button>
          <button
            className="w-full rounded-md border border-gray-500 py-2 font-semibold hover:bg-gray-700 transition"
            onClick={onSignOut}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailGate;
