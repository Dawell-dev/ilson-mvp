import React from 'react';

function Card({ children, onClick, className = '', hoverable = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl p-5
        ${hoverable ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}
      `}
      style={{ background: '#FAFAF8', border: '1px solid #EDE8E2' }}
    >
      {children}
    </div>
  );
}

export default Card;
