import React from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useValueContext, useStateContext } from "./hooks";
import { TypeFunctionExpression } from "./types";
import { describe, expect, it, afterEach } from "vitest";
import { createContext, useCallback, useMemo, useState } from "react";

/* Se simula un contexto con su state  y setter correspondiente
Se crea su correspondiente contexto para poder acceder al valor actual
Se hace uso de los hooks expuestos en los tests para poder manipular de forma eficiente el estado.
*/

const c = createContext({
  state: "",
  setter: (newValue: TypeFunctionExpression<string>): void => {
    newValue;
  },
});
const initialValue = "";

const Provider = ({ children }: { children: any }) => {
  const [state, setState] = useState(initialValue);
  const setter = useCallback((newValue: TypeFunctionExpression<string>) => {
    setState(newValue);
  }, []);
  const context = useMemo(
    () => ({
      state,
      setter,
    }),
    [state, setter],
  );
  return <c.Provider value={context}>{children}</c.Provider>;
};

const wrapper = ({ children }: { children: any }) => {
  return <Provider>{children}</Provider>;
};

describe("Custom hook useValueContext", () => {
  afterEach(cleanup);

  it("Should render initial value", () => {
    const { result } = renderHook(() => useValueContext<string>(c), {
      wrapper,
    });
    expect(result.current).toEqual("");
  });
});

//NOTE: result.current === [state, setState] > result.current[0] === state

describe("Custom hook useStateContext", () => {
  afterEach(cleanup);
  it("Should render initial value", () => {
    const { result } = renderHook(() => useStateContext<string>(c), {
      wrapper,
    });
    expect(result.current[0]).toEqual("");
  });
  it("Should update new value with setter function (setState)", () => {
    const { result } = renderHook(() => useStateContext<string>(c), {
      wrapper,
    });
    expect(result.current[0]).toEqual("");
    act(() => result.current[1]("Hello"));
    expect(result.current[0]).toEqual("Hello");
  });
});
