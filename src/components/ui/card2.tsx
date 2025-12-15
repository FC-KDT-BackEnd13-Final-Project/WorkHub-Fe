import * as React from "react";
import { cn } from "./utils";
import {
  Card as BaseCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent as BaseCardContent,
} from "./card";

function CardContent({ className, ...props }: React.ComponentProps<typeof BaseCardContent>) {
  return <BaseCardContent className={cn("[&:last-child]:pb-0", className)} {...props} />;
}

const Card2 = ({ variant = "surface", ...props }: React.ComponentProps<typeof BaseCard>) => (
  <BaseCard variant={variant} {...props} />
);

export {
  Card2,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
