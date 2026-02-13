/**
 * Split text utilities for typography animations.
 * Wraps words or characters in spans for GSAP targeting.
 */

export function splitToWords(element: HTMLElement): void {
  const text = element.textContent ?? "";
  element.textContent = "";
  const words = text.split(/\s+/).filter(Boolean);
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.setAttribute("data-word", "");
    span.textContent = word;
    element.appendChild(span);
    if (i < words.length - 1) {
      element.appendChild(document.createTextNode(" "));
    }
  });
}

export function splitToChars(element: HTMLElement): void {
  const text = element.textContent ?? "";
  element.textContent = "";
  const chars = text.split("");
  chars.forEach((char) => {
    const span = document.createElement("span");
    span.setAttribute("data-char", "");
    span.textContent = char;
    span.style.display = char === " " ? "inline" : "inline-block";
    element.appendChild(span);
  });
}

/**
 * After words are in [data-word] spans, group by offsetTop into lines.
 * Returns arrays of span elements, one array per visual line.
 */
export function groupWordsIntoLines(container: HTMLElement): HTMLElement[][] {
  const words = Array.from(container.querySelectorAll<HTMLElement>("[data-word]"));
  if (!words.length) return [];

  const lines: HTMLElement[][] = [];
  let lastTop = -9999;

  for (const word of words) {
    const top = word.offsetTop;
    if (lines.length === 0 || Math.abs(top - lastTop) > 2) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(word);
  }

  return lines;
}
