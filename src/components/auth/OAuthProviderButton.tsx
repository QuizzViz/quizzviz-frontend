import { FC } from "react";

// Generic OAuth button with built-in Google icon and loading state
export const OAuthProviderButton: FC<{
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  text: string;
}> = ({ onClick, disabled, loading, text }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02]  active:scale-[0.98] flex items-center justify-center ${loading ? "opacity-70" : "hover:opacity-90"}`}
  >
    {loading ? (
      <svg className="animate-spin mr-2 h-4 w-4 text-primary-foreground" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="w-4 h-4 mr-2" aria-hidden>
        <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.7-37-5.1-54.8H272v103.8h146.9c-6.3 34.2-25 63.2-53.3 82.7v68h86.3c50.5-46.6 81.6-115.2 81.6-199.7z"/>
        <path fill="#34A853" d="M272 544.3c72.9 0 134.2-24.1 178.9-65.2l-86.3-68c-24 16.1-54.7 25.6-92.6 25.6-71 0-131.1-47.9-152.6-112.1H31.6v70.3C76 486.8 169 544.3 272 544.3z"/>
        <path fill="#FBBC05" d="M119.4 324.6c-10.4-31.2-10.4-65.9 0-97.1v-70.3H31.6c-42.1 84.2-42.1 183.5 0 267.7l87.8-70.3z"/>
        <path fill="#EA4335" d="M272 107.7c39.7-.6 77.8 14.7 106.9 42.7l80.2-80.2C404.8 24.5 342.9-.4 272 0 169 0 76 57.5 31.6 146.8l87.8 70.7C140.9 155.8 201 107.7 272 107.7z"/>
      </svg>
    )}
    {text}
  </button>
);
