import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Business {
  'id' : BusinessID,
  'owner' : Principal,
  'logo' : [] | [string],
  'name' : string,
  'description' : string,
  'category' : string,
  'pointsRate' : number,
  'location' : { 'lat' : number, 'lng' : number },
}
export type BusinessID = string;
export type Points = bigint;
export type UserID = Principal;
export interface _SERVICE {
  'claimReward' : ActorMethod<[string], boolean>,
  'getBusinessIds' : ActorMethod<[], Array<string>>,
  'getNearbyBusinesses' : ActorMethod<
    [number, number, number],
    Array<Business>
  >,
  'getTourismRecommendations' : ActorMethod<[UserID], Array<Business>>,
  'recordPurchase' : ActorMethod<[BusinessID, number], Points>,
  'registerBusiness' : ActorMethod<[Business], boolean>,
}
