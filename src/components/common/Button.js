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
  const baseStyles = 'font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 border-none';

  const variants = {
    primary: 'text-white',
    secondary: 'text-[#888780]',
    outline: 'text-[#E85C1E]',
    danger: 'text-white',
    kakao: 'text-[#191919]',
  };

  const variantStyles = {
    primary: { background: disabled ? '#CCC' : '#E85C1E' },
    secondary: { background: '#F7F5F2', border: '1px solid #EDE8E2' },
    outline: { background: 'transparent', border: '2px solid #E85C1E' },
    danger: { background: '#EF4444' },
    kakao: { background: '#FEE500' },
  };

  const sizes = {
    small: 'px-5 py-3 text-[calc(16px*var(--font-scale,1))]',
    medium: 'px-6 py-4 text-[calc(18px*var(--font-scale,1))]',
    large: 'py-[20px] px-6 text-[calc(19px*var(--font-scale,1))]',  // 시니어용 큰 버튼
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={variantStyles[variant]}
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
