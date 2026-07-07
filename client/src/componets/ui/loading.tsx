import React from "react";

type LoadingProps = {
  message?: string;
};

const Loading: React.FC<LoadingProps> = ({ message = "Loading..." }) => {
      <div className="flex min-h-screen items-center justify-center"></div>
  return <div className="p-4">{message}</div>;
};

export default Loading;