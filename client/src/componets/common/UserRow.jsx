import React from "react";

const UserRow = ({ user }) => {
  return (
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h6 className="mb-1">{user.name}</h6>
          </div>

          <div className="col-md-6">
            <p className="text-muted mb-0">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRow;