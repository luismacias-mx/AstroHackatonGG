import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Debug "mo:base/Debug";

actor RewardSystem {
    // ========== TIPOS DE DATOS ==========
    public type BusinessID = Text;
    public type UserID = Principal;
    public type Points = Nat;
    public type Timestamp = Int;

    public type Business = {
        id : BusinessID;
        name : Text;
        description : Text;
        location : { lat : Float; lng : Float };
        category : Text;  // "cafe", "restaurant", "bar", "shop"
        pointsRate : Float;  // Puntos por $1 gastado (0.1 = 10 puntos por $100)
        logo : ?Text;
        owner : Principal;
    };

    public type Reward = {
        id : Text;
        businessId : BusinessID;
        name : Text;
        pointsCost : Points;
        description : Text;
        expiration : ?Timestamp;
    };

    public type UserProfile = {
        username : Text;
        totalPoints : Points;
        visitedBusinesses : [BusinessID];
        lastVisit : Timestamp;
    };

    // ========== ALMACENAMIENTO ==========
    var businesses = HashMap.HashMap<BusinessID, Business>(0, Text.equal, Text.hash);
    var rewards = HashMap.HashMap<Text, Reward>(0, Text.equal, Text.hash);
    var userProfiles = HashMap.HashMap<UserID, UserProfile>(0, Principal.equal, Principal.hash);
    var transactions = HashMap.HashMap<Text, {
        userId : UserID;
        businessId : BusinessID;
        amount : Float;
        pointsEarned : Points;
        date : Timestamp;
    }>(0, Text.equal, Text.hash);

    // ========== FUNCIONES PRINCIPALES ==========

    // Función segura para convertir Int a Nat
    func safeIntToNat(i : Int) : Nat {
        if (i < 0) 0 else Int.abs(i);
    };

    // Registra un negocio (solo el dueño puede)
    public shared({ caller }) func registerBusiness(business : Business) : async Bool {
        if (business.owner != caller) return false;
        businesses.put(business.id, business);
        Debug.print("Negocio registrado: " # business.id);
        true
    };

    // Registra una compra y otorga puntos (VERSIÓN CORREGIDA)
    public shared({ caller }) func recordPurchase(businessId : BusinessID, amount : Float) : async Points {
        Debug.print("Iniciando registro de compra...");
        
        switch (businesses.get(businessId)) {
            case null { 
                Debug.print("Error: Negocio no encontrado");
                0 
            };
            case (?business) {
                Debug.print("Datos de compra - Monto: " # Float.toText(amount) # ", Rate: " # Float.toText(business.pointsRate));
                
                // CÁLCULO CORREGIDO (evita errores de redondeo)
                let pointsEarned = Float.toInt(amount * business.pointsRate * 100) / 100;
                let pointsEarnedNat = safeIntToNat(pointsEarned);
                
                Debug.print("Puntos calculados: " # Nat.toText(pointsEarnedNat));

                let currentProfile = switch (userProfiles.get(caller)) {
                    case null {
                        Debug.print("Nuevo perfil creado");
                        { 
                            username = "";
                            totalPoints = 0;
                            visitedBusinesses = [];
                            lastVisit = Time.now();
                        }
                    };
                    case (?profile) {
                        Debug.print("Perfil existente con puntos: " # Nat.toText(profile.totalPoints));
                        profile;
                    };
                };

                let newProfile : UserProfile = {
                    username = currentProfile.username;
                    totalPoints = currentProfile.totalPoints + pointsEarnedNat;
                    visitedBusinesses = Array.append(currentProfile.visitedBusinesses, [businessId]);
                    lastVisit = Time.now();
                };

                userProfiles.put(caller, newProfile);

                let txId = Principal.toText(caller) # "-" # Int.toText(Time.now());
                transactions.put(txId, {
                    userId = caller;
                    businessId = businessId;
                    amount = amount;
                    pointsEarned = pointsEarnedNat;
                    date = Time.now();
                });

                Debug.print("Compra registrada exitosamente. Puntos otorgados: " # Nat.toText(pointsEarnedNat));
                pointsEarnedNat
            }
        }
    };

    // Obtiene negocios cercanos (para el mapa)
    public query func getNearbyBusinesses(lat : Float, lng : Float, radius : Float) : async [Business] {
        Array.filter(
            Iter.toArray(businesses.vals()),
            func(b : Business) : Bool {
                let latDiff = b.location.lat - lat;
                let lngDiff = b.location.lng - lng;
                (latDiff * latDiff + lngDiff * lngDiff) <= (radius * radius)
            }
        )
    };

    // Canjea una recompensa
    public shared({ caller }) func claimReward(rewardId : Text) : async Bool {
        switch (rewards.get(rewardId), userProfiles.get(caller)) {
            case (?reward, ?profile) {
                if (profile.totalPoints >= reward.pointsCost) {
                    let updatedProfile : UserProfile = {
                        username = profile.username;
                        totalPoints = profile.totalPoints - reward.pointsCost;
                        visitedBusinesses = profile.visitedBusinesses;
                        lastVisit = profile.lastVisit;
                    };
                    userProfiles.put(caller, updatedProfile);
                    true
                } else { false }
            };
            case _ { false }
        }
    };

    // Recomendaciones de Turismo 3.0
    public query func getTourismRecommendations(user : UserID) : async [Business] {
        switch (userProfiles.get(user)) {
            case null { [] };
            case (?profile) {
                Array.filter(
                    Iter.toArray(businesses.vals()),
                    func(b : Business) : Bool {
                        switch (Array.find<BusinessID>(profile.visitedBusinesses, func(id : BusinessID) : Bool { id == b.id })) {
                            case null { true };  // No visitado
                            case _ { false }     // Visitado
                        }
                    }
                )
            }
        }
    };

    // Función adicional para debug
    public query func getBusinessIds() : async [Text] {
        Iter.toArray(businesses.keys())
    };
};

