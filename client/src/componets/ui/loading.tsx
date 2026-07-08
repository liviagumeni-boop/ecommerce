import React from "react";

type LoadingProps = {
  message?: string;
};

const Loading: React.FC<LoadingProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <svg
        className="h-10 w-10 animate-spin text-indigo-500"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
};

export default Loading;