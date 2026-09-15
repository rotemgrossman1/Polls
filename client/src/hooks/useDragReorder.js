import { useEffect, useRef, useState } from 'react';
import { computeDragLayout, getTargetIndex } from '../utils/dragLayout';

// Distance from the viewport edge that starts auto-scroll, and scroll per frame.
const AUTO_SCROLL_EDGE_PX = 48;
const AUTO_SCROLL_STEP_PX = 8;

/**
 * Pointer-based drag to reorder (mouse, touch, pen), started from a handle.
 * - containerRef: element wrapping the rows; rowSelector matches each row in order.
 * - onMove(from, to): called on drop when the position changed.
 * Returns the current drag layout (null when idle) and props for each handle.
 */
export default function useDragReorder({ containerRef, rowSelector, onMove, disabled = false }) {
  const [drag, setDrag] = useState(null);
  const sessionRef = useRef(null);
  const frameRef = useRef(null);

  const containerTop = () => containerRef.current.getBoundingClientRect().top;

  function measure() {
    const top = containerTop();
    const rects = Array.from(containerRef.current.querySelectorAll(rowSelector)).map((row) =>
      row.getBoundingClientRect(),
    );
    return {
      tops: rects.map((rect) => rect.top - top),
      heights: rects.map((rect) => rect.height),
      gap: rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0,
    };
  }

  function update(clientY) {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    session.lastClientY = clientY;
    const offset = clientY - containerTop() - session.startY;
    const centers = session.tops.map((top, index) => top + session.heights[index] / 2);
    session.target = getTargetIndex(centers, session.from, centers[session.from] + offset);
    const { shifts, slotTop } = computeDragLayout({ ...session, target: session.target });

    setDrag({
      from: session.from,
      target: session.target,
      offset,
      shifts,
      slotTop,
      slotHeight: session.heights[session.from],
    });
  }

  function stopAutoScroll() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function autoScroll() {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    let step = 0;
    if (session.lastClientY < AUTO_SCROLL_EDGE_PX) {
      step = -AUTO_SCROLL_STEP_PX;
    } else if (session.lastClientY > window.innerHeight - AUTO_SCROLL_EDGE_PX) {
      step = AUTO_SCROLL_STEP_PX;
    }
    if (step !== 0) {
      window.scrollBy(0, step);
      update(session.lastClientY);
    }
    frameRef.current = requestAnimationFrame(autoScroll);
  }

  function end(commit) {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    sessionRef.current = null;
    stopAutoScroll();
    setDrag(null);
    if (commit && session.target !== session.from) {
      onMove(session.from, session.target);
    }
  }

  // Escape cancels a drag.
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) {
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        end(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => stopAutoScroll, []);

  function getHandleProps(index) {
    return {
      onPointerDown: (event) => {
        const isSecondaryMouseButton = event.pointerType === 'mouse' && event.button !== 0;
        if (disabled || sessionRef.current || isSecondaryMouseButton) {
          return;
        }
        event.preventDefault();
        if (event.currentTarget.setPointerCapture) {
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        sessionRef.current = {
          ...measure(),
          from: index,
          target: index,
          startY: event.clientY - containerTop(),
          lastClientY: event.clientY,
        };
        update(event.clientY);
        frameRef.current = requestAnimationFrame(autoScroll);
      },
      onPointerMove: (event) => update(event.clientY),
      onPointerUp: () => end(true),
      onPointerCancel: () => end(false),
    };
  }

  return { drag, getHandleProps };
}
