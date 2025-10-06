"use client"
import { FC, PropsWithChildren, ReactNode, useState } from "react";
import styles from "./styles.module.css"

type GenericProps = {
  id?:string;
  className?: string;  
}

export const Checkbox:  FC<PropsWithChildren<GenericProps>> = ({
  children,
  id,
  className = styles["checkbox-section"]
}) =>{

  return (
    <div id={id} className={className}>
      {children}
    </div>
  )
};

type TextLabel = {
  className?: string
}
export const CheckboxLabel: FC<PropsWithChildren<TextLabel>> = ({
  children,
  className = styles["label-text"]
})=>{
  return (
    <div className={styles["label"]}>   
      <span className={className}>{children}</span>
    </div>
  )
}

type InputType = {
  children?: ReactNode;
  disabled?: boolean;
  value?:string,
  checked: boolean;
  onChange?: (checked: boolean, e?: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export const CheckBoxInput: FC<PropsWithChildren<InputType>> = ({
  disabled = false,
  checked = false,
  value = "default value",
  onChange,
  className = styles["checkbox"],
})=>{  
  const [isChecked, setIsChecked] = useState(checked);
  const handleOnChange = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckedState = !checked;
    setIsChecked(newCheckedState => !newCheckedState);    
    if(onChange){
      onChange(newCheckedState, e)
    };
  };

  return (
    <div data-testid="checkbox">      
      <label  className={disabled ? styles["checkbox-container-disabled"] : styles["checkbox-container"]}>
        <input 
        className={disabled ? styles["checkbox-disabled"] : className}
        type="checkbox" 
        disabled={disabled}
        checked={isChecked}
        value={value}
        onChange={handleOnChange}
        />
      </label>
    </div>
  )
}