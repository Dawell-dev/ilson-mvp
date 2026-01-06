import React from 'react';

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'large',
  disabled = false,
  fullWidth = true,
  className = ''
}) {
  const baseStyles = 'font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-100',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 disabled:border-gray-300 disabled:text-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-gray-300',
    kakao: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 active:bg-yellow-600',
  };

  const sizes = {
    small: 'px-4 py-2 text-base',
    medium: 'px-6 py-3 text-lg',
    large: 'px-6 py-4 text-xl',  // 시니어용 큰 버튼
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Button;
