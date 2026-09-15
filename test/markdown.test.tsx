import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { Markdown } from "../src/components/ui/markdown";

afterEach(cleanup);

function html(container: HTMLElement): string {
  return container.innerHTML;
}

describe("Markdown (assistant answer rendering)", () => {
  test("1. heading renders as <h2>, not literal ##", () => {
    const { container } = render(<Markdown>{"## Overview"}</Markdown>);
    expect(container.querySelector("h2")?.textContent).toBe("Overview");
    expect(html(container)).not.toContain("## Overview");
  });

  test("2. bold renders as <strong>, not literal **", () => {
    const { container } = render(<Markdown>{"**Important finding**"}</Markdown>);
    expect(container.querySelector("strong")?.textContent).toBe(
      "Important finding",
    );
    expect(html(container)).not.toContain("**");
  });

  test("3. bullet list renders as <ul>/<li>", () => {
    const { container } = render(
      <Markdown>{"- Finding A\n- Finding B"}</Markdown>,
    );
    expect(container.querySelector("ul")).not.toBeNull();
    expect(container.querySelectorAll("li").length).toBe(2);
  });

  test("4. numbered list renders as <ol>/<li>", () => {
    const { container } = render(
      <Markdown>{"1. Step one\n2. Step two"}</Markdown>,
    );
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelectorAll("li").length).toBe(2);
  });

  test("5. GFM table renders as <table> with header and right-aligned column", () => {
    const md = "| Method | Score |\n|---|---:|\n| A | 91 |\n| B | 88 |";
    const { container } = render(<Markdown>{md}</Markdown>);
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector("thead")).not.toBeNull();
    expect(container.querySelectorAll("tbody tr").length).toBe(2);
    const scored = container.querySelector(
      'th[style*="text-align: right"], th[style*="text-align:right"]',
    );
    expect(scored).not.toBeNull();
    const wrapper = container.querySelector("table")?.parentElement;
    expect(wrapper?.className).toContain("overflow-x-auto");
  });

  test("6. fenced code block renders as <pre>/<code>, not literal backticks", () => {
    const { container } = render(
      <Markdown>{"```python\nprint(\"hello\")\n```"}</Markdown>,
    );
    expect(container.querySelector("pre code")).not.toBeNull();
    expect(html(container)).not.toContain("```");
    expect(container.querySelector("pre code")?.textContent).toContain(
      'print("hello")',
    );
  });

  test("7. links are safe external anchors", () => {
    const { container } = render(
      <Markdown>{"[OpenAlex](https://openalex.org)"}</Markdown>,
    );
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://openalex.org");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toContain("noopener");
  });

  test("8. blockquote renders as <blockquote>", () => {
    const { container } = render(
      <Markdown>{"> The authors argue retrieval is the bottleneck."}</Markdown>,
    );
    expect(container.querySelector("blockquote")?.textContent).toContain(
      "retrieval is the bottleneck",
    );
  });

  test("9. raw HTML is never executed — tags are escaped as text", () => {
    const { container } = render(
      <Markdown>{"Hello<br>World <div onclick=\"alert(1)\">x</div>"}</Markdown>,
    );
    expect(container.querySelector("br")).toBeNull();
    expect(container.querySelector("div[onclick]")).toBeNull();
    expect(container.textContent).toContain("<br>");
    expect(container.textContent).toContain("<div");
  });

  test("10. [Source N] citation markers survive rendering intact", () => {
    const { container } = render(
      <Markdown>{
        "The model improves retrieval [Source 1]. Tables help [Source 2]."
      }</Markdown>,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("[Source 1]");
    expect(text).toContain("[Source 2]");
  });

  test("nested list renders inside parent list item", () => {
    const { container } = render(
      <Markdown>{"- Outer\n  - Inner A\n  - Inner B"}</Markdown>,
    );
    expect(container.querySelector("ul ul")).not.toBeNull();
  });

  test("horizontal rule renders as <hr>", () => {
    const { container } = render(<Markdown>{"---"}</Markdown>);
    expect(container.querySelector("hr")).not.toBeNull();
  });
});
