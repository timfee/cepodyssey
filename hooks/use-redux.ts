import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";

/** Typed version of `useDispatch`. */
export const useAppDispatch: () => AppDispatch = useDispatch;
/** Typed version of `useSelector`. */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
