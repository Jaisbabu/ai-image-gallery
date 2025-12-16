import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2
                   w-5 h-5 text-purple-400"
      />

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search by tags or description..."
        className="
          w-full pl-12 pr-12 py-3
          bg-white/10
          border border-white/20
          rounded-xl
          text-white
          placeholder-purple-300/50
          focus:outline-none
          focus:ring-2 focus:ring-purple-500
          focus:border-transparent
          transition
        "
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute right-4 top-1/2 -translate-y-1/2
            text-purple-400 hover:text-white transition
          "
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;


