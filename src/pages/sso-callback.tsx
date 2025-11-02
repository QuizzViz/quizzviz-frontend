import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
        <h1 className="mt-4 text-xl font-medium text-gray-900 sm:text-2xl">
          Redirecting to dashboard...
        </h1>
        <p className="mt-2 text-gray-600">
          Please wait while we log you in.
        </p>
      </div>
      <div className="invisible">
        {/* This is the actual redirect component that will do the work */}
        <AuthenticateWithRedirectCallback redirectUrl="/dashboard" />
      </div>
    </div>
  );
}