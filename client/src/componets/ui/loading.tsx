import React from "react";
import { FaSpinner } from "react-icons/fa";

type LoadingProps = {
  message?: string;
};

const Loading: React.FC<LoadingProps> = ({ message = "Loading..." }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        backgroundColor: "#ffffff",
        zIndex: 9999,
      }}
    >
      <FaSpinner
        style={{
          width: "2.5rem",
          height: "2.5rem",
          color: "#6366f1",
          animation: "loading-spin 1s linear infinite",
        }}
      />
      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#6b7280" }}>
        {message}
      </p>
      <style>
        {`
          @keyframes loading-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;