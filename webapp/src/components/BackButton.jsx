import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ className = '' }) {
  const nav = useNavigate();
  return (
    <button className={`btn btn-outline-secondary btn-sm ${className}`} onClick={() => nav(-1)}>
      ← Quay lại
    </button>
  );
}
