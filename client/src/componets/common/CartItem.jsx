import React from "react";
import { CCard, CCardBody, CButton } from "@coreui/react";

const CartItem = ({ item, onRemove }) => {
  return (
    <CCard className="mb-3 shadow-sm border-0">
      <CCardBody className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-1">{item.name}</h5>
          <span className="text-medium-emphasis">
            {item.price} €
          </span>
        </div>

        <CButton
          color="danger"
          variant="outline"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </CButton>
      </CCardBody>
    </CCard>
  );
};

export default CartItem;