import { SimulatedEmailService, type EmailService } from "./email";
import { SimulatedNotificationService, type NotificationService } from "./notifications";
import { LocalSignatureService, type SignatureService } from "./signature";
import { LocalPhotoStorage, type PhotoStorage } from "./storage";

/**
 * Point d'injection unique des services externes.
 * Pour passer en production, il suffit de remplacer ici les implémentations
 * locales / simulées par les implémentations connectées.
 */
export interface Services {
  photos: PhotoStorage;
  notifications: NotificationService;
  email: EmailService;
  signature: SignatureService;
}

export const services: Services = {
  photos: new LocalPhotoStorage(),
  notifications: new SimulatedNotificationService(),
  email: new SimulatedEmailService(),
  signature: new LocalSignatureService(),
};
