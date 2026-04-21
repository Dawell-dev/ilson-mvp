import React from 'react';

function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  name,
  required = false,
  disabled = false,
  error,
  helpText,
  className = ''
}) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label className="block text-[18px] font-bold text-[#1A1A18] mb-2">
          {label}
          {required && <span className="text-[#E85C1E] ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full px-5 py-4 text-[18px] font-medium
          border-2 rounded-2xl outline-none
          focus:border-[#E85C1E]
          disabled:bg-[#F7F5F2] disabled:text-[#888780]
          ${error ? 'border-[#EF4444]' : 'border-[#EDE8E2]'}
          bg-white text-[#1A1A18]
        `}
      />
      {error && (
        <p className="mt-2 text-[15px] text-[#EF4444]">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-2 text-[15px] text-[#888780]">{helpText}</p>
      )}
    </div>
  );
}

export default Input;
