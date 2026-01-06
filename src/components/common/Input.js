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
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-lg font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
          w-full px-4 py-4 text-xl
          border-2 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:text-gray-500
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
      {error && (
        <p className="mt-2 text-base text-red-500">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-2 text-base text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

export default Input;
