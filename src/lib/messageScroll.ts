import { useEffect, useRef } from "react";

/** Scroll chat to bottom only when new messages arrive — avoids UI jump on read-receipt updates. */
export function useScrollToBottomOnNewMessages(
  messagesLength: number,
  bottomRef: React.RefObject<HTMLDivElement | null>,
) {
  const prevLen = useRef(0);
  useEffect(() => {
    if (messagesLength > prevLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLen.current = messagesLength;
  }, [messagesLength, bottomRef]);
}
