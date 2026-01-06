import React from 'react';

function Card({ children, onClick, className = '', hoverable = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-5 shadow-sm border border-gray-100
        ${hoverable ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
