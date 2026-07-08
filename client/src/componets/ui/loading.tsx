import React from "react";
import { FaSpinner } from "react-icons/fa";

type LoadingProps = {
  message?: string;
};

const Loading: React.FC<LoadingProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <FaSpinner className="h-10 w-10 animate-spin text-indigo-500" />
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
};

export default Loading;