import { FaEdit, FaTrash, FaPlus, FaSave } from "react-icons/fa";

const BaseButton = ({ children, icon, className, onClick }) => {
  return (
    <button
      type="button"
      className={`btn d-inline-flex align-items-center gap-2 ${className || ""}`}
      onClick={onClick}
    >
      {icon && <span className="d-inline-flex">{icon}</span>}
      {children}
    </button>
  );
};

export const EditButton = ({ onClick, children = "Edit" }) => (
  <BaseButton
    className="btn-outline-primary"
    icon={<FaEdit />}
    onClick={onClick}
  >
    {children}
  </BaseButton>
);

export const DeleteButton = ({ onClick, children = "Delete" }) => (
  <BaseButton
    className="btn-outline-danger"
    icon={<FaTrash />}
    onClick={onClick}
  >
    {children}
  </BaseButton>
);

export const AddButton = ({ onClick, children = "Add Category" }) => (
  <BaseButton
    className="btn-primary"
    icon={<FaPlus />}
    onClick={onClick}
  >
    {children}
  </BaseButton>
);

export const SaveButton = ({ onClick, children = "Save" }) => (
  <BaseButton
    className="btn-success"
    icon={<FaSave />}
    onClick={onClick}
  >
    {children}
  </BaseButton>
);