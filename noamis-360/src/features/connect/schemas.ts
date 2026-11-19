import { z } from "zod";
import { optionalText, optionalUuid, requiredText, uuid } from "@/lib/validation/common";

export const messageSchema = z.object({
  client_id: uuid,
  mission_id: optionalUuid,
  body: requiredText("Message", 1, 5000),
});

export const clientMessageSchema = z.object({ body: requiredText("Message", 1, 5000), mission_id: optionalUuid });

export const approvalSchema = z.object({
  client_id: uuid,
  mission_id: optionalUuid,
  document_id: optionalUuid,
  title: requiredText("Objet", 3, 200),
  description: optionalText(3000),
});

export const responseSchema = z.object({ accept: z.boolean(), comment: optionalText(2000) });
