interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search credentials..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onContextMenu={(e) => { e.preventDefault(); onChange(""); }}
      />
    </div>
  );
}
