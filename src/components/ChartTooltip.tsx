import { useMotionConfig } from "@nivo/core";
import { animated, useSpring } from "@react-spring/web";
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
  const { animate, config } = useMotionConfig();
  const [motion, spring] = useSpring(() => ({ x: 0, y: 0 }));
  const host = document
    .getElementById("better-bookwalker")
    ?.shadowRoot?.querySelector("dialog");
  useLayoutEffect(() => {
    const tip = element.current;
    if (!tip) return;
    let first = true;
    const position = () => {
      const { x, y } = pointer.current ?? { x: 0, y: 0 };
      const { height, width } = tip.getBoundingClientRect();
      const gap = 18;
      const left =
        x + gap + width <= innerWidth - 12 ? x + gap : x - width - gap;
      const top =
        y + gap + height <= innerHeight - 12 ? y + gap : y - height - gap;
      void spring.start({
        config: { ...config, clamp: true },
        immediate: first || !animate,
        x: Math.max(12, Math.min(left, innerWidth - width - 12)),
        y: Math.max(12, Math.min(top, innerHeight - height - 12)),
      });
      first = false;
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
  }, [animate, config, pointer, spring]);
  return host
    ? createPortal(
        <animated.div
          className="nivo-tip"
          ref={element}
          role="tooltip"
          style={motion}
        >
          {children}
        </animated.div>,
        host,
      )
    : null;
}
