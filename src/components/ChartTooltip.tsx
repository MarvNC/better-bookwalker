import { ReactNode, RefObject, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Keep the tooltip in the dialog's top layer, outside chart overflow containers.
export default function ChartTooltip({
  children,
  pointer,
}: {
  children: ReactNode;
  pointer: RefObject<{ x: number; y: number }>;
}) {
  const element = useRef<HTMLDivElement>(null);
  const host = document
    .getElementById("better-bookwalker")
    ?.shadowRoot?.querySelector("dialog");
  useLayoutEffect(() => {
    const tip = element.current;
    if (!tip) return;
    const position = () => {
      const { x, y } = pointer.current ?? { x: 0, y: 0 };
      const { height, width } = tip.getBoundingClientRect();
      const gap = 18;
      const left =
        x + gap + width <= innerWidth - 12 ? x + gap : x - width - gap;
      const top =
        y + gap + height <= innerHeight - 12 ? y + gap : y - height - gap;
      tip.style.left = `${Math.max(12, Math.min(left, innerWidth - width - 12))}px`;
      tip.style.top = `${Math.max(12, Math.min(top, innerHeight - height - 12))}px`;
    };
    const move = (event: PointerEvent) => {
      if (pointer.current) {
        pointer.current.x = event.clientX;
        pointer.current.y = event.clientY;
      }
      position();
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(tip);
    window.addEventListener("pointermove", move);
    window.addEventListener("resize", position);
    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", position);
    };
  }, [pointer]);
  return host
    ? createPortal(
        <div className="nivo-tip" ref={element} role="tooltip">
          {children}
        </div>,
        host,
      )
    : null;
}
