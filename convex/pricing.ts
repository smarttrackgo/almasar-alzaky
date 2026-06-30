const DEFAULT_OFFICE_COMMISSION_RATE = 5;
const DEFAULT_PASSENGER_FEE_RATE = 0;

async function getSettingNumber(ctx: any, key: string, fallback: number): Promise<number> {
  const setting = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  const value = setting ? Number(setting.value) : fallback;
  return Number.isFinite(value) ? value : fallback;
}

export async function getOfficeCommissionRate(ctx: any, officeId: string): Promise<number> {
  const office = await ctx.db.get(officeId);
  if (office?.commissionRate !== undefined) return office.commissionRate;
  return await getSettingNumber(ctx, "commission_rate", DEFAULT_OFFICE_COMMISSION_RATE);
}

export async function getPassengerFeeRate(ctx: any, officeId: string): Promise<number> {
  const office = await ctx.db.get(officeId);
  if (office?.passengerCommissionRate !== undefined) return office.passengerCommissionRate;
  return await getSettingNumber(ctx, "passenger_commission_rate", DEFAULT_PASSENGER_FEE_RATE);
}

export async function calculatePackagePricing(ctx: any, officeId: string, officeBasePrice: number) {
  const officeCommissionRate = await getOfficeCommissionRate(ctx, officeId);
  const passengerFeeRate = await getPassengerFeeRate(ctx, officeId);
  const passengerFeePerPerson = Math.round((officeBasePrice * passengerFeeRate) / 100);
  const passengerPrice = officeBasePrice + passengerFeePerPerson;
  const officeCommissionPerPerson = Math.round((officeBasePrice * officeCommissionRate) / 100);
  const officeNetPerPerson = officeBasePrice - officeCommissionPerPerson;

  return {
    officeBasePrice,
    displayPrice: passengerPrice,
    passengerPrice,
    passengerFeeRate,
    passengerFeePerPerson,
    officeCommissionRate,
    officeCommissionPerPerson,
    officeNetPerPerson,
  };
}

export function calculateBookingPricing(
  officeBasePrice: number,
  adultsCount: number,
  childrenCount: number | undefined,
  officeCommissionRate: number,
  passengerFeeRate: number,
) {
  const passengerUnits = adultsCount + ((childrenCount ?? 0) * 0.5);
  const officeBaseAmount = Math.round(officeBasePrice * passengerUnits);
  const passengerFeeAmount = Math.round((officeBaseAmount * passengerFeeRate) / 100);
  const totalPrice = officeBaseAmount + passengerFeeAmount;
  const officeCommissionAmount = Math.round((officeBaseAmount * officeCommissionRate) / 100);
  const officeNetAmount = officeBaseAmount - officeCommissionAmount;
  const platformRevenue = passengerFeeAmount + officeCommissionAmount;

  return {
    passengerUnits,
    officeBaseAmount,
    passengerFeeRate,
    passengerFeeAmount,
    totalPrice,
    officeCommissionRate,
    officeCommissionAmount,
    officeNetAmount,
    platformRevenue,
  };
}
