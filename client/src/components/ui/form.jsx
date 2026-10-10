import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form";

import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormField = ({ ...props }) => {
  return <Controller {...props} />;
};
FormField.displayName = "FormField";

const FormItemContext = React.createContext({});

const FormItem = React.forwardRef(function FormItem(
  { className, ...props },
  ref
) {
  return (
    <FormItemContext.Provider value={{}}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef(function FormLabel(
  { className, ...props },
  ref
) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef(function FormControl(
  { className, ...props },
  ref
) {
  return <Slot ref={ref} className={className} {...props} />;
});
FormControl.displayName = "FormControl";

const FormMessage = React.forwardRef(function FormMessage(
  { className, children, ...props },
  ref
) {
  const { formState } = useFormContext();
  const id = React.useId();
  const error =
    formState.errors &&
    props.name &&
    formState.errors[props.name]?.message;

  return (
    <p
      ref={ref}
      id={id}
      className={cn("text-xs font-medium text-red-600", className)}
      {...props}
    >
      {children || (typeof error === "string" ? error : null)}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export { Form, FormItem, FormLabel, FormControl, FormMessage, FormField };

