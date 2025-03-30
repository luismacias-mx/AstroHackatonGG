export const idlFactory = ({ IDL }) => {
  const BusinessID = IDL.Text;
  const Business = IDL.Record({
    'id' : BusinessID,
    'owner' : IDL.Principal,
    'logo' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'description' : IDL.Text,
    'category' : IDL.Text,
    'pointsRate' : IDL.Float64,
    'location' : IDL.Record({ 'lat' : IDL.Float64, 'lng' : IDL.Float64 }),
  });
  const UserID = IDL.Principal;
  const Points = IDL.Nat;
  return IDL.Service({
    'claimReward' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'getBusinessIds' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'getNearbyBusinesses' : IDL.Func(
        [IDL.Float64, IDL.Float64, IDL.Float64],
        [IDL.Vec(Business)],
        ['query'],
      ),
    'getTourismRecommendations' : IDL.Func(
        [UserID],
        [IDL.Vec(Business)],
        ['query'],
      ),
    'recordPurchase' : IDL.Func([BusinessID, IDL.Float64], [Points], []),
    'registerBusiness' : IDL.Func([Business], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
