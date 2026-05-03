import React, { useState } from "react";
import styles from "./Search.module.css";
import SearchIcon from "@mui/icons-material/Search";

interface SearchProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onFocus?: () => void;
}

export default function Search({
  value,
  onChange,
  placeholder = "Wyszukaj...",
  onFocus,
}: SearchProps) {
  return (
    <div className={styles.searchBar}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        className={styles.searchInput}
      />
      <SearchIcon className={styles.searchIcon} />
    </div>
  );
}
