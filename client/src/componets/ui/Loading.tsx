import React from "react";

type LoadingProps = {
  message?: string;
};

const Loading: React.FC<LoadingProps> = ({ message = "Loading..." }) => {
  return <div className="p-4">{message}</div>;
};

export default Loading;   