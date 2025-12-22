import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_EVENT = "workhub:local-storage";

type UseLocalStorageValueOptions<T> = {
  defaultValue: T | (() => T);
  parser?: (value: string) => T;
  serializer?: (value: T) => string;
  sync?: boolean;
  listen?: boolean;
};

type StorageEventDetail<T> = {
  key: string;
  value: T;
};

/**
 * 로컬 스토리지와 React 상태를 동기화하는 커스텀 훅.
 * 파싱/직렬화, storage 이벤트 리스너, 탭 간 브로드캐스트를 모두 한 곳에서 처리한다.
 */
export function useLocalStorageValue<T>(
  key: string,
  {
    defaultValue,
    parser = JSON.parse,
    serializer = JSON.stringify,
    sync = true,
    listen = true,
  }: UseLocalStorageValueOptions<T>,
) {
  const defaultValueRef = useRef(defaultValue);
  const parserRef = useRef(parser);
  const serializerRef = useRef(serializer);

  useEffect(() => {
    defaultValueRef.current = defaultValue;
  }, [defaultValue]);

  useEffect(() => {
    parserRef.current = parser;
  }, [parser]);

  useEffect(() => {
    serializerRef.current = serializer;
  }, [serializer]);

  const resolveDefault = useCallback(() => {
    const current = defaultValueRef.current;
    return typeof current === "function" ? (current as () => T)() : current;
  }, []);

  const readValue = useCallback(() => {
    if (typeof window === "undefined") return resolveDefault();
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) {
        return resolveDefault();
      }
      return parserRef.current(storedValue);
    } catch (error) {
      console.error(`Failed to read key "${key}" from localStorage`, error);
      return resolveDefault();
    }
  }, [key, resolveDefault]);

  const [value, setValue] = useState<T>(() => readValue());
  const valueRef = useRef(value);

  const broadcastChange = useCallback(
    (next: T) => {
      if (!listen || typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent<StorageEventDetail<T>>(STORAGE_EVENT, {
          detail: { key, value: next },
        }),
      );
    },
    [key, listen],
  );

  const setStoredValue = useCallback(
    (updater: T | ((previous: T) => T)) => {
      const nextValue = typeof updater === "function" ? (updater as (prev: T) => T)(valueRef.current) : updater;
      valueRef.current = nextValue;
      setValue(nextValue);
      if (typeof window !== "undefined" && sync) {
        try {
          window.localStorage.setItem(key, serializerRef.current(nextValue));
          broadcastChange(nextValue);
        } catch (error) {
          console.error(`Failed to store key "${key}" in localStorage`, error);
        }
      }
    },
    [broadcastChange, key, sync],
  );

  const removeValue = useCallback(() => {
    const defaultVal = resolveDefault();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
      broadcastChange(defaultVal);
    }
    valueRef.current = defaultVal;
    setValue(defaultVal);
  }, [broadcastChange, key, resolveDefault]);

  useEffect(() => {
    const nextValue = readValue();
    // 값이 실제로 변경되었을 때만 setState 호출 (무한 루프 방지)
    if (JSON.stringify(valueRef.current) !== JSON.stringify(nextValue)) {
      valueRef.current = nextValue;
      setValue(nextValue);
    }
  }, [key, readValue]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!listen || typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        const nextValue = event.newValue === null ? resolveDefault() : parserRef.current(event.newValue);
        valueRef.current = nextValue;
        setValue(nextValue);
      }
    };
    const handleCustomStorage = (event: Event) => {
      const customEvent = event as CustomEvent<StorageEventDetail<T>>;
      if (customEvent.detail?.key === key) {
        valueRef.current = customEvent.detail.value;
        setValue(customEvent.detail.value);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORAGE_EVENT, handleCustomStorage as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORAGE_EVENT, handleCustomStorage as EventListener);
    };
  }, [key, listen, resolveDefault]);

  return [value, setStoredValue, removeValue] as const;
}
