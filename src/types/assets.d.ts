declare module '*.woff2' {
  const source: number;
  export default source;
}

declare module '*.ttf' {
  const source: number;
  export default source;
}

// Web-only stylesheet (expo-router web), imported for its side effects.
declare module '*.css';
