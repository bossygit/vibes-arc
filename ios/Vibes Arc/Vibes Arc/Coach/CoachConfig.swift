//
//  CoachConfig.swift
//  Vibes Arc
//
//  Configuration de l'Edge Function `coach-chat` : base URL + clé API.
//  La clé est lue via Info.plist (clé `COACH_API_KEY`), alimentée par un
//  build setting ou un xcconfig non versionné. Fallback: constante embarquée
//  identique à l'API key utilisée par les autres clients (acceptable pour une
//  app perso mono-utilisateur).
//

import Foundation

enum CoachConfig {
    /// Base URL de l'Edge Function Supabase `coach-chat`.
    static let baseURL = URL(string: "https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-chat")!

    /// URL Edge Function `coach-api` (utilisée pour /insights).
    static let coachApiBaseURL = URL(string: "https://knpvbwlfdriavrebvzdy.supabase.co/functions/v1/coach-api")!

    /// Anon key Supabase (JWT) exigée en `Authorization: Bearer` par le gateway
    /// des Edge Functions Supabase, même quand `verify_jwt=false`.
    /// Lue depuis Info.plist (`SUPABASE_ANON_KEY`), sinon fallback constante.
    static var supabaseAnonKey: String {
        if let v = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
           !v.isEmpty {
            return v
        }
        return Self.embeddedSupabaseAnonKey
    }

    /// Clé API métier `COACH_API_KEY` attendue par les fonctions coach-*.
    /// Lue depuis Info.plist, sinon fallback constante embarquée.
    static var apiKey: String {
        if let v = Bundle.main.object(forInfoDictionaryKey: "COACH_API_KEY") as? String,
           !v.isEmpty {
            return v
        }
        return Self.embeddedApiKey
    }

    // ── Fallback embarqué (source : COACH_API.md + .env.local) ─────────────
    // NOTE: la clé est déjà utilisée côté n8n/Telegram. Pour durcir, déplacer
    // vers un xcconfig non tracké et laisser seulement la version Info.plist.
    private static let embeddedApiKey =
        "f0b95ce832383809116f190cbcb51c369e1dcd563ef89398f7a561dbec4809dc"

    private static let embeddedSupabaseAnonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtucHZid2xmZHJpYXZyZWJ2emR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTYxNTEsImV4cCI6MjA3NTU5MjE1MX0.m2v3QJ61IbEprZrJ4KTOCxfvmd3YH881sU4Gu3IZmVA"
}
