/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as aiAssistant from "../aiAssistant.js";
import type * as aiSettings from "../aiSettings.js";
import type * as announcements from "../announcements.js";
import type * as appSettings from "../appSettings.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as buses from "../buses.js";
import type * as commissions from "../commissions.js";
import type * as companions from "../companions.js";
import type * as drivers from "../drivers.js";
import type * as email from "../email.js";
import type * as emailActions from "../emailActions.js";
import type * as emailCrons from "../emailCrons.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as offices from "../offices.js";
import type * as otp from "../otp.js";
import type * as packages from "../packages.js";
import type * as passwordReset from "../passwordReset.js";
import type * as payments from "../payments.js";
import type * as public_ from "../public.js";
import type * as reviews from "../reviews.js";
import type * as router from "../router.js";
import type * as seed from "../seed.js";
import type * as sms from "../sms.js";
import type * as smsActions from "../smsActions.js";
import type * as support from "../support.js";
import type * as trips from "../trips.js";
import type * as wallet from "../wallet.js";
import type * as whatsapp from "../whatsapp.js";
import type * as whatsappActions from "../whatsappActions.js";
import type * as whatsappHelpers from "../whatsappHelpers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  aiAssistant: typeof aiAssistant;
  aiSettings: typeof aiSettings;
  announcements: typeof announcements;
  appSettings: typeof appSettings;
  attendance: typeof attendance;
  auth: typeof auth;
  bookings: typeof bookings;
  buses: typeof buses;
  commissions: typeof commissions;
  companions: typeof companions;
  drivers: typeof drivers;
  email: typeof email;
  emailActions: typeof emailActions;
  emailCrons: typeof emailCrons;
  http: typeof http;
  notifications: typeof notifications;
  offices: typeof offices;
  otp: typeof otp;
  packages: typeof packages;
  passwordReset: typeof passwordReset;
  payments: typeof payments;
  public: typeof public_;
  reviews: typeof reviews;
  router: typeof router;
  seed: typeof seed;
  sms: typeof sms;
  smsActions: typeof smsActions;
  support: typeof support;
  trips: typeof trips;
  wallet: typeof wallet;
  whatsapp: typeof whatsapp;
  whatsappActions: typeof whatsappActions;
  whatsappHelpers: typeof whatsappHelpers;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
