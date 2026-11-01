// Minimal glob matching with the semantics the gateway uses too:
// `*` matches within one path segment, `**` matches any number of segments,
// `?` matches one character other than `/`. Paths use `/` and are relative
// to the site root.

export function isPattern(percorso: string): boolean {
  return /[*?[]/.test(percorso);
}

export function globToRegExp(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*" && pattern[i + 1] === "*") {
      const finoAllaBarra = pattern[i + 2] === "/";
      re += finoAllaBarra ? "(?:.*/)?" : ".*";
      i += finoAllaBarra ? 2 : 1;
    } else if (c === "*") {
      re += "[^/]*";
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

export function matches(pattern: string, percorso: string): boolean {
  return globToRegExp(pattern).test(percorso);
}
