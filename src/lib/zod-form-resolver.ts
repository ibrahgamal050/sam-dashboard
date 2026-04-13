import { zodResolver } from "@hookform/resolvers/zod"
import type { FieldValues, Resolver } from "react-hook-form"
import type { ZodTypeAny } from "zod"

export const zodFormResolver = <TFieldValues extends FieldValues>(
  schema: ZodTypeAny,
): Resolver<TFieldValues> => zodResolver(schema as never) as Resolver<TFieldValues>
