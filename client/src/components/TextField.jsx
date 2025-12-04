const TextField = ({
  register,
  name,
  placeholder,
  error,
  type = "text",
  value,
  onChange,
  required = false,
}) => {
  // 🧩 Initialize an empty object to hold input properties
  let inputProps = {};

  // If using React Hook Form
  if (register) {
    inputProps = register(name, { required });
  } 
  // Otherwise, use manual value/onChange for controlled inputs
  else {
    inputProps = { name, value, onChange };
  }

  return (
    <div className="form-control w-full mb-2">
      <input
        type={type}
        {...inputProps}
        placeholder={placeholder}
        className={`input input-md w-full bg-gray-200 text-black border rounded-md p-2 outline-none ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-200 focus:ring-blue-500"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
};

export default TextField;
