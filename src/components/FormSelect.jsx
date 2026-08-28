import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FormSelect({ value, onValueChange, options, placeholder }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:ring-0">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-zinc-100 focus:bg-zinc-800">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}