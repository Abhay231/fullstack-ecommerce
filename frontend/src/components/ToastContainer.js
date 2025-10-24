import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../store/slices/toastSlice';
import Toast from './Toast';

const ToastContainer = () => {
  const { toasts } = useSelector(state => state.toast);
  const dispatch = useDispatch();

  const handleRemoveToast = (id) => {
    dispatch(removeToast(id));
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] w-96 max-w-sm space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={handleRemoveToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
